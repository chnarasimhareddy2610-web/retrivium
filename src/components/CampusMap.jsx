import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
});

function CampusMap() {
  return (
    <div className="bg-[#0F172A] border border-white/10 rounded-3xl p-5 h-full">

      <div className="flex justify-between items-center mb-5">

        <h2 className="text-2xl font-bold text-white">
          Campus Hotspots
        </h2>

        <span className="text-cyan-400 text-sm">
          Live Tracking
        </span>

      </div>

      <div className="rounded-2xl overflow-hidden h-100">

        <MapContainer
          center={[12.9716, 77.5946]}
          zoom={15}
          scrollWheelZoom={false}
          className="h-full w-full"
        >

          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker position={[12.9716, 77.5946]} icon={icon}>
            <Popup>
              Lost Wallet - Library
            </Popup>
          </Marker>

          <Marker position={[12.9735, 77.5965]} icon={icon}>
            <Popup>
              Found ID Card - Canteen
            </Popup>
          </Marker>

        </MapContainer>

      </div>

    </div>
  );
}

export default CampusMap;