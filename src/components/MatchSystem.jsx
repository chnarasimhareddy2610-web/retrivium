function MatchSystem({ items }) {
  const seen = new Set();
  const matches = [];

  items.forEach((a) => {
    items.forEach((b) => {
      const key = [a.id, b.id].sort().join(":");
      if (
        a.id !== b.id &&
        a.name.toLowerCase() === b.name.toLowerCase() &&
        a.status !== b.status &&
        !seen.has(key)
      ) {
        seen.add(key);
        const lost = a.status === "Lost" ? a : b;
        const found = a.status === "Found" ? a : b;
        matches.push({ lost, found, key });
      }
    });
  });

  return (
    <section id="matches">

      {/* Section Header */}
      <div style={{ marginBottom: "20px" }}>
        <p className="section-label">AI Detection</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "26px", fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.01em",
          }}>Smart Match Detection</h2>

          {matches.length > 0 && (
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px", fontWeight: 700,
              color: "var(--cyan)",
              background: "var(--cyan-dim)",
              border: "1px solid rgba(6,182,212,0.2)",
              padding: "5px 14px", borderRadius: "999px",
            }}>
              {matches.length} Match{matches.length !== 1 ? "es" : ""} Found
            </span>
          )}
        </div>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "6px" }}>
          Automatically detects when a lost item matches a found report by name.
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="glass-card" style={{
          borderRadius: "var(--radius-xl)",
          padding: "56px 24px",
          textAlign: "center",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
        }}>
          <div style={{ fontSize: "36px" }}>🤝</div>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>
            No matches detected yet
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", maxWidth: "360px", lineHeight: 1.6 }}>
            Submit a <strong style={{ color: "var(--red)", fontWeight: 600 }}>Lost</strong> and a{" "}
            <strong style={{ color: "var(--green)", fontWeight: 600 }}>Found</strong> report with the same item name to trigger a match.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "14px" }}>
          {matches.map(({ lost, found, key }, i) => (
            <MatchCard key={key} lost={lost} found={found} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}

function MatchCard({ lost, found, index }) {
  return (
    <div
      className="glass-card"
      style={{
        borderRadius: "var(--radius-xl)",
        padding: "24px",
        borderColor: "rgba(6,182,212,0.18)",
        background: "rgba(6,182,212,0.025)",
      }}
    >
      {/* Match tag */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <span style={{
            width: "8px", height: "8px", borderRadius: "50%",
            background: "var(--cyan)",
            boxShadow: "0 0 8px var(--cyan)",
            animation: "pulse-dot 2s infinite",
          }} />
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px", fontWeight: 700,
            color: "var(--cyan)",
            letterSpacing: "0.05em",
          }}>POTENTIAL MATCH DETECTED</span>
        </div>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px", color: "var(--text-muted)",
          marginLeft: "auto",
        }}>#{String(index + 1).padStart(2, "0")}</span>
      </div>

      {/* Match pair */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "12px", alignItems: "center" }}>

        {/* Lost card */}
        <div style={{
          background: "rgba(244,63,94,0.06)",
          border: "1px solid rgba(244,63,94,0.18)",
          borderRadius: "var(--radius-md)", padding: "16px",
        }}>
          <p style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px", fontWeight: 700,
            color: "var(--red)", letterSpacing: "0.1em",
            marginBottom: "8px",
          }}>LOST REPORT</p>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", color: "var(--text-primary)" }}>
            {lost.name}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "6px" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{lost.location}</span>
          </div>
          {lost.date && <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>{lost.date}</p>}
        </div>

        {/* Connector */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
          <div style={{ width: "1px", height: "16px", background: "var(--border)" }} />
          <span style={{ fontSize: "16px" }}>🔗</span>
          <div style={{ width: "1px", height: "16px", background: "var(--border)" }} />
        </div>

        {/* Found card */}
        <div style={{
          background: "rgba(16,185,129,0.06)",
          border: "1px solid rgba(16,185,129,0.18)",
          borderRadius: "var(--radius-md)", padding: "16px",
        }}>
          <p style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px", fontWeight: 700,
            color: "var(--green)", letterSpacing: "0.1em",
            marginBottom: "8px",
          }}>FOUND REPORT</p>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", color: "var(--text-primary)" }}>
            {found.name}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "6px" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{found.location}</span>
          </div>
          {found.date && <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>{found.date}</p>}
        </div>
      </div>
    </div>
  );
}

export default MatchSystem;
