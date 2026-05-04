import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat/dist/leaflet-heat.js";

// =======================
// 1. MAP
// =======================
const map = L.map("map").setView([-0.9471, 100.4172], 13);

// =======================
// 2. BASEMAP
// =======================
L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
  attribution: "&copy; OpenStreetMap & CARTO",
}).addTo(map);

// =======================
// 3. DATA
// =======================
const url = "/data/cafe.geojson";

// =======================
// 4. ELEMENT
// =======================
const btnLoad = document.getElementById("btnLoad");
const btnHeatmap = document.getElementById("heatmap");
const btnPoint = document.getElementById("togglePoint");
const input = document.getElementById("search");
const detailContent = document.getElementById("detailContent");

// =======================
// 5. LAYER
// =======================
let geojsonLayer = null;
let glowLayer = null;
let heatLayer = null;

let isHeatmapVisible = false;
let isPointVisible = true;

// =======================
// 6. LOAD DATA
// =======================
function loadData() {
  const keyword = input?.value?.toLowerCase() || "";

  fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error("Gagal load JSON: " + res.status);
      return res.json();
    })
    .then((data) => {
      if (!data.features) return;

      // Hapus layer lama
      if (geojsonLayer) map.removeLayer(geojsonLayer);
      if (glowLayer) map.removeLayer(glowLayer);

      const filtered = data.features.filter((f) => {
        if (!keyword) return true;
        return f.properties?.name?.toLowerCase().includes(keyword);
      });

      // =======================
      // 🌟 GLOW
      // =======================
      glowLayer = L.layerGroup();

      filtered.forEach((f) => {
        const latlng = [f.geometry.coordinates[1], f.geometry.coordinates[0]];

        L.circleMarker(latlng, { radius: 30, fillOpacity: 0.02 }).addTo(
          glowLayer,
        );
        L.circleMarker(latlng, { radius: 20, fillOpacity: 0.06 }).addTo(
          glowLayer,
        );
        L.circleMarker(latlng, { radius: 12, fillOpacity: 0.12 }).addTo(
          glowLayer,
        );
      });

      if (isPointVisible) glowLayer.addTo(map);

      // =======================
      // 🔵 POINT
      // =======================
      geojsonLayer = L.geoJSON(filtered, {
        pointToLayer: (f, latlng) =>
          L.circleMarker(latlng, {
            radius: 4,
            color: "#00ffff",
            fillColor: "#ffffff",
            fillOpacity: 1,
          }),

        onEachFeature: (feature, layer) => {
          const p = feature.properties;

          layer.on("click", () => {
            map.setView(layer.getLatLng(), 16);

            if (detailContent) {
              detailContent.innerHTML = `
                <tr><td>Nama</td><td>${p?.name || "-"}</td></tr>
                <tr><td>Alamat</td><td>${p?.address1 || "-"}</td></tr>
                <tr><td>Wifi</td><td>${p?.wifi || "-"}</td></tr>
                <tr><td>Jam</td><td>${p?.jam || "-"}</td></tr>
                <tr><td>Masakan</td><td>${p?.masakan || "-"}</td></tr>
              `;
            }
          });

          layer.on({
            mouseover: (e) => {
              e.target.setStyle({
                color: "yellow",
                fillColor: "yellow",
              });
            },
            mouseout: (e) => {
              geojsonLayer.resetStyle(e.target);
            },
          });
        },
      });

      if (isPointVisible) geojsonLayer.addTo(map);

      // =======================
      // 🔥 HEATMAP
      // =======================
      const heatData = filtered.map((f) => {
        let weight = 1;

        if (f.properties.wifi === "wlan") weight += 2;
        if (f.properties.masakan !== "-") weight += 1;
        if (f.properties.jam && f.properties.jam !== "-") weight += 1;

        return [f.geometry.coordinates[1], f.geometry.coordinates[0], weight];
      });

      heatLayer = L.heatLayer(heatData, {
        radius: 45,
        blur: 30,
      });

      // fit bounds
      if (geojsonLayer.getBounds().isValid()) {
        map.fitBounds(geojsonLayer.getBounds());
      }
    })
    .catch((err) => console.error("ERROR FETCH:", err));
}

// =======================
// 7. TOGGLE HEATMAP
// =======================
btnHeatmap?.addEventListener("click", () => {
  if (!heatLayer) return alert("Data belum dimuat!");

  if (!isHeatmapVisible) {
    map.addLayer(heatLayer);
    isHeatmapVisible = true;
    btnHeatmap.classList.replace("btn-secondary", "btn-success");
  } else {
    map.removeLayer(heatLayer);
    isHeatmapVisible = false;
    btnHeatmap.classList.replace("btn-success", "btn-secondary");
  }
});

// =======================
// 8. TOGGLE POINT
// =======================
btnPoint?.addEventListener("click", () => {
  if (!geojsonLayer) return;

  if (isPointVisible) {
    map.removeLayer(geojsonLayer);
    map.removeLayer(glowLayer);
    isPointVisible = false;
    btnPoint.classList.replace("btn-secondary", "btn-danger");
  } else {
    map.addLayer(geojsonLayer);
    map.addLayer(glowLayer);
    isPointVisible = true;
    btnPoint.classList.replace("btn-danger", "btn-secondary");
  }
});

// =======================
// 9. EVENT
// =======================
btnLoad?.addEventListener("click", loadData);

// load pertama
loadData();
