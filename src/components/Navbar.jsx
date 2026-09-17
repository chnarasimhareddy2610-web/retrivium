import { useState, useEffect } from "react";

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <nav style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      background: scrolled ? "rgba(3, 10, 20, 0.92)" : "rgba(3, 10, 20, 0.7)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "1px solid transparent",
      transition: "all 0.3s ease",
    }}>
      <div style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "0 24px",
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px", height: "32px",
            background: "linear-gradient(135deg, var(--cyan), var(--blue))",
            borderRadius: "9px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-display)",
            fontWeight: 800, fontSize: "14px", color: "#000",
            boxShadow: "0 0 16px rgba(6,182,212,0.3)",
          }}>R</div>
          <span style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700, fontSize: "16px", color: "var(--text-primary)",
            letterSpacing: "0.04em",
          }}>RETRIVIUM</span>
        </div>

        {/* Links */}
        <div style={{ display: "flex", gap: "2px" }}>
          {[
            { label: "Dashboard", id: "dashboard" },
            { label: "Reports", id: "reports" },
            { label: "Matches", id: "matches" },
          ].map((link) => (
            <NavLink key={link.id} label={link.label} onClick={() => scrollTo(link.id)} />
          ))}
        </div>

        {/* Badge */}
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px", fontWeight: 600,
          color: "var(--cyan)",
          background: "rgba(6,182,212,0.08)",
          border: "1px solid rgba(6,182,212,0.18)",
          padding: "4px 10px", borderRadius: "999px",
          letterSpacing: "0.06em",
        }}>
          
        </div>
      </div>
    </nav>
  );
}

function NavLink({ label, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "7px 16px",
        fontSize: "13px",
        fontWeight: 500,
        color: hover ? "var(--text-primary)" : "var(--text-secondary)",
        background: hover ? "rgba(255,255,255,0.06)" : "transparent",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        transition: "all 0.18s",
        fontFamily: "var(--font-body)",
      }}
    >
      {label}
    </button>
  );
}

export default Navbar;
