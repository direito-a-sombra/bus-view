import torch

OBJECT_THRESHOLDS = {
  "palm": 0.15,
  "person": 0.15,
  "tree": 0.15,
}

OBJECT2LABEL = {
  "palm": "tree",
}

OBJS_LABELS_IN = list(sorted(OBJECT_THRESHOLDS.keys()))
OBJS_LABELS_OUT = [OBJECT2LABEL.get(l, l) for l in OBJS_LABELS_IN]

class DetectUtils:
  TARGET_SIZE = torch.Tensor([500, 500])

  def px_to_pct(box, img_w, img_h):
    scale_factor = torch.tensor([max(img_w, img_h) / img_w , max(img_w, img_h) / img_h])
    img_dims = DetectUtils.TARGET_SIZE / scale_factor
    return [round(x, 4) for x in (box.cpu().reshape(2, -1) / img_dims).reshape(-1).tolist()]

  # filter if box "too large" or "too small"
  def threshold(score, label, box, tholds, img_w, img_h):
    box_pct = DetectUtils.px_to_pct(box, img_w, img_h)
    box_width = box_pct[2] - box_pct[0]
    box_height = box_pct[3] - box_pct[1]
    good_min = box_width > 0.023 and box_height > 0.03
    good_max = box_width < 0.8 or box_height < 0.8
    return good_min and good_max and label in tholds and score > tholds[label]

  def iou(boxA, boxB, return_areas=False):
    # determine the (x, y)-coordinates of the intersection rectangle
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])

    # compute the area of intersection rectangle
    intersection = max(0, xB - xA + 1) * max(0, yB - yA + 1)

    areaA = (boxA[2] - boxA[0] + 1) * (boxA[3] - boxA[1] + 1)
    areaB = (boxB[2] - boxB[0] + 1) * (boxB[3] - boxB[1] + 1)

    iou = intersection / float(areaA + areaB - intersection)

    if return_areas:
      return iou, intersection, areaA, areaB
    else:
      return iou

  def remove_duplicate_by_score(detected_objs):
    keep = detected_objs[:1]
    for boxObjA in detected_objs[1:]:
      new_keep = []
      boxA = boxObjA["box"]
      scoreA = boxObjA["score"]
      keepA = True
      for boxObjB in keep:
        boxB = boxObjB["box"]
        scoreB = boxObjB["score"]
        same_box = sum([abs(axy - bxy) for axy, bxy in zip(boxA, boxB)]) < 0.001

        if not same_box:
          new_keep.append(boxObjB)
        elif scoreA < scoreB:
          keepA = False
          new_keep.append(boxObjB)

      if keepA:
        new_keep.append(boxObjA)

      keep = new_keep[:]
    return keep

  def filter_by_iou(detected_objs, iou_thold=0.8, iou_per_label=False):
    objs_to_filter = detected_objs if iou_per_label else DetectUtils.remove_duplicate_by_score(detected_objs)
    by_label = {}
    for obj in objs_to_filter:
      obj_label = obj["label"] if iou_per_label else "all"
      by_label[obj_label] = by_label.get(obj_label, []) + [obj]

    ioud_by_label = {}
    for k, all_boxes in by_label.items():
      keep = all_boxes[:1]
      for boxObjA in all_boxes[1:]:
        new_keep = []
        boxA = boxObjA["box"]
        keepA = True
        for boxObjB in keep:
          boxB = boxObjB["box"]
          iouAB, _, areaA, areaB = DetectUtils.iou(boxA, boxB, return_areas=True)

          if iouAB < iou_thold:
            new_keep.append(boxObjB)
          elif areaA < areaB:
            keepA = False
            new_keep.append(boxObjB)

        if keepA:
          new_keep.append(boxObjA)

        keep = new_keep[:]
      ioud_by_label[k] = keep

    return [obj for objs in ioud_by_label.values() for obj in objs]
