const GEOJSON_URL = "https://direito-a-sombra.github.io/bus-view-satellites/data/sat_hex.geojson";

function fetchJson(url) {
  return fetch(url).then((res) => res.json());
}

function centerCoord(features) {
  const sums = [0, 0, 0];

  for (const p of features) {
    for (const [lon, lat] of p.geometry.coordinates[0]) {
      sums[0] += lat;
      sums[1] += lon;
      sums[2] += 1;
    }
  }

  return [sums[0] / sums[2], sums[1] / sums[2]];
}

// interpolateOranges(t)
// interpolateYlOrBr(t)
function styleFeature(features, propName) {
  const colorScaler = d3.scaleSequentialSqrt()
    .domain(d3.extent(features, d => d.properties[propName]))
    .interpolator(d3.interpolateYlOrBr);

  return (feature) => {
    return {
      fillColor: colorScaler(feature.properties[propName]),
      fillOpacity: 0.7,
      opacity: 0,
    };
  }
}

let geoJsonLayer;
const filterProps = [
  "pop_total",
  "vegetation_pct",
  "mean_renda",
];

document.addEventListener("DOMContentLoaded", async () => {
  const geoData = await fetchJson(GEOJSON_URL);
  const mapCenter = centerCoord(geoData.features);
  console.log(geoData);

  const map = L.map("map").setView(mapCenter, 12);

  const tileLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  filterProps.forEach(p => {
    const but = document.createElement("button");
    but.classList.add("menu-button");
    but.innerHTML = p.replace("_pct", " %").replace("mean_", "").replace("_total", "ulação");

    but.addEventListener("click", () => {
      geoJsonLayer?.remove();
      geoJsonLayer = L.geoJSON(geoData.features, { style: styleFeature(geoData.features, p) });
      geoJsonLayer.addTo(map);
    });
    document.querySelector("#menu").appendChild(but);
  });

  document.querySelector("#menu").querySelector("button").click();
});
