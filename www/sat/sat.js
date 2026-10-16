const GEOJSON_URL = "https://direito-a-sombra.github.io/bus-view-satellites/data/sat_hex_sun.geojson";

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
// interpolateYlOrBr(t)
function styleFeature(features, prop) {
  const colorInterpolator = d3.interpolateYlOrBr;
  const colorScaler = prop.scaler()
    .domain(d3.extent(features, d => d.properties[prop.name]))
    .interpolator(colorInterpolator)
    .unknown(colorInterpolator(0));

  return (feature) => {
    return {
      fillColor: colorScaler(parseFloat(feature.properties[prop.name])),
      fillOpacity: 0.7,
      opacity: 0,
    };
  }
}

let geoJsonLayer;

const scalers = {
  linear: d3.scaleSequential,
  sqrt: d3.scaleSequentialSqrt,
  log: d3.scaleSequentialLog,
};

const filterProps = [
  // { name: "pop_total_old", label: "population (count)", scaler: scalers.sqrt },
  { name: "populacao_total", label: "population (count)", scaler: scalers.sqrt },
  { name: "vegetation_pct", label: "vegetation (%)", scaler: scalers.sqrt },
  { name: "SM_LOG", label: "income (minimum wage)", scaler: scalers.linear },
  // { name: "renda_media", label: "renda_media", scaler: scalers.sqrt },
  { name: "numero_paradas", label: "numero_paradas", scaler: scalers.linear },
  { name: "predios_11h_dist_sol_m", label: "predios_11h_dist_sol_m", scaler: scalers.linear },
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
    but.innerHTML = p.label;

    but.addEventListener("click", () => {
      geoJsonLayer?.remove();
      geoJsonLayer = L.geoJSON(geoData.features, { style: styleFeature(geoData.features, p) });
      geoJsonLayer.addTo(map);
    });
    document.querySelector("#menu").appendChild(but);
  });

  document.querySelector("#menu").querySelector("button").click();
});
