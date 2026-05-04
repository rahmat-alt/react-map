import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

// =======================
// 1. MAP
// =======================
const map = L.map("map").setView([-0.9471, 100.4172], 13);

// =======================
// 2. BASEMAP
// =======================
L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
  attribution: "&copy; OpenStreetMap &copy; CARTO",
}).addTo(map);

// =======================
// 3. DATA
// =======================
const url = "/data/cafe.geojson";

// =======================
// 4. ELEMENT
// =======================
const btn = document.getElementById("btnLoad");
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

      // hapus layer lama
      if (geojsonLayer) map.removeLayer(geojsonLayer);
      if (glowLayer) map.removeLayer(glowLayer);
      if (heatLayer) map.removeLayer(heatLayer);

      // filter
      const filtered = data.features.filter((f) => {
        if (!keyword) return true;
        return f.properties?.name?.toLowerCase().includes(keyword);
      });

      // =======================
      // GLOW
      // =======================
      glowLayer = L.geoJSON(filtered, {
        pointToLayer: (f, latlng) =>
          L.circleMarker(latlng, {
            radius: 14,
            color: "#00ffff",
            opacity: 0.25,
            fillOpacity: 0,
          }),
      }).addTo(map);

      // =======================
      // TITIK
      // =======================
      geojsonLayer = L.geoJSON(filtered, {
        pointToLayer: (f, latlng) =>
          L.circleMarker(latlng, {
            radius: 6,
            color: "#00ffff",
            fillColor: "#00ffff",
            fillOpacity: 0.9,
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
                color: "#ffff00",
                fillColor: "#ffff00",
                fillOpacity: 1,
              });
            },
            mouseout: (e) => {
              geojsonLayer.resetStyle(e.target);
            },
          });
        },
      }).addTo(map);

      // =======================
      // HEATMAP (🔥 SUDAH FIX)
      // =======================
      const heatData = filtered.map((f) => {
        let weight = 1;

        // 🔥 LOGIKA BOBOT (biar tidak flat)
        if (f.properties.wifi === "wlan") weight += 2;
        if (f.properties.masakan !== "-") weight += 1;
        if (f.properties.jam && f.properties.jam !== "-") weight += 1;

        return [f.geometry.coordinates[1], f.geometry.coordinates[0], weight];
      });

      heatLayer = L.heatLayer(heatData, {
        radius: 45,
        blur: 30,
        maxZoom: 17,
        minOpacity: 0.6,

        gradient: {
          0.2: "blue",
          0.4: "lime",
          0.6: "yellow",
          0.8: "orange",
          1.0: "red",
        },
      });

      // =======================
      // FIT BOUNDS
      // =======================
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
  if (!heatLayer) {
    alert("Data belum dimuat!");
    return;
  }

  if (!isHeatmapVisible) {
    map.addLayer(heatLayer);
    legend.addTo(map);
    btnHeatmap.classList.replace("btn-secondary", "btn-success");
    isHeatmapVisible = true;
  } else {
    map.removeLayer(heatLayer);
    map.removeControl(legend);
    btnHeatmap.classList.replace("btn-success", "btn-secondary");
    isHeatmapVisible = false;
  }
});

// =======================
// 8. TOGGLE TITIK
// =======================
btnPoint?.addEventListener("click", () => {
  if (!geojsonLayer) return;

  const visible = map.hasLayer(geojsonLayer);

  if (visible) {
    map.removeLayer(geojsonLayer);
    map.removeLayer(glowLayer);
    btnPoint.classList.replace("btn-info", "btn-danger");
  } else {
    map.addLayer(geojsonLayer);
    map.addLayer(glowLayer);
    btnPoint.classList.replace("btn-danger", "btn-info");
  }
});

// =======================
// 9. LEGEND
// =======================
const legend = L.control({ position: "bottomleft" });

legend.onAdd = function () {
  const div = L.DomUtil.create("div");

  div.innerHTML = `
    <div style="
      background: rgba(30,30,30,0.9);
      padding: 12px;
      border-radius: 12px;
      color: #fff;
      font-size: 13px;
    ">
      <strong>Keterangan</strong>

      <div><span style="background:blue;width:12px;height:12px;display:inline-block"></span> Rendah</div>
      <div><span style="background:lime;width:12px;height:12px;display:inline-block"></span> Sedang</div>
      <div><span style="background:yellow;width:12px;height:12px;display:inline-block"></span> Tinggi</div>
      <div><span style="background:red;width:12px;height:12px;display:inline-block"></span> Sangat Tinggi</div>
    </div>
  `;
  return div;
};

// =======================
// 10. EVENT
// =======================
btn?.addEventListener("click", loadData);

// load awal
loadData();
