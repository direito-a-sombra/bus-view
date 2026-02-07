from warnings import simplefilter
simplefilter(action="ignore")

import easyocr

from PIL import Image as PImage, ImageEnhance as PImageEnhance
from torch import cuda

from transformers import TrOCRProcessor, VisionEncoderDecoderModel

class Ocr:
  MODEL_NAME = "microsoft/trocr-large-str"
  DEVICE = "cuda" if cuda.is_available() else "cpu"

  def __init__(self, model=None):
    model_name = Ocr.MODEL_NAME if model is None else model
    self.processor = TrOCRProcessor.from_pretrained(model_name)
    self.model = VisionEncoderDecoderModel.from_pretrained(model_name).to(Ocr.DEVICE)
    self.reader = easyocr.Reader(["pt", "en"])

  @classmethod
  def valid_area(cls, box, thold):
    (x0, y0), (x1, y1) = box[0], box[2]
    ba = (x1 - x0) * (y1 - y0)
    return ba > thold

  def run_reader(self, fpath, area_thold, score_thold):
    result = self.reader.readtext(fpath)
    filtered = [(b[0], b[2]) for b,t,s in result if Ocr.valid_area(b, area_thold) and s > score_thold]
    return filtered

  def top_words(self, fpath, area_thold, score_thold=0.02):
    result = self.reader.readtext(fpath)
    mimg = PImage.open(fpath).convert("L").convert("RGB")

    words = []
    for b,t,s in result:
      if not (Ocr.valid_area(b, area_thold) and s > score_thold): continue

      (x0, y0), (x1, y1) = b[0], b[2]
      enhancer = PImageEnhance.Contrast(mimg.crop((x0,y0,x1,y1)))
      wimg = enhancer.enhance(2.0)

      pixel_values = self.processor(images=wimg, return_tensors="pt").pixel_values.to(Ocr.DEVICE)
      generated_ids = self.model.generate(pixel_values)
      generated_text = self.processor.batch_decode(generated_ids, skip_special_tokens=True)
      words += generated_text

    return words

  def all_words(self, fpath):
    return self.top_words(fpath, 0, 0)
