const STOPS_URL = "https://direito-a-sombra.github.io/bus-view/data/stops.tgh.json";
const BOXES_URL = "https://direito-a-sombra.github.io/bus-view/data/objs/label2boxes.json";

const stops = [];
const boxes = {};

function fetchJson(url) {
  return fetch(url).then(res => res.json());//.then(data => Object.assign(obj, data));
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

  stops.forEach(stop => {
    const stop_info = [stop.id, stop.address, stop.neighborhood, `${stop.lat}, ${stop.lon}`];

    const searchTerms = [
      `${stop.address}, fortaleza, brazil`,
      `${stop.lat},${stop.lon}`,
    ];

    const rowEl = document.createElement("div");
    rowEl.classList.add("row");

    // INFO COLUMN
    const infoEl = document.createElement("div");
    infoEl.classList.add("info-wrapper");
    infoEl.innerHTML = stop_info.join("<br>");
    rowEl.appendChild(infoEl);

    // IMAGE COLUMN
    const imgSrc = `../imgs/${stop.image}`;
    const aEl = document.createElement("a");
    aEl.classList.add("picture-wrapper");
    aEl.setAttribute("href", imgSrc);
    aEl.setAttribute("target", "_blank");

    const picEl = document.createElement("img");
    picEl.classList.add("picture");
    picEl.dataset.src = imgSrc;

    const mEl = document.createElement("a");
    mEl.setAttribute("href", `https://www.google.com/maps/search/${searchTerms[0]}/`);
    mEl.setAttribute("target", "_blank");
    mEl.innerHTML = "map";

    aEl.appendChild(picEl);
    aEl.appendChild(mEl);
    rowEl.appendChild(aEl);

    tableEl.appendChild(rowEl);
    rowObserver.observe(rowEl);
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
