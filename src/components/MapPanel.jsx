import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState } from "react";

// Fix default marker icon issue in Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom cyan marker
const cyanIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [1, -30],
  shadowSize: [32, 32],
});

// Campus hotspot locations (Bengaluru college area approximate)
const HOTSPOTS = [
  { name: "Library", lat: 12.9345, lng: 77.6102, count: 5 },
  { name: "Canteen", lat: 12.9338, lng: 77.6115, count: 3 },
  { name: "Main Gate", lat: 12.9350, lng: 77.6090, count: 2 },
  { name: "Seminar Hall", lat: 12.9330, lng: 77.6108, count: 4 },
  { name: "Parking Lot", lat: 12.9355, lng: 77.6120, count: 2 },
];

function MapPanel({ items }) {
  const [live] = useState(true);
  const center = [12.9340, 77.6105];

  return (
    <div className="glass-card" style={{ borderRadius: "var(--radius-xl)", padding: "22px", display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p className="section-label">Geolocation</p>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "18px", fontWeight: 700, color: "var(--text-primary)",
          }}>Campus Hotspots</h2>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          fontFamily: "var(--font-mono)",
          fontSize: "11px", fontWeight: 600, color: "#10b981",
          background: "rgba(16,185,129,0.08)",
          border: "1px solid rgba(16,185,129,0.18)",
          padding: "4px 10px", borderRadius: "999px",
        }}>
          <span style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: "#10b981",
            animation: "pulse-dot 2s infinite",
          }} />
          Live
        </div>
      </div>

      {/* Map Container */}
      <div style={{
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        border: "1px solid rgba(6,182,212,0.15)",
        boxShadow: "0 0 30px rgba(6,182,212,0.08), inset 0 0 30px rgba(0,0,0,0.3)",
        height: "300px",
        position: "relative",
      }}>
        <MapContainer
          center={center}
          zoom={16}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution="&copy; CartoDB"
          />

          {HOTSPOTS.map((spot) => (
            <div key={spot.name}>
              <Circle
                center={[spot.lat, spot.lng]}
                radius={30}
                pathOptions={{
                  color: "#06b6d4",
                  fillColor: "#06b6d4",
                  fillOpacity: 0.12,
                  weight: 1.5,
                }}
              />
              <Marker position={[spot.lat, spot.lng]} icon={cyanIcon}>
                <Popup>
                  <div style={{
                    background: "#0a1628", color: "#e2e8f0",
                    fontFamily: "var(--font-body)", padding: "6px",
                    minWidth: "120px",
                  }}>
                    <strong style={{ color: "#06b6d4", fontSize: "13px" }}>{spot.name}</strong>
                    <p style={{ fontSize: "12px", marginTop: "4px", color: "#94a3b8" }}>
                      {spot.count} reports nearby
                    </p>
                  </div>
                </Popup>
              </Marker>
            </div>
          ))}
        </MapContainer>
      </div>

      {/* Hotspot Legend */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <p style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px", color: "var(--text-muted)",
          letterSpacing: "0.1em", textTransform: "uppercase",
          marginBottom: "4px",
        }}>High Activity Zones</p>
        {HOTSPOTS.slice(0, 3).map((spot) => (
          <div key={spot.name} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "7px 10px",
            background: "rgba(0,0,0,0.2)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{
                width: "7px", height: "7px", borderRadius: "50%",
                background: "var(--cyan)",
                boxShadow: "0 0 6px var(--cyan)",
              }} />
              <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>
                {spot.name}
              </span>
            </div>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px", color: "var(--text-muted)",
            }}>{spot.count} reports</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MapPanel;
