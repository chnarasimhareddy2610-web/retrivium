import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useAppData } from "../../context/AppDataContext";
import { getSignedImageUrl } from "../../lib/itemService";
import { hasValidCoords } from "../../lib/geo";

// ---------------------------------------------------------------------------
// Honest placement, two tiers.
//
// 1. EXACT GPS — when a report carries valid latitude/longitude (captured with
//    the reporter's consent), the marker sits at that exact position.
// 2. ZONE ANCHOR — otherwise we place the marker at a fixed campus zone
//    centroid. This is a zone's general area, NOT a precise location, and is
//    labeled as such on the map. We never invent coordinates for a report.
// ---------------------------------------------------------------------------
const ZONE_CENTROIDS = {
  "Central Library": [12.9345, 77.6102],
  "CS Block": [12.9354, 77.6118],
  "Main Canteen": [12.9338, 77.6110],
  "Auditorium": [12.9348, 77.6096],
  "Hostels": [12.9360, 77.6126],
  Other: [12.9340, 77.6105],
};

const CAMPUS_BOUNDS = [
  [12.9325, 77.6085],
  [12.9372, 77.6135],
];

const TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILE_ATTR =
  "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors &copy; <a href=\"https://carto.com/attributions\">CARTO</a>";

// ---- Marker icons ----------------------------------------------------------------

function statusColor(status) {
  if (status === "Found") return "#10b981";
  if (status === "Resolved") return "#64748b";
  return "#f43f5e"; // Lost
}

function itemIcon(status, index = 0) {
  const color = statusColor(status);
  const rotation = index * 36;
  return L.divIcon({
    className: "incident-marker",
    html: `
      <div style="
        position:relative;
        width:34px;height:34px;
        display:flex;align-items:center;justify-content:center;
        background:${color};
        color:#fff;
        border-radius:50%;
        box-shadow:0 4px 14px rgba(0,0,0,0.22), 0 0 0 3px rgba(255,255,255,0.7);
        border:1px solid rgba(255,255,255,0.9);
        transform:rotate(${rotation}deg);
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          ${status === "Found"
            ? "<path d='M21 12a9 9 0 1 1-9-9c2.5 0 4.7 1 6 2.5a7 7 0 0 1 14 0c1.3-1.5 3.5-2.5 6-2.5z'/><path d='M12 6v6l3 2'/>"
            : "<path d='M12 3 2 12h3v8h6v-6h3z'/>"}
        </svg>
      </div>
      ${index > 0 ? `<div style="position:absolute;left:50%;top:-6px;transform:translateX(-50%);background:#0b1c30;color:#fff;font-size:10px;font-weight:700;border-radius:999px;width:16px;height:16px;display:flex;align-items:center;justify-content:center;border:1.5px solid #fff;">${index + 1}</div>` : ""}
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20],
  });
}

function clusterIcon(count) {
  return L.divIcon({
    className: "incident-cluster",
    html: `
      <div style="
        width:42px;height:42px;
        background:#0b1c30;
        color:#fff;
        border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        font-size:13px;font-weight:700;
        border:3px solid #0037b0;
        box-shadow:0 4px 14px rgba(0,0,0,0.25);
      ">${count}</div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -24],
  });
}

