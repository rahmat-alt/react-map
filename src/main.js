import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// import maplibregl from "maplibre-gl";
// import "maplibre-gl/dist/maplibre-gl.css";

// import * as THREE from "three";

// import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// =======================
// MAP 3D
// =======================
const map3d = new maplibregl.Map({
  container: "map",

  style: {
    version: 8,

    sources: {
      carto: {
        type: "raster",
        tiles: [
          "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png", // ← INI
          "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png", // ← INI
          "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png", // ← INI
        ],
        tileSize: 256,
      },

      openmaptiles: {
        type: "vector",
        url: "https://tiles.openfreemap.org/planet",
      },
    },

    layers: [
      {
        id: "carto-layer",
        type: "raster",
        source: "carto",
        paint: {
          "raster-opacity": 1,
        },
      },

      {
        id: "water-layer",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "water",
        paint: {
          "fill-color": "#102a43", // warna air utama
          "fill-opacity": 0.9,
        },
      },

      // jalan
      {
        id: "road-layer",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",

        paint: {
          "line-color": [
            "interpolate",
            ["linear"],
            ["zoom"],

            0,
            "#2b2f3a",
            2,
            "#343846",
            4,
            "#3a3f4b",
            6,
            "#4a2a2f",
            8,
            "#5a1e24",
            10,
            "#6d2a2a",
            12,
            "#8b3a3a",
            14,
            "#a34a4a",
            16,
            "#b55252",
            18,
            "#d46a6a",
          ],

          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            0.2,
            6,
            0.6,
            10,
            1.5,
            14,
            3,
            16,
            5,
            18,
            8,
          ],

          "line-opacity": 0.9,
        },
      },

      {
        id: "road-label",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "transportation_name",

        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10,
            10,
            14,
            12,
            18,
            15,
          ],

          // 🔥 penting: biar tidak saling tabrakan & tetap muncul
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "symbol-placement": "line",
        },

        paint: {
          "text-color": "#ffffff",

          // 🔥 bikin selalu terbaca di atas semua warna map
          "text-halo-color": "#0b0f1a",
          "text-halo-width": 2,

          "text-opacity": 1,
        },
      },
    ],
  },

  center: [100.3543, -0.9492],
  zoom: 11,
  pitch: 45,
  bearing: 0,
  antialias: true,
});

// =======================
// NAVIGATION
// =======================
map3d.addControl(new maplibregl.NavigationControl());

// =======================
// STATE
// =======================
let isPointVisible = true;
let isHeatmapVisible = true;

const url = "/data/cafe.geojson";

// =======================
// SEARCH FUNCTION (FIX UTAMA)
// =======================
function doSearch() {
  const keyword = document.getElementById("search").value.toLowerCase().trim();

  if (!keyword) return;

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      const found = data.features.find((f) =>
        f.properties?.name?.toLowerCase().includes(keyword),
      );

      if (!found) {
        const notif = document.createElement("div");

        notif.innerHTML = `
  <div style="font-size:22px; color:#555; margin-bottom:8px;">
   "${keyword}" Tidak Ditemukan
  </div>

  <div style="font-size:15px; opacity:0.85;">
    Coba gunakan nama coffeeshop lain
  </div>
  `;

        notif.style.position = "fixed";
        notif.style.top = "50%";
        notif.style.left = "35%";
        notif.style.transform = "translate(-50%, -50%)";

        notif.style.padding = "28px 40px";
        notif.style.background = "rgba(11,15,26,0.95)";
        notif.style.border = "2px solid #00ffff";
        notif.style.color = "#ffffff";

        notif.style.borderRadius = "20px";
        notif.style.boxShadow = `
    0 0 25px rgba(0,255,255,0.45),
    0 0 60px rgba(138,43,226,0.35)
  `;

        notif.style.zIndex = "9999";
        notif.style.backdropFilter = "blur(12px)";
        notif.style.fontFamily = "sans-serif";
        notif.style.textAlign = "center";

        notif.style.minWidth = "350px";

        // animasi
        notif.animate(
          [
            {
              opacity: 0,
              transform: "translate(-50%, -55%) scale(0.9)",
            },
            {
              opacity: 1,
              transform: "translate(-50%, -50%) scale(1)",
            },
          ],
          {
            duration: 300,
            easing: "ease-out",
          },
        );

        document.body.appendChild(notif);

        setTimeout(() => {
          notif.remove();
        }, 3000);

        return;
      }

      map3d.flyTo({
        center: found.geometry.coordinates,
        zoom: 17,
        pitch: 60,
        speed: 0.8,
      });

      document.getElementById("detailContent").innerHTML = `
        <tr><td>Nama</td><td>${found.properties?.name || "-"}</td></tr>
        <tr><td>Alamat</td><td>${found.properties?.address1 || "-"}</td></tr>
        <tr><td>Wifi</td><td>${found.properties?.wifi || "-"}</td></tr>
        <tr><td>Jam</td><td>${found.properties?.jam || "-"}</td></tr>
      `;
    });
}

