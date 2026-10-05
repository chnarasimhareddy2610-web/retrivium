import { useState, useRef, useEffect } from "react";
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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

function ReportForm({ onSubmit, addItem, defaultStatus = "Lost" }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState(defaultStatus);
  const [prevDefaultStatus, setPrevDefaultStatus] = useState(defaultStatus);

  if (prevDefaultStatus !== defaultStatus) {
    setPrevDefaultStatus(defaultStatus);
    setStatus(defaultStatus);
  }
  const [category, setCategory] = useState("Other");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [nameError, setNameError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [imageError, setImageError] = useState("");

  // Keep a ref to the actual File object for upload
  const imageFileRef = useRef(null);

  const [imagePreview, setImagePreview] = useState(null);
  const previewRef = useRef(null);
  const fileInputRef = useRef(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewRef.current && previewRef.current.startsWith("blob:")) {
        URL.revokeObjectURL(previewRef.current);
      }
    };
  }, []);

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

  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setImageError("Please select a valid image file (JPEG, PNG, WebP, GIF).");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setImageError("File size exceeds 5MB limit. Please select a smaller image.");
      return;
    }

    setImageError("");
    if (previewRef.current && previewRef.current.startsWith("blob:")) {
      URL.revokeObjectURL(previewRef.current);
    }

    imageFileRef.current = file; // store actual File
    const objectUrl = URL.createObjectURL(file);
    previewRef.current = objectUrl;
    setImagePreview(objectUrl);
  };

  const handleRemoveImage = () => {
    if (previewRef.current && previewRef.current.startsWith("blob:")) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    imageFileRef.current = null;
    setImagePreview(null);
    setImageError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setLocation("");
    setCategory("Other");
    setStatus(defaultStatus);
    setNameError("");
    setLocationError("");
    setImageError("");
    setSubmitError("");
    imageFileRef.current = null;
    previewRef.current = null;
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const nErr = validateName(name);
    const lErr = validateLocation(location);
    setNameError(nErr);
    setLocationError(lErr);
    if (nErr || lErr || imageError) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      // Prefer real async onSubmit (Supabase), fall back to legacy addItem
      const handler = onSubmit || addItem;
      await handler({
        name: name.trim(),
        location: location.trim(),
        description: description.trim(),
        status,
        category,
        imageFile: imageFileRef.current || null,
      });
      resetForm();
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2500);
    } catch (err) {
      setSubmitError(err.message || "Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
          Report {status} Item
        </h2>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
          Fill in the details below to notify the campus network
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

        {submitError && (
          <div style={{
            padding: "10px 12px",
            background: "rgba(244,63,94,0.1)",
            border: "1px solid rgba(244,63,94,0.3)",
            borderRadius: "8px",
            fontSize: "13px",
            color: "#f87171",
          }}>
            {submitError}
          </div>
        )}

        <div>
          <Label>Item Name</Label>
          <input
            style={inputStyle(!!nameError)}
            type="text"
            placeholder="e.g. Black Leather Wallet"
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
          <Label>Description (Optional)</Label>
          <textarea
            style={{ ...inputStyle(false), minHeight: "72px", resize: "vertical" }}
            placeholder="Provide extra details to help identify the item…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <Label>Last Seen Location</Label>
          <input
            style={inputStyle(!!locationError)}
            type="text"
            placeholder="e.g. Library 2nd Floor, Main Canteen"
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
              style={{ ...inputStyle(false), cursor: "pointer", color: "var(--text-primary)" }}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {["Electronics", "Documents", "Wallet", "Keys", "Clothing", "Accessories", "Other"].map((c) => (
                <option key={c} value={c} style={{ background: "#1e293b", color: "#f8fafc" }}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <Label>Status</Label>
            <select
              style={{ ...inputStyle(false), cursor: "pointer", color: "var(--text-primary)" }}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Lost" style={{ background: "#1e293b", color: "#f8fafc" }}>Lost</option>
              <option value="Found" style={{ background: "#1e293b", color: "#f8fafc" }}>Found</option>
            </select>
          </div>
        </div>

        {/* Image Attachment Field */}
        <div>
          <Label>Item Photo (Optional)</Label>
          {!imagePreview ? (
            <div
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              style={{
                border: "1px dashed rgba(255,255,255,0.2)",
                borderRadius: "var(--radius-sm)",
                padding: "16px",
                textAlign: "center",
                cursor: "pointer",
                background: "rgba(0,0,0,0.2)",
                transition: "border-color 0.2s",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "var(--text-muted)" }}>
                add_a_photo
              </span>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px", margin: 0 }}>
                Click to attach an image (Max 5MB)
              </p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px", margin: 0 }}>
                JPG, PNG, WebP, GIF
              </p>
            </div>
          ) : (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px",
              background: "rgba(0,0,0,0.3)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}>
              <img
                src={imagePreview}
                alt="Selected preview"
                style={{ width: "52px", height: "52px", objectFit: "cover", borderRadius: "6px" }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 500, margin: 0 }}>
                  Photo Attached
                </p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                  Session preview ready
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemoveImage}
                style={{
                  background: "rgba(244,63,94,0.15)",
                  border: "1px solid rgba(244,63,94,0.3)",
                  color: "#f87171",
                  borderRadius: "6px",
                  padding: "6px 10px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
          <FieldError msg={imageError} />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary"
          style={{
            marginTop: "8px",
            background: submitted ? "var(--green)" : "var(--cyan)",
            color: submitted ? "#fff" : "#000",
            transform: submitted ? "scale(0.98)" : undefined,
            opacity: submitting ? 0.65 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {submitting && (
            <span style={{
              width: "14px", height: "14px", border: "2px solid #000",
              borderTopColor: "transparent", borderRadius: "50%",
              display: "inline-block", animation: "spin 0.7s linear infinite",
            }} />
          )}
          {submitted ? "✓ Report Submitted!" : submitting ? "Saving…" : `Submit ${status} Report`}
        </button>

      </form>

      <p style={{
        marginTop: "16px", fontSize: "11px", color: "var(--text-muted)",
        textAlign: "center", lineHeight: 1.6,
      }}>
        Reports are saved to the campus database. Offensive or inappropriate language is not permitted.
      </p>
    </div>
  );
}

export default ReportForm;
