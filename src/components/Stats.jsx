import { useState } from "react";

function StatCard({ title, value, icon, accent, delay }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      className="fade-in glass-card"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        animationDelay: delay,
        borderRadius: "var(--radius-lg)",
        padding: "24px 26px",
        position: "relative",
        overflow: "hidden",
        transform: hover ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hover ? `0 12px 40px ${accent}22` : "none",
        transition: "transform 0.25s, box-shadow 0.25s, border-color 0.25s, background 0.25s",
        borderColor: hover ? `${accent}30` : "var(--border)",
      }}
    >
      {/* Glow blob */}
      <div style={{
        position: "absolute", top: "-20px", right: "-20px",
        width: "100px", height: "100px",
        borderRadius: "50%",
        background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)`,
        pointerEvents: "none",
        transition: "opacity 0.3s",
        opacity: hover ? 1 : 0.5,
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
        <p style={{
          fontFamily: "var(--font-body)",
          fontSize: "13px", fontWeight: 500,
          color: "var(--text-secondary)",
          letterSpacing: "0.01em",
        }}>{title}</p>
        <span style={{
          fontSize: "18px",
          background: `${accent}15`,
          border: `1px solid ${accent}22`,
          width: "34px", height: "34px",
          borderRadius: "9px",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>{icon}</span>
      </div>

      <h2 style={{
        fontFamily: "var(--font-mono)",
        fontSize: "44px",
        fontWeight: 700,
        color: accent,
        lineHeight: 1,
        letterSpacing: "-0.02em",
      }}>{value}</h2>
    </div>
  );
}

function Stats({ items }) {
  const lost = items.filter((i) => i.status === "Lost").length;
  const found = items.filter((i) => i.status === "Found").length;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
      <StatCard title="Lost Reports" value={lost} icon="📋" accent="#f43f5e" delay="0s" />
      <StatCard title="Recovered Items" value={found} icon="✅" accent="#10b981" delay="0.06s" />
      <StatCard title="Total Tracked" value={items.length} icon="🔍" accent="#06b6d4" delay="0.12s" />
    </div>
  );
}

export default Stats;