// =======================
// EVENT SEARCH (BUTTON + ENTER)
// =======================
document.getElementById("searchBtn")?.addEventListener("click", doSearch);

document.getElementById("search")?.addEventListener("keypress", (e) => {
  if (e.key === "Enter") doSearch();
});

// =======================
// LOAD DATA
// =======================
function loadData() {
  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      if (!data.features) return;

      ["cafe-point", "cafe-glow", "cafe-heat"].forEach((id) => {
        if (map3d.getLayer(id)) map3d.removeLayer(id);
      });

      if (map3d.getSource("cafe")) {
        map3d.removeSource("cafe");
      }

      map3d.addSource("cafe", {
        type: "geojson",
        data,
      });

      // GLOW
      map3d.addLayer({
        id: "cafe-glow",
        type: "circle",
        source: "cafe",
        paint: {
          "circle-radius": 18,
          "circle-color": "#00ffff",
          "circle-opacity": 0.15,
          "circle-blur": 1,
        },
      });

      // CURSOR FIX
      map3d.on("mouseenter", "cafe-point", () => {
        map3d.getCanvas().style.cursor = "pointer";
      });

      map3d.on("mouseleave", "cafe-point", () => {
        map3d.getCanvas().style.cursor = "";
      });

      // POINT
      map3d.addLayer({
        id: "cafe-point",
        type: "circle",
        source: "cafe",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            3,
            10,
            5,
            15,
            8,
            18,
            12,
          ],

          "circle-color": "#8a2be2",

          "circle-stroke-width": 2,

          "circle-stroke-color": "#ffffff",

          "circle-opacity": 0.95,

          "circle-blur": 0.2,
        },
      });

      // HEATMAP
      map3d.addLayer({
        id: "cafe-heat",
        type: "heatmap",
        source: "cafe",
        layout: {
          visibility: isHeatmapVisible ? "visible" : "none",
        },
        paint: {
          "heatmap-intensity": 2.2,
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            6,
            8,
            20,
            12,
            40,
            16,
            65,
            18,
            90,
          ],
          "heatmap-weight": 1,
          "heatmap-opacity": 0.8,
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(0, 0, 0, 0)",
            0.1,
            "rgba(0, 255, 255, 0.25)",
            0.25,
            "rgba(0, 255, 0, 0.35)",
            0.4,
            "rgba(0, 120, 255, 0.45)",
            0.55,
            "rgba(255, 0, 255, 0.55)",
            0.7,
            "rgba(255, 0, 0, 0.60)",
            0.85,
            "rgba(255, 255, 0, 0.65)",
            1,
            "rgba(255, 255, 255, 0.85)",
          ],
        },
      });

      // CLICK POINT
      map3d.on("click", "cafe-point", (e) => {
        const f = e.features[0];

        map3d.flyTo({
          center: f.geometry.coordinates,
          zoom: 18,
          pitch: 60,
          speed: 0.8,
        });

        const p = f.properties;

        document.getElementById("detailContent").innerHTML = `
          <tr><td>Nama</td><td>${p?.name || "-"}</td></tr>
          <tr><td>Alamat</td><td>${p?.address1 || "-"}</td></tr>
          <tr><td>Wifi</td><td>${p?.wifi || "-"}</td></tr>
          <tr><td>Jam</td><td>${p?.jam || "-"}</td></tr>
        `;
      });
    });
}

