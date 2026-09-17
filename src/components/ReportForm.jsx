import { useState } from "react";
import { getProfanityError } from "../data/profanity";

function Label({ children }) {
  return (
    <label style={{
      display: "block",
      fontFamily: "var(--font-mono)",
      fontSize: "10px",
      fontWeight: 600,
      color: "var(--text-muted)",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      marginBottom: "7px",
    }}>{children}</label>
  );
}

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: "6px",
      marginTop: "6px",
      padding: "8px 10px",
      background: "rgba(244,63,94,0.07)",
      border: "1px solid rgba(244,63,94,0.2)",
      borderRadius: "8px",
    }}>
      <span style={{ fontSize: "12px", flexShrink: 0 }}>🚫</span>
      <p style={{ fontSize: "12px", color: "#f87171", lineHeight: 1.5, margin: 0 }}>{msg}</p>
    </div>
  );
}

function ReportForm({ addItem }) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("Lost");
  const [category, setCategory] = useState("Other");
  const [submitted, setSubmitted] = useState(false);

  const [nameError, setNameError] = useState("");
  const [locationError, setLocationError] = useState("");

  const validateName = (val) => {
    const trimmed = val.trim();
    if (!trimmed) return "Item name is required.";
    if (trimmed.length < 2) return "Item name must be at least 2 characters.";
    if (trimmed.length > 60) return "Item name is too long (max 60 characters).";
    const profanity = getProfanityError(trimmed);
    if (profanity) return profanity;
    return "";
  };

  const validateLocation = (val) => {
    const trimmed = val.trim();
    if (!trimmed) return "Location is required.";
    if (trimmed.length < 2) return "Location must be at least 2 characters.";
    if (trimmed.length > 60) return "Location is too long (max 60 characters).";
    const profanity = getProfanityError(trimmed);
    if (profanity) return profanity;
    return "";
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
    if (nameError) setNameError(validateName(e.target.value));
  };

  const handleLocationChange = (e) => {
    setLocation(e.target.value);
    if (locationError) setLocationError(validateLocation(e.target.value));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const nErr = validateName(name);
    const lErr = validateLocation(location);

    setNameError(nErr);
    setLocationError(lErr);

    if (nErr || lErr) return;

    addItem({
      id: Date.now(),
      name: name.trim(),
      location: location.trim(),
      status,
      category,
      date: new Date().toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      }),
    });

    setName(""); setLocation(""); setCategory("Other"); setStatus("Lost");
    setNameError(""); setLocationError("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2500);
  };

  const inputStyle = (hasError) => ({
    width: "100%",
    background: "rgba(0,0,0,0.3)",
    border: `1px solid ${hasError ? "rgba(244,63,94,0.5)" : "rgba(255,255,255,0.08)"}`,
    borderRadius: "var(--radius-sm)",
    padding: "11px 14px",
    color: "var(--text-primary)",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
    fontFamily: "var(--font-body)",
  });

  return (
    <div id="reports" className="glass-card" style={{ borderRadius: "var(--radius-xl)", padding: "24px" }}>

      {/* Header */}
      <div style={{ marginBottom: "22px" }}>
        <p className="section-label">New Report</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>
          Report Item
        </h2>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
          Fill in the details below
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

        <div>
          <Label>Item Name</Label>
          <input
            style={inputStyle(!!nameError)}
            type="text"
            placeholder="e.g. Black Wallet"
            value={name}
            onChange={handleNameChange}
            onBlur={() => setNameError(validateName(name))}
            onFocus={(e) => {
              if (!nameError) e.target.style.borderColor = "rgba(6,182,212,0.5)";
            }}
          />
          <FieldError msg={nameError} />
        </div>

        <div>
          <Label>Last Seen Location</Label>
          <input
            style={inputStyle(!!locationError)}
            type="text"
            placeholder="e.g. Library, Canteen"
            value={location}
            onChange={handleLocationChange}
            onBlur={() => setLocationError(validateLocation(location))}
            onFocus={(e) => {
              if (!locationError) e.target.style.borderColor = "rgba(6,182,212,0.5)";
            }}
          />
          <FieldError msg={locationError} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div>
            <Label>Category</Label>
            <select
              style={{ ...inputStyle(false), cursor: "pointer" }}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {["Electronics", "Documents", "Wallet", "Keys", "Clothing", "Accessories", "Other"].map((c) => (
                <option key={c} value={c} style={{ background: "#0a1628" }}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <Label>Status</Label>
            <select
              style={{ ...inputStyle(false), cursor: "pointer" }}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Lost" style={{ background: "#0a1628" }}>Lost</option>
              <option value="Found" style={{ background: "#0a1628" }}>Found</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary"
          style={{
            marginTop: "4px",
            background: submitted ? "var(--green)" : "var(--cyan)",
            color: submitted ? "#fff" : "#000",
            transform: submitted ? "scale(0.98)" : undefined,
          }}
        >
          {submitted ? "✓ Report Submitted!" : "Submit Report"}
        </button>

      </form>

      <p style={{
        marginTop: "16px", fontSize: "11px", color: "var(--text-muted)",
        textAlign: "center", lineHeight: 1.6,
      }}>
        Reports are stored locally. Offensive or inappropriate language is not permitted.
      </p>
    </div>
  );
}

export default ReportForm;
