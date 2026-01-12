const OBJECT = "bus_stop";
const IMG_DIR = "../../imgs/training";

const FS = JSON.parse(OBJECT2FILESTRING[OBJECT]);
const F2D = {};

for (const [d, fs] of Object.entries(FS)) {
  for (const f of fs) {
    F2D[f] = d;
  }
}

const FNAMES = Object.keys(F2D);

let boxes;
/*
  {
    "filename.jpg": {"object": box, "object": box},
    "filename.jpg": {"object": box, "object": box},
  }
*/

let cidx = 0;
let cfname = FNAMES[cidx];
let cimg;
let cbox;

function preload() {
  boxes = loadJSON("./boxes_20250111_144945.json");
}


function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(20);

  const noObject = Object.keys(boxes).filter(f => !(OBJECT in boxes[f]));
  if (noObject.length > 0) {
    cfname = noObject[0];
    cidx = Object.keys(boxes).indexOf(cfname);
  }

  cimg = loadImage(`${IMG_DIR}/${OBJECT}/${F2D[cfname]}/${cfname}`);

  cbox = null;
  if (cfname in boxes) {
    if (OBJECT in boxes[cfname]) {
      cbox = boxes[cfname][OBJECT];
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
      if (!(cfname in boxes)) {
        boxes[cfname] = {};
      }
      boxes[cfname][OBJECT] = cbox;  
    }

    cidx = (cidx + 1) % FNAMES.length;
    cfname = FNAMES[cidx];
    cimg = loadImage(`${IMG_DIR}/${OBJECT}/${F2D[cfname]}/${cfname}`);

    cbox = null;
    if (cfname in boxes) {
      if (OBJECT in boxes[cfname]) {
        cbox = boxes[cfname][OBJECT];
      }
    }
  } else if (key == "s" || key == "S") {
    saveJSON(boxes, "boxes_.json");
  } else if (keyCode == ESCAPE) {
    px = null;
    py = null;
  }
}
