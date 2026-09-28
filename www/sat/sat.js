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

// TODO: use quartiles
function getColor(value) {
  return value > 0.75 ? "#800026" :
         value > 0.5  ? "#BD0026" :
         value > 0.25 ? "#E31A1C" :
                        "#FFEDA0";
}

function styleFeature(feature) {
  return {
    fillColor: getColor(feature.properties.vegetation_pct),
    fillOpacity: 0.7,
    // color: "#ffffff",
    // weight: 2,
    opacity: 0,
  };
}

document.addEventListener("DOMContentLoaded", async () => {
  const geoData = await fetchJson(GEOJSON_URL);
  console.log(geoData);
  const mapCenter = centerCoord(geoData.features);

  const map = L.map("map").setView(mapCenter, 12);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  L.geoJSON(geoData.features, { style: styleFeature }).addTo(map);
});
