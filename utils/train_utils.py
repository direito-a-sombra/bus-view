import json

from datetime import datetime
from os import listdir, path
from shutil import copy2

def get_obj2dir2files_json(dir, obj):
  TD = f"{dir}/{obj}"
  dirs = sorted([d for d in listdir(TD) if path.isdir(f"{TD}/{d}")])
  dir2files = {d : sorted([f for f in listdir(f"{TD}/{d}") if f.endswith("jpg")]) for d in dirs}
  return { obj: dir2files }

# data:
# {
#   "object0": '{"dir0": ["file0.jpg", "file1.jpg", ... ], "dir0": ["file0.jpg", "file1.jpg", "file2.jpg", ... ], ... }',
#   "object1": '{"dir0": ["file0.jpg", "file1.jpg", ... ], "dir0": ["file0.jpg", "file1.jpg", "file2.jpg", ... ], ... }'
# }
# 
def update_data_json(data_path, obj2dir2files):
  obj, dir2files = list(obj2dir2files.items())[0]

  with open(data_path, "r") as ifp:
    data = json.load(ifp)

  if obj not in data:
    data[obj] = {}

  for d,fs in dir2files.items():
    cfs = data[obj].get(d, [])
    data[obj][d] = sorted(list(set(cfs + fs)))

  dt_str = datetime.now().strftime("%Y%m%d_%H%M%S")
  dst_path = data_path.replace(".json", f"_{dt_str}.json")
  copy2(data_path, dst_path)

  with open(data_path, "w") as ofp:
    json.dump(data, ofp, separators=(",",":"), sort_keys=True, ensure_ascii=False)


# from utils.train_utils import get_obj2dir2files_json, update_data_json
if __name__ == "__main__":
  TRAIN_IMG_DIR = "./imgs/training"
  OBJECT = "bus_sign"
  DATA_DIR = "./data"
  DATA_TRAIN_FILE = f"{DATA_DIR}/train_files.json"

  bus_stop_d2f = get_obj2dir2files_json(TRAIN_IMG_DIR, OBJECT)
  update_data_json(DATA_TRAIN_FILE, bus_stop_d2f)
