const STOPS_URL = "https://direito-a-sombra.github.io/bus-view-data/stops.tgh.json";
const BOXES_URL = "https://direito-a-sombra.github.io/bus-view-data/objs/stops2boxes.json";
const IMGS_URL = "https://direito-a-sombra.github.io/bus-view-images";

const stops = [];
const boxes = {};
const labels = [];
const id2objsets = {};
const id2marker = {};

let selectedObjects = new Set();
let selectedImage = null;
let selectedStop = null;
let ignoringMapClick = false;

let map;

const MARKER_STYLE = { radius: 3, color: "#000", weight: 0, fillColor: "#000", fillOpacity: 1, opacity: 0 };
const MARKER_STYLE_SELECTED = { radius: 6, color: "#000", weight: 0, fillColor: "#000", fillOpacity: 1, opacity: 0 };
const MARKER_STYLE_DIM = { radius: 3, color: "#000", weight: 0, fillColor: "#888", fillOpacity: 0.2, opacity: 0 };

function fetchJson(url) {
  return fetch(url).then(res => res.json());
}

function stopMatches(stopId) {
  return selectedObjects.difference(id2objsets[stopId]).size == 0;
}

function styleFor(stopId) {
  if (stopId == selectedStop) return MARKER_STYLE_SELECTED;
  if (selectedObjects.size > 0 && !stopMatches(stopId)) return MARKER_STYLE_DIM;
  return MARKER_STYLE;
}

function updateMarkers() {
  stops.forEach(stop => {
    id2marker[stop.id].setStyle(styleFor(stop.id));
  });
}

function handleMenuToggle(evt) {
  if (!evt.target.dataset.id) return;

  if (evt.target.checked) {
    selectedObjects.add(evt.target.dataset.id);
  } else {
    selectedObjects.delete(evt.target.dataset.id);
  }

  clearSelection();
  updateMarkers();
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

  // listen for "change" (not "click" on the label): the checkbox state is
  // only updated as the click's default action, after listeners run, so
  // reading evt.target.checked in a click handler sees the old state
  checkEl.addEventListener("change", handleMenuToggle);

  buttEl.appendChild(checkEl);
  buttEl.appendChild(labelEl);
  return buttEl;
}

function clearSelection() {
  const infoEl = document.getElementById("image-info");

  if (selectedStop != null) {
    selectedStop = null;
  }

  if (selectedImage) {
    selectedImage = null;
    infoEl.classList.remove("show");
    infoEl.innerHTML = "";
  }
}

function drawBoxes(el) {
  const boxesEl = el.querySelector(".image-boxes");
  boxesEl.innerHTML = "";

  const objs = boxes[el.dataset.id];
  objs.forEach(o => {
    if (selectedObjects.size > 0 && !selectedObjects.has(o.label)) return;

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

function createImageEl(stop) {
  const imgSrc = `${IMGS_URL}/${stop.image}`;

  const imgWrapperEl = document.createElement("div");
  imgWrapperEl.classList.add("image-wrapper");
  imgWrapperEl.dataset.id = stop.id;

  const imgEl = document.createElement("img");
  imgEl.classList.add("image");
  imgEl.src = imgSrc;

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

function selectStop(stop) {
  const prev = selectedStop;
  selectedStop = stop.id;

  if (prev != null && prev != stop.id) {
    id2marker[prev].setStyle(styleFor(prev));
  }
  id2marker[stop.id].setStyle(styleFor(stop.id));

  const infoEl = document.getElementById("image-info");
  infoEl.innerHTML = "";

  const imgWrapperEl = createImageEl(stop);
  selectedImage = imgWrapperEl;

  infoEl.appendChild(createInfoEl(stop));
  infoEl.appendChild(imgWrapperEl);
  infoEl.classList.add("show");
  drawBoxes(imgWrapperEl);
}

function handleMarkerClick(evt) {
  // a marker click bubbles to the #map click listener as well; don't let
  // that listener treat it as an "outside" click
  ignoringMapClick = true;

  const stop = evt.target.stop;

  if (stop.id == selectedStop) {
    clearSelection();
    updateMarkers();
  } else {
    selectStop(stop);
  }
}

function createMenu(labels) {
  const menuEl = document.getElementById("menu");
  labels.forEach(label => {
    const buttEl = createButton(label.replace("_", " "), label);
    menuEl.appendChild(buttEl);
  });
}

function createMarkers() {
  stops.forEach(stop => {
    const marker = L.circleMarker([stop.lat, stop.lon], MARKER_STYLE);
    marker.stop = stop;
    marker.on("click", handleMarkerClick);
    marker.addTo(map);
    id2marker[stop.id] = marker;
  });
}

function handleMapClick() {
  if (ignoringMapClick) {
    ignoringMapClick = false;
    return;
  }

  clearSelection();
  updateMarkers();
}

document.addEventListener("DOMContentLoaded", () => {
  map = L.map("map", { preferCanvas: true }).setView([-3.7255, -38.53], 12);

  document.getElementById("map").addEventListener("click", handleMapClick);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

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

    createMarkers();
    createMenu(labels);
  });
});
