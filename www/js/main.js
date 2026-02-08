const STOPS_URL = "https://direito-a-sombra.github.io/bus-view/data/stops.tgh.json";
const BOXES_URL = "https://direito-a-sombra.github.io/bus-view/data/objs/label2boxes.json";

const stops = [];
const boxes = {};

let selEl;

function fetchJson(url) {
  return fetch(url).then(res => res.json());
}

function handleClick(evt) {
  if (selEl) selEl.classList.remove("selected");

  if (evt.currentTarget != selEl) {
    selEl = evt.currentTarget;
    selEl.classList.add("selected");
  } else {
    selEl = null;
  }
}

function createImageEl(stop) {
  const imgSrc = `../imgs/${stop.image}`;

  const imgEl = document.createElement("img");
  imgEl.classList.add("image");
  imgEl.dataset.src = imgSrc;

  return imgEl;
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

  stops.slice(0, 300).forEach((stop, idx) => {
    const itemEl = document.createElement("div");
    itemEl.classList.add("item-container", `col-${idx%5}`);

    const infoEl = createInfoEl(stop);
    const imgEl = createImageEl(stop);

    itemEl.appendChild(imgEl);
    itemEl.appendChild(infoEl);

    itemEl.addEventListener("click", handleClick);

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
    loadImages(stops);
  });
});
