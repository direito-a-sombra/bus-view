from torch import cuda
from ultralytics import YOLO

class Yolo:
  MODEL_NAME = "yolo11l"
  DEVICE = "cuda" if cuda.is_available() else "cpu"

  @classmethod
  # filter if box "too large" or "too small"
  def threshold(cls, score, label, box_pct, tholds):
    box_width = box_pct[2] - box_pct[0]
    box_height = box_pct[3] - box_pct[1]
    good_min = box_width > 0.023 and box_height > 0.03
    good_max = box_width < 0.8 or box_height < 0.8
    return good_min and good_max and label in tholds and score > tholds[label]

  def __init__(self, model=None):
    model_name = Yolo.MODEL_NAME if model is None else model
    self.model = YOLO(f"{model_name}.pt")

  def run_object_detection(self, img, tholds):
    # TODO: pass label ids to predict: predict(classes=labelIDs, ...)
    res = self.model.predict(source=img, imgsz=(640, 640), conf=0.15, device=Yolo.DEVICE, verbose=False)
    slbs = zip(res[0].boxes.conf, res[0].boxes.cls.int(), res[0].boxes.xyxyn)

    detected_objs = [{"score": round(s.item(), 3), "label": res[0].names[l.item()], "box": b.cpu().tolist()}
                     for s,l,b in slbs if Yolo.threshold(s, res[0].names[l.item()], b, tholds)]
    return detected_objs

  def top_objects(self, img, tholds):
    detected_objs = self.run_object_detection(img, tholds)
    by_label_score = sorted(detected_objs, key=lambda x: (x["label"], x["score"]))
    unique_label = {o["label"]: o for o in by_label_score}
    return list(unique_label.values())

  def all_objects(self, img, tholds):
    detected_objs = self.run_object_detection(img, tholds)
    return detected_objs
