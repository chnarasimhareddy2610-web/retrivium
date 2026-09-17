function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid var(--border)",
      padding: "32px 24px",
    }}>
      <div style={{
        maxWidth: "1280px",
        margin: "0 auto",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
      }}>

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "28px", height: "28px",
            background: "linear-gradient(135deg, var(--cyan), var(--blue))",
            borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "12px", color: "#000",
          }}>R</div>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "13px", color: "var(--text-primary)" }}>
              RETRIVIUM
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--text-muted)" }}>
              Intelligent Campus Recovery Network
            </p>
          </div>
        </div>

        {/* Center tag */}
        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          fontFamily: "var(--font-mono)",
          fontSize: "11px", color: "var(--text-muted)",
          letterSpacing: "0.06em",
        }}>
          <span style={{
            width: "5px", height: "5px", borderRadius: "50%",
            background: "var(--cyan)", opacity: 0.6,
          }} />
          <span>2026 RETRIVIUM. All rights reserved.</span>
          <span style={{
            width: "5px", height: "5px", borderRadius: "50%",
            background: "var(--cyan)", opacity: 0.6,
          }} />
        </div>

        {/* Built with */}
        <p style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px", color: "var(--text-muted)",
          letterSpacing: "0.04em",
        }}>
          Built with React + Vite
        </p>
      </div>
    </footer>
  );
}

export default Footer;
