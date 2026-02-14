const STOPS_URL = "https://direito-a-sombra.github.io/bus-view/data/stops.tgh.json";
const BOXES_URL = "https://direito-a-sombra.github.io/bus-view/data/objs/stops2boxes.json";

const stops = [];
const boxes = {};
const labels = [];
const id2objsets = {};

let selectedImage;
let selectedObjects = new Set();

function fetchJson(url) {
  return fetch(url).then(res => res.json());
}

function filterImages() {
  const tableEl = document.getElementById("table");

  Array.from(tableEl.children).forEach(el => {
    const id = el.dataset.id;
    const elObjs = id2objsets[id];

    if (selectedObjects.size == 0) {
      el.classList.remove("active");
      el.classList.remove("inactive");
    } else if (selectedObjects.difference(elObjs).size != 0) {
      el.classList.add("inactive");
      el.classList.remove("active");
    } else {
      el.classList.add("active");
      el.classList.remove("inactive");
    }
  });
}

function handleMenuToggle(evt) {
  if (!evt.target.dataset.id) return;

  if (evt.target.checked) {
    selectedObjects.add(evt.target.dataset.id);
  } else {
    selectedObjects.delete(evt.target.dataset.id);
  }

  if (selectedImage) {
    clearSelectedImage();
    selectedImage = null;
  };

  filterImages();
}

function createButton(labelText, id) {
  const buttEl = document.createElement("label");
  buttEl.classList.add("toggle-button", id);

  const checkEl = document.createElement("input");
  checkEl.setAttribute("type", "checkbox");
  checkEl.classList.add("toggle-input");
  checkEl.dataset.id = id;

  const labelEl = document.createElement("span");
  labelEl.classList.add("toggle-label");
  labelEl.innerHTML = labelText;

  buttEl.appendChild(checkEl);
  buttEl.appendChild(labelEl);
  return buttEl;
}

function clearSelectedImage() {
  const infoEl = document.getElementById("image-info");
  const boxesEl = selectedImage.querySelector(".image-boxes");
  selectedImage.classList.remove("selected");
  infoEl.classList.remove("show");
  boxesEl.innerHTML = "";
  setTimeout(() => infoEl.innerHTML = "", 100);
}

function drawBoxes(el) {
  const boxesEl = el.querySelector(".image-boxes");
  boxesEl.innerHTML = "";

  const objs = boxes[el.dataset.id];
  objs.forEach(o => {
    if (selectedObjects.size == 0 || !selectedObjects.has(o.label)) return;

    const box = o.box;
    const bEl = document.createElement("div");
    bEl.classList.add("box", o.label);
    boxesEl.appendChild(bEl);

    bEl.style.left = `${box[0] * 100}%`;
    bEl.style.top = `${box[1] * 100}%`;

    bEl.style.width = `${(box[2] - box[0]) * 100}%`;
    bEl.style.height = `${(box[3] - box[1]) * 100}%`;
  });
}

function handleImageClick(evt) {
  const infoEl = document.getElementById("image-info");

  if (selectedImage) {
    clearSelectedImage();
  };

  if (evt.currentTarget != selectedImage) {
    selectedImage = evt.currentTarget;
    setTimeout(() => {
      infoEl.appendChild(createInfoEl(stops[selectedImage.dataset.id]));
      infoEl.classList.add("show");
      selectedImage.classList.add("selected");
      drawBoxes(selectedImage);
    }, 250);
  } else {
    selectedImage = null;
  }
}

function createImageEl(stop) {
  const imgSrc = `./imgs/${stop.image}`;

  const imgWrapperEl = document.createElement("div");
  imgWrapperEl.classList.add("image-wrapper");

  const imgEl = document.createElement("img");
  imgEl.classList.add("image");
  imgEl.dataset.src = imgSrc;

  const imgBoxEl = document.createElement("div");
  imgBoxEl.classList.add("image-boxes");

  imgWrapperEl.appendChild(imgEl);
  imgWrapperEl.appendChild(imgBoxEl);
  return imgWrapperEl;
}

function createInfoEl(stop) {
  const stop_info_str = `${stop.id}:<br>${stop.address} - ${stop.neighborhood} (${stop.lat}, ${stop.lon}) `;
  const searchTerms = [
    `${stop.address}, fortaleza, brazil`,
    `${stop.lat},${stop.lon}`,
  ];

  const infoEl = document.createElement("div");
  infoEl.classList.add("info-wrapper");
  infoEl.innerHTML = stop_info_str;

  const mEl = document.createElement("a");
  mEl.setAttribute("href", `https://www.google.com/maps/search/${searchTerms[0]}/`);
  mEl.setAttribute("target", "_blank");
  mEl.innerHTML = "map";
  infoEl.appendChild(mEl);

  return infoEl;
}

function createMenu(labels) {
  const menuEl = document.getElementById("menu");
  labels.forEach(label => {
    const buttEl = createButton(label.replace("_", " "), label);
    buttEl.addEventListener("click", handleMenuToggle);
    menuEl.appendChild(buttEl);
  });
}

function loadImages(stops) {
  const tableEl = document.getElementById("table");

  const rowObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        let mEl = entry.target;
        mEl.querySelectorAll("img").forEach(imgEl => imgEl.src = imgEl.dataset.src);
        rowObserver.unobserve(mEl);
      }
    });
  });

  stops.forEach((stop, idx) => {
    const itemEl = document.createElement("div");
    itemEl.classList.add("item-container", `col-${idx % 5}`);
    itemEl.dataset.id = stop.id;

    const imgEl = createImageEl(stop);
    itemEl.appendChild(imgEl);
    itemEl.addEventListener("click", handleImageClick);

    tableEl.appendChild(itemEl);
    rowObserver.observe(itemEl);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  Promise.all([
    fetchJson(STOPS_URL),
    fetchJson(BOXES_URL),
  ]).then(data => {
    Object.assign(stops, data[0].toSorted((a, b) => a.id - b.id));
    Object.assign(boxes, data[1]);
    Object.assign(labels, [...stops.reduce((a, c) => new Set([...a, ...c.objects]), new Set())]);

    stops.forEach(stop => {
      id2objsets[stop.id] = new Set(stop.objects);
    });

    loadImages(stops);
    createMenu(labels);
  });
});
