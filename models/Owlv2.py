from warnings import simplefilter
simplefilter(action="ignore")

import torch

from transformers import Owlv2Processor, Owlv2ForObjectDetection

from ..utils.detect_utils import DetectUtils

class Owlv2:
  MODEL_NAME = "google/owlv2-large-patch14-ensemble"
  DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

  def __init__(self, model=None):
    model_name = Owlv2.MODEL_NAME if model is None else model
    self.processor = Owlv2Processor.from_pretrained(model_name)
    self.model = Owlv2ForObjectDetection.from_pretrained(model_name).to(Owlv2.DEVICE)

  def run_object_detection(self, img, tholds):
    labels = list(tholds.keys())
    input = self.processor(text=labels, images=img, return_tensors="pt").to(Owlv2.DEVICE)
    with torch.no_grad():
      obj_out = self.model(**input)

    res = self.processor.post_process_object_detection(outputs=obj_out, target_sizes=[DetectUtils.TARGET_SIZE])
    slbs = zip(res[0]["scores"], res[0]["labels"], res[0]["boxes"])
    iw, ih = img.size

    detected_objs = [{"score": round(s.item(), 3), "label": labels[l.item()], "box": DetectUtils.px_to_pct(b, iw, ih)}
                     for s,l,b in slbs if DetectUtils.threshold(s, labels[l.item()], b, tholds, iw, ih)]
    return detected_objs

  def top_objects(self, img, tholds):
    detected_objs = self.run_object_detection(img, tholds)
    by_label_score = sorted(detected_objs, key=lambda x: (x["label"], x["score"]))
    unique_label = {o["label"]: o for o in by_label_score}
    return list(unique_label.values())

  def all_objects(self, img, tholds):
    detected_objs = self.run_object_detection(img, tholds)
    return detected_objs

  def iou_objects(self, img, tholds):
    detected_objs = self.run_object_detection(img, tholds)
    ioud_objs = DetectUtils.filter_by_iou(detected_objs, iou_thold=0.8)
    return ioud_objs