// Exact-GPS marker: a white ring with a colored core, visually distinct from the
// solid zone-anchor pins so users can tell precise positions apart at a glance.
function gpsIcon(status) {
  const color = statusColor(status);
  return L.divIcon({
    className: "incident-marker incident-marker--gps",
    html: `
      <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
        <span style="position:absolute;inset:0;border-radius:50%;background:rgba(6,182,212,0.18);"></span>
        <span style="position:relative;display:flex;align-items:center;justify-content:center;width:24px;height:24px;background:#fff;border:3px solid ${color};border-radius:50%;box-shadow:0 3px 10px rgba(0,0,0,0.28),0 0 0 1px rgba(6,182,212,0.5);">
          <span style="width:8px;height:8px;background:${color};border-radius:50%;"></span>
        </span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

// ---- Signed thumbnail helper (one request per item) -----------------------------

function SignedThumb({ imagePath, name, size = 56 }) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!imagePath) return;
    let active = true;
    getSignedImageUrl(imagePath)
      .then((u) => {
        if (active) {
          if (u) setUrl(u);
          else setError(true);
        }
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [imagePath]);

  const inFlight = Boolean(imagePath) && !url && !error;

  if (!imagePath || error || !url) {
    return (
      <div
        className="w-full h-full flex items-center justify-center text-on-surface-variant"
        style={{ background: "rgba(0,0,0,0.04)", borderRadius: 6 }}
      >
        <svg width={size * 0.42} height={size * 0.42} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      </div>
    );
  }

  if (inFlight) {
    return (
      <div className="w-full h-full flex items-center justify-center text-on-surface-variant" style={{ background: "rgba(0,0,0,0.04)", borderRadius: 6 }}>
        <svg className="animate-spin" width={size * 0.3} height={size * 0.3} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeDashoffset="10" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={name}
      className="w-full h-full object-cover rounded-[6px]"
      style={{ border: "1px solid rgba(255,255,255,0.4)" }}
      onError={() => setError(true)}
    />
  );
}

// ---- Popup content ---------------------------------------------------------------

const ITEM_LINK = "/browse";

function itemPopupContent(item, isGps = false) {
  const statusStyle =
    item.status === "Found"
      ? "rgba(16,185,129,0.16)"
      : item.status === "Resolved"
      ? "rgba(100,116,139,0.16)"
      : "rgba(244,63,94,0.16)";
  const statusColorVal = statusColor(item.status);
  return (
    <div style={{ fontSize: 13, fontFamily: "Inter, sans-serif", minWidth: 180, maxWidth: 260 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 10px 6px",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <span
          className="font-semibold uppercase tracking-wide"
          style={{
            fontSize: 11,
            padding: "2px 7px",
            borderRadius: 999,
            background: statusStyle,
            color: statusColorVal,
            lineHeight: "16px",
          }}
        >
          {item.status}
        </span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>
          {item.tag || "—"}
        </span>
        {isGps && (
          <span
            title="Marker uses exact captured GPS coordinates"
            style={{
              marginLeft: 6,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: "#0891b2",
              background: "rgba(6,182,212,0.14)",
              border: "1px solid rgba(6,182,212,0.35)",
              borderRadius: 999,
              padding: "2px 6px",
              lineHeight: "14px",
            }}
          >
            GPS
          </span>
        )}
      </div>

      <div style={{ padding: "8px 10px 6px" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ width: 52, height: 52, flexShrink: 0, position: "relative" }}>
            <SignedThumb imagePath={item.image_path} name={item.name} size={52} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontWeight: 600,
                color: "#0b1c30",
                fontSize: 13.5,
                lineHeight: 1.25,
                marginBottom: 3,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {item.name}
            </div>
            <div style={{ color: "#475569", fontSize: 12, display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.location}</span>
            </div>
            {item.custody && (
              <div style={{ color: "#10b981", fontSize: 11.5, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 22s-7-5.2-7-11a5 5 0 0 1 10 0c0 5.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>
                <span>{item.custody}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <a
        href={ITEM_LINK}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          margin: "8px 10px 10px",
          padding: "7px 10px",
          background: "#0037b0",
          color: "#fff",
          borderRadius: 7,
          textDecoration: "none",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
        View on map
      </a>
    </div>
  );
}

function clusterPopupContent(groupItems) {
  const sorted = [...groupItems].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );
  const latest = sorted[0];
  return (
    <div style={{ fontSize: 13, fontFamily: "Inter, sans-serif", minWidth: 200, maxWidth: 280 }}>
      <div
        style={{
          padding: "8px 10px 6px",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontWeight: 700, color: "#0037b0", textTransform: "uppercase", letterSpacing: "0.04em", fontSize: 11 }}>
          Zone cluster
        </span>
        <span style={{ fontSize: 11, color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>
          {groupItems.length} report{groupItems.length === 1 ? "" : "s"}
        </span>
      </div>
      <div style={{ padding: "6px 10px" }}>
        <div style={{ color: "#475569", fontSize: 12, marginBottom: 6 }}>
          Showing items near <span style={{ color: "#0b1c30", fontWeight: 600 }}>{latest?.zone || "a campus zone"}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {sorted.slice(0, 4).map((item) => (
            <div key={item.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ width: 40, height: 40, flexShrink: 0, position: "relative" }}>
                <SignedThumb imagePath={item.image_path} name={item.name} size={40} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    color: "#0b1c30",
                    fontSize: 12.5,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.name}
                </div>
                <div style={{ color: "#475569", fontSize: 11 }}>
                  {item.location}
                </div>
              </div>
            </div>
          ))}
          {groupItems.length > 4 && (
            <div style={{ fontSize: 11, color: "#64748b", textAlign: "center", paddingTop: 4 }}>
              +{groupItems.length - 4} more
            </div>
          )}
        </div>
      </div>
      <a
        href={ITEM_LINK}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          margin: "8px 10px 10px",
          padding: "7px 10px",
          background: "#0037b0",
          color: "#fff",
          borderRadius: 7,
          textDecoration: "none",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
        Browse all reports
      </a>
    </div>
  );
}

// ---- Map controller (fit view) --------------------------------------------------

function MapController({ ready }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !ready) return;
    // Fit campus bounds once markers are painted.
    map.fitBounds(CAMPUS_BOUNDS, { padding: [36, 36], maxZoom: 17, animate: true });
  }, [map, ready]);

  return null;
}

function ResetButton() {
  const map = useMap();
  return (
    <button
      className="leaflet-bar leaflet-control"
      onClick={() => {
        if (!map) return;
        map.fitBounds(CAMPUS_BOUNDS, { padding: [36, 36], maxZoom: 17, animate: true });
      }}
      title="Reset view"
    >
      <span style={{ fontSize: 18, color: "#0b1c30" }}>⟲</span>
    </button>
  );
}

// ---- Indexed markers layer (one marker per visible item, clustered by zone) ------

function IndexedMarkers({ items }) {
  // Build a stable keyed list of markers to render declaratively.
  // Multiple items in the same zone share a centroid; we offset them slightly
  // so individual markers are visible instead of stacked exactly on top of each
  // other. Offsets are small (metres-scale via lat/lng deltas) and are only for
  // visual separation — not precise item locations.
  const markers = items.reduce((acc, item) => {
    if (!item || !item.id) return acc;

    // Tier 1: exact captured GPS coordinates when the report has them.
    if (hasValidCoords(item.latitude, item.longitude)) {
      acc.push({
        key: item.id,
        item,
        position: [Number(item.latitude), Number(item.longitude)],
        icon: gpsIcon(item.status),
        isCluster: false,
        isGps: true,
      });
      return acc;
    }

    // Tier 2: zone anchor with a tiny offset so same-zone pins stay separable.
    const zone = item.zone || "Other";
    const base = ZONE_CENTROIDS[zone];
    // Fall back to the "Other" centroid only if the zone is genuinely unknown;
    // guard against a malformed ZONE_CENTROIDS entry too.
    const resolvedBase =
      base &&
      Array.isArray(base) &&
      base.length >= 2 &&
      typeof base[0] === "number" &&
      typeof base[1] === "number"
        ? base
        : ZONE_CENTROIDS.Other;
    // Count only other zone-anchored pins at this exact centroid (GPS pins
    // keep their precise positions and are never offset).
    const existing = acc.filter(
      (m) =>
        !m.isGps &&
        Array.isArray(m.position) &&
        m.position.length >= 2 &&
        m.position[0] === resolvedBase[0] &&
        m.position[1] === resolvedBase[1]
    );
    const idx = existing.length;
    const dlat = (idx % 3) * 0.00012;
    const dlng = (Math.floor(idx / 3) % 2) * 0.00012;
    acc.push({
      key: item.id,
      item,
      position: [resolvedBase[0] + dlat, resolvedBase[1] + dlng],
      icon: itemIcon(item.status, idx),
      isCluster: false,
      isGps: false,
    });
    return acc;
  }, []);

  // Zone-level cluster: if a zone has more than one item, also render a single
  // cluster marker at the zone centroid listing the items in its popup.
  // Exact-GPS items are excluded from zone clusters so their precise position
  // is never hidden behind an aggregate anchor.
  const zoneGroups = items.reduce((acc, item) => {
    if (!item || hasValidCoords(item.latitude, item.longitude)) return acc;
    const zone = item.zone || "Other";
    if (!acc.has(zone)) acc.set(zone, []);
    acc.get(zone).push(item);
    return acc;
  }, new Map());

  const clusters = [];
  zoneGroups.forEach((groupItems, zone) => {
    if (groupItems.length <= 1) return;
    const base = ZONE_CENTROIDS[zone];
    const resolvedBase =
      base &&
      Array.isArray(base) &&
      base.length >= 2 &&
      typeof base[0] === "number" &&
      typeof base[1] === "number"
        ? base
        : ZONE_CENTROIDS.Other;
    // Place the cluster slightly offset from the individual markers.
    const dlat = 0.0004;
    const dlng = 0.0004;
    clusters.push({
      key: `cluster-${zone}`,
      item: null,
      position: [resolvedBase[0] + dlat, resolvedBase[1] + dlng],
      icon: clusterIcon(groupItems.length),
      isCluster: true,
      clusterItems: groupItems,
    });
  });

  const all = markers.concat(clusters);

  return (
    <>
      {all.map((m) => (
        <Marker
          key={m.key}
          position={m.position}
          icon={m.icon}
          propagationStopped={true}
        >
          {m.isCluster ? (
            <Popup maxWidth={280} className="incident-popup">
              {clusterPopupContent(m.clusterItems)}
            </Popup>
          ) : (
            <Popup maxWidth={280} className="incident-popup">
              {itemPopupContent(m.item, m.isGps)}
            </Popup>
          )}
        </Marker>
      ))}
    </>
  );
}

// ---- Legend ----------------------------------------------------------------------

function Legend({ counts }) {
  return (
    <div
      className="leaflet-bar leaflet-control"
      style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(6px)",
        borderRadius: 10,
        padding: "8px 10px",
        minWidth: 150,
        boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>
        Legend
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#f43f5e", border: "2px solid #fff", boxShadow: "0 0 0 1px rgba(0,0,0,0.2)" }} />
          <span style={{ fontSize: 11.5, color: "#0b1c30" }}>Lost</span>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>{counts.lost}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#10b981", border: "2px solid #fff", boxShadow: "0 0 0 1px rgba(0,0,0,0.2)" }} />
          <span style={{ fontSize: 11.5, color: "#0b1c30" }}>Found</span>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>{counts.found}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#64748b", border: "2px solid #fff", boxShadow: "0 0 0 1px rgba(0,0,0,0.2)" }} />
          <span style={{ fontSize: 11.5, color: "#0b1c30" }}>Resolved</span>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>{counts.other}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#fff", border: "3px solid #06b6d4", boxShadow: "0 0 0 1px rgba(6,182,212,0.5)" }} />
          <span style={{ fontSize: 11.5, color: "#0b1c30" }}>Exact GPS</span>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>{counts.gps}</span>
        </div>
      </div>
      <div style={{ marginTop: 7, paddingTop: 6, borderTop: "1px solid rgba(0,0,0,0.08)", fontSize: 10, color: "#64748b", lineHeight: 1.35 }}>
        Ringed markers use exact captured GPS. Others sit at zone anchors.
      </div>
    </div>
  );
}

// ---- Main component -------------------------------------------------------------

export default function CampusIncidentMap({ height = "100%", activeZone = "All Campus", className, items: itemsProp }) {
  const { items: ctxItems, dbLoaded } = useAppData();
  // Use the caller-supplied (already filtered) items when provided, otherwise
  // fall back to the full context items so the component still works standalone.
  const items = itemsProp != null ? itemsProp : ctxItems;

  const counts = {
    lost: items.filter((i) => i.status === "Lost").length,
    found: items.filter((i) => i.status === "Found").length,
    other: items.filter((i) => i.status === "Resolved").length,
    gps: items.filter((i) => hasValidCoords(i.latitude, i.longitude)).length,
  };

  const ready = dbLoaded && items.length > 0;

  return (
    <div style={{ height, width: "100%", position: "relative", background: "#e8edf5" }} className={className || ""}>
      {!dbLoaded ? (
        <div
          className="absolute inset-0 z-[1000] flex items-center justify-center bg-[rgba(232,237,245,0.7)] backdrop-blur-sm"
          style={{ color: "#0b1c30" }}
        >
          <div style={{ textAlign: "center" }}>
            <svg className="animate-spin" width={34} height={34} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ margin: "0 auto 10px" }}>
              <circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeDashoffset="10" />
            </svg>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Loading campus map…</div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>Locating reports across campus</div>
          </div>
        </div>
      ) : counts.lost + counts.found + counts.other === 0 ? (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-[rgba(232,237,245,0.7)] backdrop-blur-sm" style={{ color: "#0b1c30" }}>
          <div style={{ textAlign: "center", maxWidth: 280 }}>
            <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" style={{ margin: "0 auto 10px" }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No reports in this view</div>
            <div style={{ fontSize: 12, color: "#475569", marginBottom: 10 }}>
              {activeZone === "All Campus"
                ? "Try a different filter or report a lost/found item."
                : `No reports near ${activeZone} right now.`}
            </div>
            <a
              href="/reports/lost"
              style={{ display: "inline-block", background: "#0037b0", color: "#fff", borderRadius: 7, padding: "7px 14px", fontSize: 12, fontWeight: 600, textDecoration: "none" }}
            >
              Report an item
            </a>
          </div>
        </div>
      ) : (
        <MapContainer
          center={[12.9346, 77.6108]}
          zoom={16}
          scrollWheelZoom={true}
          className="h-full w-full"
          attributionControl={true}
        >
          <TileLayer url={TILE_URL} attribution={TILE_ATTR} />
          <IndexedMarkers items={items} activeZone={activeZone} />
          <MapController ready={ready} />
          <ResetButton />
          <Legend counts={counts} />
        </MapContainer>
      )}

      {/* visible count badge */}
      <div
        className="absolute top-3 left-3 z-[1000] flex items-center gap-2 bg-white/85 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm border border-outline-variant/20"
        style={{ fontSize: 12, color: "#0b1c30", fontWeight: 600 }}
      >
        <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500, marginRight: 4 }}>Showing</span>
        <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{items.length}</span>
        <span style={{ color: "#475569", marginLeft: 2 }}>
          {items.length === 1 ? "report" : "reports"}
        </span>
      </div>
    </div>
  );
}
