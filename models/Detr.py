from warnings import simplefilter
simplefilter(action="ignore")

import torch

from transformers import AutoImageProcessor, DetrForObjectDetection

from ..utils.detect_utils import DetectUtils

class Detr:
  MODEL_NAME = "facebook/detr-resnet-101"
  DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

  def __init__(self, model=None):
    model_name = Detr.MODEL_NAME if model is None else model
    self.processor = AutoImageProcessor.from_pretrained(model_name)
    self.model = DetrForObjectDetection.from_pretrained(model_name).to(Detr.DEVICE)
    self.id2label = self.model.config.id2label

  def run_object_detection(self, img, tholds):
    input = self.processor(images=img, return_tensors="pt").to(Detr.DEVICE)

    with torch.no_grad():
      obj_out = self.model(**input)

    res = self.processor.post_process_object_detection(outputs=obj_out, target_sizes=[DetectUtils.TARGET_SIZE])
    slbs = zip(res[0]["scores"], res[0]["labels"], res[0]["boxes"])
    iw, ih = img.size

    detected_objs = [{"score": round(s.item(), 3), "label": self.id2label[l.item()], "box": DetectUtils.px_to_pct(b, iw, ih)}
                     for s,l,b in slbs if DetectUtils.threshold(s, self.id2label[l.item()], b, tholds, iw, ih)]
    return detected_objs

  def top_objects(self, img, tholds):
    detected_objs = self.run_object_detection(img, tholds)
    by_label_score = sorted(detected_objs, key=lambda x: (x["label"], x["score"]))
    unique_label = {o["label"]: o for o in by_label_score}
    return list(unique_label.values())

  def all_objects(self, img, tholds):
    detected_objs = self.run_object_detection(img, tholds)
    return detected_objs
