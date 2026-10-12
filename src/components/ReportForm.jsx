import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProfanityError } from "../data/profanity";
import { hasValidCoords } from "../lib/geo";
import { ZONES } from "../data/dummyData";
import { useAppData } from "../context/AppDataContext";
import { findDuplicateReports } from "../lib/duplicateDetectionService";
import ItemImage from "./common/ItemImage";

// Campus zones a reporter can pick manually as a fallback when they
// decline/omit GPS. Mirrors the DB campus_zone enum (minus the UI-only
// "All Campus" filter value, plus the enum's "Other").
const CAMPUS_ZONES = [...ZONES.filter((z) => z !== "All Campus"), "Other"];

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
  const { items } = useAppData();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  // Optional manual campus zone (nullable) — used as the map fallback when
  // no GPS coordinates are captured.
  const [zone, setZone] = useState("");
  // Optional browser GPS capture. `coords` stays null until the user
  // explicitly requests their location and it resolves successfully.
  const [coords, setCoords] = useState(null);
  const [geoStatus, setGeoStatus] = useState("idle"); // idle | loading | success | error
  const [geoError, setGeoError] = useState("");
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

  // Duplicate report detection warning modal state
  const [duplicateWarningOpen, setDuplicateWarningOpen] = useState(false);
  const [duplicateCandidates, setDuplicateCandidates] = useState([]);
  const [pendingSubmissionPayload, setPendingSubmissionPayload] = useState(null);

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

  // Explicit, user-triggered GPS request. Permission is NEVER requested on
  // mount — only when the reporter clicks "Use my current location".
  const handleUseLocation = () => {
    setGeoError("");

    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setGeoStatus("error");
      setGeoError("Location is not supported by this browser. Choose a campus zone instead.");
      return;
    }

    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos && pos.coords ? pos.coords.latitude : null;
        const lng = pos && pos.coords ? pos.coords.longitude : null;
        const accuracy = pos && pos.coords ? pos.coords.accuracy : null;

        if (!hasValidCoords(lat, lng)) {
          setCoords(null);
          setGeoStatus("error");
          setGeoError("Received invalid coordinates. Try again or choose a campus zone instead.");
          return;
        }

        setCoords({ latitude: lat, longitude: lng, accuracy });
        setGeoStatus("success");
      },
      (err) => {
        setCoords(null);
        setGeoStatus("error");
        const code = err && err.code;
        if (code === 1) {
          setGeoError("Location permission denied. You can still submit by choosing a campus zone manually.");
        } else if (code === 2) {
          setGeoError("Your position is unavailable right now. Choose a campus zone instead.");
        } else if (code === 3) {
          setGeoError("Location request timed out. Try again or choose a campus zone instead.");
        } else {
          setGeoError("Could not get your location. You can still submit by choosing a campus zone.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleClearLocation = () => {
    setCoords(null);
    setGeoStatus("idle");
    setGeoError("");
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
    setZone("");
    setCoords(null);
    setGeoStatus("idle");
    setGeoError("");
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

  const proceedWithSubmission = async (payload) => {
    setSubmitting(true);
    setSubmitError("");
    setDuplicateWarningOpen(false);
    setPendingSubmissionPayload(null);

    try {
      // Prefer real async onSubmit (Supabase), fall back to legacy addItem
      const handler = onSubmit || addItem;
      await handler(payload);
      resetForm();
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2500);
    } catch (err) {
      setSubmitError(err.message || "Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const nErr = validateName(name);
    const lErr = validateLocation(location);
    setNameError(nErr);
    setLocationError(lErr);
    if (nErr || lErr || imageError) return;

    const payload = {
      name: name.trim(),
      location: location.trim(),
      description: description.trim(),
      status,
      category,
      imageFile: imageFileRef.current || null,
      latitude: coords ? coords.latitude : null,
      longitude: coords ? coords.longitude : null,
      zone: zone || null,
    };

    // Check for duplicate reports among active items
    const duplicates = findDuplicateReports(payload, items);
    if (duplicates.length > 0) {
      setDuplicateCandidates(duplicates);
      setPendingSubmissionPayload(payload);
      setDuplicateWarningOpen(true);
      return;
    }

    await proceedWithSubmission(payload);
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

        {/* Optional GPS capture + manual campus-zone fallback */}
        <div>
          <Label>Campus Position (Optional)</Label>
          <div style={{
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "var(--radius-sm)",
            background: "rgba(0,0,0,0.2)",
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
              Add your exact position so this report lands precisely on the campus map. Optional — you can submit with just a campus zone.
            </p>

            {geoStatus === "success" && coords ? (
              <div style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "9px 11px",
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.3)",
                borderRadius: "8px",
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#34d399" }}>location_on</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "12.5px", color: "#34d399", fontWeight: 600, margin: 0 }}>Location captured</p>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "2px 0 0 0", fontFamily: "var(--font-mono)" }}>
                    {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
                    {typeof coords.accuracy === "number" ? ` · ±${Math.round(coords.accuracy)}m` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearLocation}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "var(--text-secondary)",
                    borderRadius: "6px",
                    padding: "5px 9px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  Clear
                </button>
              </div>
            ) : geoStatus === "loading" ? (
              <div style={{
                display: "flex", alignItems: "center", gap: "9px",
                padding: "9px 11px",
                background: "rgba(6,182,212,0.08)",
                border: "1px solid rgba(6,182,212,0.25)",
                borderRadius: "8px",
              }}>
                <span style={{
                  width: "14px", height: "14px", border: "2px solid var(--cyan)",
                  borderTopColor: "transparent", borderRadius: "50%",
                  display: "inline-block", animation: "spin 0.7s linear infinite",
                }} />
                <p style={{ fontSize: "12.5px", color: "var(--cyan)", margin: 0 }}>Getting your location…</p>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleUseLocation}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  padding: "10px 12px",
                  background: "rgba(6,182,212,0.12)",
                  border: "1px solid rgba(6,182,212,0.35)",
                  color: "var(--cyan)",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>my_location</span>
                {geoStatus === "error" ? "Try again" : "Use my current location"}
              </button>
            )}

            {geoStatus === "loading" && (
              <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                You can still submit now — the report saves without coordinates if the location isn't ready.
              </p>
            )}

            <FieldError msg={geoError} />

            <div>
              <Label>Choose campus zone manually</Label>
              <select
                style={{ ...inputStyle(false), cursor: "pointer", color: "var(--text-primary)" }}
                value={zone}
                onChange={(e) => setZone(e.target.value)}
              >
                <option value="" style={{ background: "#1e293b", color: "#f8fafc" }}>No zone (free-text location only)</option>
                {CAMPUS_ZONES.map((z) => (
                  <option key={z} value={z} style={{ background: "#1e293b", color: "#f8fafc" }}>{z}</option>
                ))}
              </select>
            </div>
          </div>
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

      {/* Duplicate Report Detection Warning Modal */}
      {duplicateWarningOpen && duplicateCandidates.length > 0 && (
        <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start gap-3 border-b border-outline-variant/20 pb-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-amber-500">
                <span className="material-symbols-outlined text-[24px]">warning</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-headline-sm font-semibold text-on-surface">Possible Duplicate Report</h3>
                <p className="text-body-sm text-on-surface-variant mt-0.5">
                  We found an existing active report that looks very similar to yours. Please review it before submitting to help avoid duplicate records.
                </p>
              </div>
            </div>

            {/* Top Match Preview Card */}
            {(() => {
              const topMatch = duplicateCandidates[0];
              const item = topMatch.existingItem;
              return (
                <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-500">
                        {topMatch.score}% Similarity ({topMatch.confidence} Match)
                      </span>
                      <span className="text-[11px] font-mono text-outline">
                        {item.tag || item.id}
                      </span>
                    </div>
                    <span className="text-label-sm text-on-surface-variant">
                      {item.date || "Active"}
                    </span>
                  </div>

                  <div className="flex gap-3 items-start">
                    {item.image_path && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-surface">
                        <ItemImage imagePath={item.image_path} alt={item.name} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-headline-sm text-on-surface truncate">{item.name}</h4>
                      <p className="text-body-sm text-on-surface-variant mt-0.5">
                        <span className="font-medium text-on-surface">{item.status}</span> • {item.category} • {item.zone ? `${item.zone} (${item.location})` : item.location}
                      </p>
                      {item.description && (
                        <p className="text-body-sm text-on-surface-variant/80 mt-1 line-clamp-2 italic">
                          &ldquo;{item.description}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Why it was flagged */}
                  {topMatch.reasons && topMatch.reasons.length > 0 && (
                    <div className="pt-2 border-t border-outline-variant/10">
                      <p className="text-[11px] font-semibold text-outline uppercase tracking-wider mb-1.5">
                        Why this was flagged:
                      </p>
                      <ul className="text-body-sm text-on-surface-variant space-y-1">
                        {topMatch.reasons.map((r, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-[12.5px]">
                            <span className="material-symbols-outlined text-[14px] text-amber-500">check_circle</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Guidance Alert */}
            <div className="p-3 bg-surface-container rounded-lg text-body-sm text-on-surface-variant">
              If this is indeed your item or already reported, you can view the active report. If your report is distinct, you can proceed and submit anyway.
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-2 border-t border-outline-variant/20 pt-4">
              <button
                type="button"
                onClick={() => {
                  setDuplicateWarningOpen(false);
                  const topItem = duplicateCandidates[0]?.existingItem;
                  if (topItem) {
                    navigate(`/browse?search=${encodeURIComponent(topItem.name)}`);
                  } else {
                    navigate("/browse");
                  }
                }}
                className="px-4 py-2 border border-outline-variant text-on-surface rounded-lg font-medium hover:bg-surface-container transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">search</span>
                View Existing Report
              </button>

              <button
                type="button"
                onClick={() => {
                  if (pendingSubmissionPayload) {
                    proceedWithSubmission(pendingSubmissionPayload);
                  }
                }}
                disabled={submitting}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg font-medium hover:bg-primary-container transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">send</span>
                )}
                Submit Anyway
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default ReportForm;
