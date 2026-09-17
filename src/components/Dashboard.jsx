import { useState } from "react";

const CATEGORY_COLORS = {
  Electronics: { bg: "rgba(59,130,246,0.1)",  color: "#60a5fa", border: "rgba(59,130,246,0.2)" },
  Documents:   { bg: "rgba(245,158,11,0.1)",  color: "#fbbf24", border: "rgba(245,158,11,0.2)" },
  Wallet:      { bg: "rgba(16,185,129,0.1)",  color: "#34d399", border: "rgba(16,185,129,0.2)" },
  Keys:        { bg: "rgba(168,85,247,0.1)",  color: "#c084fc", border: "rgba(168,85,247,0.2)" },
  Clothing:    { bg: "rgba(236,72,153,0.1)",  color: "#f472b6", border: "rgba(236,72,153,0.2)" },
  Accessories: { bg: "rgba(251,146,60,0.1)",  color: "#fb923c", border: "rgba(251,146,60,0.2)" },
  Other:       { bg: "rgba(100,116,139,0.1)", color: "#94a3b8", border: "rgba(100,116,139,0.2)" },
  General:     { bg: "rgba(100,116,139,0.1)", color: "#94a3b8", border: "rgba(100,116,139,0.2)" },
};

function CategoryPill({ category }) {
  const c = CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 9px",
      fontSize: "11px", fontWeight: 600,
      fontFamily: "var(--font-mono)",
      background: c.bg, color: c.color,
      border: `1px solid ${c.border}`,
      borderRadius: "999px",
      letterSpacing: "0.02em",
    }}>{category || "Other"}</span>
  );
}

function ReportCard({ item, markFound }) {
  const [hovered, setHovered] = useState(false);
  const isLost = item.status === "Lost";

  return (
    <div
      className="report-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ borderColor: hovered ? "rgba(6,182,212,0.22)" : "var(--border)" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
            <h3 style={{
              fontFamily: "var(--font-display)",
              fontSize: "15px", fontWeight: 700,
              color: "var(--text-primary)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{item.name}</h3>
            {item.category && <CategoryPill category={item.category} />}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{item.location}</span>
          </div>

          {item.date && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
              {item.date}
            </span>
          )}
        </div>

        {/* Status badge */}
        <span style={{
          flexShrink: 0,
          padding: "4px 12px", borderRadius: "999px",
          fontSize: "12px", fontWeight: 700,
          fontFamily: "var(--font-mono)", letterSpacing: "0.04em",
          background: isLost ? "var(--red-dim)" : "var(--green-dim)",
          color: isLost ? "var(--red)" : "var(--green)",
          border: `1px solid ${isLost ? "rgba(244,63,94,0.2)" : "rgba(16,185,129,0.2)"}`,
        }}>
          {item.status}
        </span>
      </div>

      {/* Only show "Mark as Found" action — no delete */}
      {isLost && hovered && (
        <div style={{
          display: "flex",
          marginTop: "12px", paddingTop: "12px",
          borderTop: "1px solid var(--border)",
        }}>
          <MarkFoundBtn onClick={() => markFound(item.id)} />
        </div>
      )}
    </div>
  );
}

function MarkFoundBtn({ onClick }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: "5px 14px",
        fontSize: "12px", fontWeight: 600,
        fontFamily: "var(--font-body)",
        color: "var(--green)",
        cursor: "pointer",
        background: h ? "var(--green-dim)" : "transparent",
        border: `1px solid ${h ? "rgba(16,185,129,0.18)" : "var(--border)"}`,
        borderRadius: "7px",
        transition: "all 0.18s",
      }}
    >✓ Mark as Found</button>
  );
}

function Dashboard({ items, markFound }) {
  if (items.length === 0) {
    return (
      <div id="dashboard" className="glass-card" style={{
        borderRadius: "var(--radius-xl)", padding: "60px 24px",
        textAlign: "center", minHeight: "280px",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: "10px",
      }}>
        <div style={{ fontSize: "36px", marginBottom: "4px" }}>🔍</div>
        <p style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>
          No reports found
        </p>
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          Try adjusting your search or filter.
        </p>
      </div>
    );
  }

  return (
    <div id="dashboard" className="glass-card" style={{ borderRadius: "var(--radius-xl)", padding: "22px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
        <div>
          <p className="section-label">Live Feed</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
            Active Reports
          </h2>
        </div>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "12px", color: "var(--text-muted)",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid var(--border)",
          padding: "4px 12px", borderRadius: "999px",
        }}>
          {items.length} {items.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      {/* Cards */}
      <div style={{
        display: "flex", flexDirection: "column", gap: "8px",
        maxHeight: "500px", overflowY: "auto", paddingRight: "2px",
      }}>
        {items.map((item) => (
          <ReportCard key={item.id} item={item} markFound={markFound} />
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
