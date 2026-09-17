import { useState } from "react";

function SearchBar({ search, setSearch, filter, setFilter }) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="glass-card" style={{
      borderRadius: "var(--radius-md)",
      padding: "12px 16px",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      borderColor: focused ? "rgba(6,182,212,0.3)" : "var(--border)",
      boxShadow: focused ? "0 0 0 3px rgba(6,182,212,0.06)" : "none",
      transition: "border-color 0.2s, box-shadow 0.2s",
    }}>

      {/* Icon */}
      <svg width="16" height="16" fill="none" stroke="var(--text-muted)" strokeWidth="2"
        viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <circle cx="11" cy="11" r="8" />
        <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
      </svg>

      {/* Input */}
      <input
        type="text"
        placeholder="Search reports by item name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1,
          background: "transparent",
          border: "none",
          outline: "none",
          color: "var(--text-primary)",
          fontSize: "14px",
          fontFamily: "var(--font-body)",
        }}
      />

      {/* Divider */}
      <div style={{ width: "1px", height: "20px", background: "var(--border)", flexShrink: 0 }} />

      {/* Filter Pills */}
      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
        {["All", "Lost", "Found"].map((f) => {
          const active = filter === f;
          const colors = { Lost: "#f43f5e", Found: "#10b981", All: "var(--cyan)" };
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "5px 14px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 600,
                fontFamily: "var(--font-body)",
                cursor: "pointer",
                border: active ? "none" : "1px solid var(--border)",
                background: active ? colors[f] : "transparent",
                color: active ? (f === "All" ? "#000" : "#fff") : "var(--text-secondary)",
                transition: "all 0.18s",
                letterSpacing: "0.02em",
              }}
            >{f}</button>
          );
        })}
      </div>
    </div>
  );
}

export default SearchBar;
