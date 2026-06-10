from warnings import simplefilter
simplefilter(action="ignore")

import sys
import torch

from transformers import AutoProcessor, AutoModelForZeroShotObjectDetection 

sys.path.append("..")
from utils.detect_utils import DetectUtils

class Dino:
  MODEL_NAME = "IDEA-Research/grounding-dino-base"
  DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

  def __init__(self, model=None):
    model_name = Dino.MODEL_NAME if model is None else model
    self.processor = AutoProcessor.from_pretrained(model_name)
    self.model = AutoModelForZeroShotObjectDetection.from_pretrained(model_name).to(Dino.DEVICE)

  def run_object_detection(self, img, tholds):
    labels = list(tholds.keys())
    labels_txt = (". ").join(labels) + "."
    input = self.processor(text=labels_txt, images=img, return_tensors="pt").to(Dino.DEVICE)
    with torch.no_grad():
      obj_out = self.model(**input)

    res = self.processor.post_process_grounded_object_detection(outputs=obj_out, target_sizes=[DetectUtils.TARGET_SIZE])
    slbs = zip(res[0]["scores"], res[0]["labels"], res[0]["boxes"])
    iw, ih = img.size

    detected_objs = [{"score": round(s.item(), 3), "label": l, "box": DetectUtils.px_to_pct(b, iw, ih)}
                     for s,l,b in slbs if DetectUtils.threshold(s, l.split(" ")[0], b, tholds, iw, ih)]
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
