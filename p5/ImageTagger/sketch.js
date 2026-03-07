const OBJECT = "bus_sign";
const IMG_DIR = "../../imgs";

let TRAIN_FILES;
let IDS;
const ID2PATH = {};

let boxes;
/*
  {
    "filename.jpg": {"object": box, "object": box},
    "filename.jpg": {"object": box, "object": box},
  }
*/

let cidx;
let cid;
let cimg;
let cbox;

function preload() {
  TRAIN_FILES = loadJSON("../../data/train_files.json");
  boxes = loadJSON("../../data/train_boxes.json");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(20);

  for (const [d, fs] of Object.entries(TRAIN_FILES[OBJECT])) {
    for (const f of fs) {
      ID2PATH[`${d}/${f}`] = { dir: d, name: f };
    }
  }

  IDS = Object.keys(ID2PATH);
  cidx = 0;
  cid = IDS[cidx];

  const noObject = IDS.filter(id => !(id in boxes) || !(OBJECT in boxes[id]));
  if (noObject.length > 0) {
    cid = noObject[0];
    cidx = IDS.indexOf(cid);
  } else {
    console.log("ALL BOXED");
  }

  cimg = loadImage(`${IMG_DIR}/${ID2PATH[cid].dir}/${ID2PATH[cid].name}`);

  cbox = null;
  if (cid in boxes) {
    if (OBJECT in boxes[cid]) {
      cbox = boxes[cid][OBJECT];
    }
  }
}

function draw() {
  if (cimg) {
    image(cimg, 0, 0);
    if (cbox) {
      strokeWeight(3);
      noFill();
      stroke(0, 255, 0);
      rect(cbox[0], cbox[1], cbox[2] - cbox[0], cbox[3] - cbox[1]);
    }

    if (px && py) {
      strokeWeight(3);
      noFill();
      stroke(255, 0, 0);
      const mx = constrain(mouseX, 0, cimg.width);
      const my = constrain(mouseY, 0, cimg.height);
      rect(px, py, mx-px, my-py);
    }
  }
}

let px, py;
function mousePressed() {
  if (mouseX > cimg.width || mouseY > cimg.height) return;

  if (!px && !py) {
    px = constrain(mouseX, 0, cimg.width);
    py = constrain(mouseY, 0, cimg.height);
  }
}

let rx, ry;
function mouseReleased() {
  rx = constrain(mouseX, 0, cimg.width);
  ry = constrain(mouseY, 0, cimg.height);

  const x0 = min(px, rx);
  const x1 = max(px, rx);
  const y0 = min(py, ry);
  const y1 = max(py, ry);

  const w = x1 - x0;
  const h = y1 - y0;

  if (w > 2 && h > 2) {
    px = null;
    py = null;
    cbox = [x0, y0, x1, y1];
  }
}

function keyReleased() {
  if (key == " ") {
    if (cbox) {
      if (!(cid in boxes)) {
        boxes[cid] = {};
      }
      boxes[cid][OBJECT] = cbox;
    }

    cidx = Math.min(cidx + 1, IDS.length - 1);
    cid = IDS[cidx];
    cimg = loadImage(`${IMG_DIR}/${ID2PATH[cid].dir}/${ID2PATH[cid].name}`);

    cbox = null;
    if (cid in boxes) {
      if (OBJECT in boxes[cid]) {
        cbox = boxes[cid][OBJECT];
      }
    }
  } else if (key == "s" || key == "S") {
    saveJSON(boxes, "boxes_.json");
  } else if (keyCode == ESCAPE) {
    px = null;
    py = null;
  }
}