// =======================
// BUILDING 3D
// =======================
map3d.on("load", () => {
  map3d.addLayer({
    id: "3d-buildings",
    source: "openmaptiles",
    "source-layer": "building",
    type: "fill-extrusion",
    minzoom: 15,
    paint: {
      "fill-extrusion-color": [
        "interpolate",
        ["linear"],
        ["get", "render_height"],

        0,
        "#0b0f1a",
        2,
        "#141a2e",
        4,
        "#1b1f3a",
        6,
        "#2a1b5a",
        8,
        "#3a0ca3",

        10,
        "#5a0fd8",
        12,
        "#8a2be2",

        14,
        "#4cc9f0",
        16,
        "#00ffff",

        18,
        "#ff2e63",
        20,
        "#ff4d6d",

        22,
        "#f59e0b",
        25,
        "#efa609",
      ],

      "fill-extrusion-height": ["coalesce", ["get", "render_height"], 20],
      "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
      "fill-extrusion-opacity": 0.9,
    },
  });

  loadData();
});

// =======================
// TOGGLE POINT
// =======================
document.getElementById("togglePoint")?.addEventListener("click", () => {
  isPointVisible = !isPointVisible;

  map3d.setLayoutProperty(
    "cafe-point",
    "visibility",
    isPointVisible ? "visible" : "none",
  );

  map3d.setLayoutProperty(
    "cafe-glow",
    "visibility",
    isPointVisible ? "visible" : "none",
  );
});

// =======================
// TOGGLE HEATMAP
// =======================
document.getElementById("heatmap")?.addEventListener("click", () => {
  isHeatmapVisible = !isHeatmapVisible;

  map3d.setLayoutProperty(
    "cafe-heat",
    "visibility",
    isHeatmapVisible ? "visible" : "none",
  );
});

const trafficZones = [
  {
    name: "Pusat Kota",
    polygon: [
      [100.35, -0.95],
      [100.37, -0.95],
      [100.37, -0.93],
      [100.35, -0.93],
      [100.35, -0.95],
    ],
    pattern: {
      morning: "high",
      noon: "medium",
      evening: "high",
    },
  },
];

function getTrafficLevel(hour) {
  if (hour >= 7 && hour <= 9) return "high";
  if (hour >= 12 && hour <= 13) return "medium";
  if (hour >= 17 && hour <= 19) return "high";
  return "low";
}

function getColor(level) {
  if (level === "high") return "#ff2e2e"; // merah padat
  if (level === "medium") return "#ffa502"; // kuning
  return "#2ed573"; // hijau lancar
}

map3d.setPaintProperty("road-layer", "line-color", [
  "case",
  ["==", ["get", "traffic"], "high"],
  "#ff2e2e",
  ["==", ["get", "traffic"], "medium"],
  "#ffa502",
  "#2ed573",
]);

function simulateTraffic(hour) {
  const level = getTrafficLevel(hour);

  console.log("Traffic level:", level);

  map3d.setPaintProperty("road-layer", "line-color", getColor(level));
}

// contoh simulasi tahun tertentu
simulateTraffic(8); // jam 8 pagi (padat)

// =======================
// BUTTON LOAD
// =======================
document.getElementById("btnLoad")?.addEventListener("click", loadData);
