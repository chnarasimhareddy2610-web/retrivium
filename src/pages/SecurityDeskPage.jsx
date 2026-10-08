import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext";
import { supabase } from "../lib/supabaseClient";
import { normalizeDbItem } from "../lib/itemService";
import {
  fetchAllClaimsForSecurity,
  normalizeDbClaim,
} from "../lib/claimService";
import { completeHandover } from "../lib/handoverService";
import ItemImage from "../components/common/ItemImage";

const RECOVERY_STAGE_LABELS = {
  at_security: "Held by Security",
  claim_approved: "Ready for Handover",
  handed_over: "Handed Over",
};

function normalizeRole(role) {
  if (!role) return null;
  const r = String(role).toLowerCase().trim();
  if (r === "security" || r === "security desk") return "security";
  if (r === "admin") return "admin";
  return null;
}

function Card({ icon, title, value, color, onClick }) {
  const colorStyles = {
    primary: "bg-primary-container text-on-primary-container",
    secondary: "bg-secondary-container text-on-secondary-container",
    tertiary: "bg-tertiary-container text-on-tertiary-container",
    error: "bg-error-container text-on-error-container",
  }[color] || "bg-surface-container-high text-on-surface-variant";

  const dotColor = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    tertiary: "bg-tertiary",
    error: "bg-error",
  }[color] || "bg-outline";

  return (
    <button
      onClick={onClick}
      className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 transition-colors hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-label-sm text-on-surface-variant uppercase">
            <span className="material-symbols-outlined text-[16px]">{icon}</span>
            {title}
          </div>
          <p className={`text-display-lg mt-1 ${colorStyles.split(" ")[1] || "text-on-surface"}`}>
            {value}
          </p>
        </div>
        <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
      </div>
    </button>
  );
}

function ItemCard({ item, claim, handoverClaim, isSelected, onSelect }) {
  const status =
    item.status.toUpperCase() + " · " + (item.recoveryState ? RECOVERY_STAGE_LABELS[item.recoveryState]?.toUpperCase() || "—" : "No stage");

  return (
    <div
      className={`bg-surface-container-lowest border rounded-xl p-4 transition-colors shadow-sm ${
        isSelected
          ? "border-secondary ring-2 ring-secondary/30 shadow-md"
          : "border-outline-variant/20 hover:shadow-md hover:border-outline-variant/30"
      }`}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {item.image_path ? (
              <div className="w-14 h-14 rounded-lg bg-surface-container overflow-hidden flex-shrink-0">
                <ItemImage imagePath={item.image_path} alt={item.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-lg bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-outline text-2xl">image</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-label-md text-on-surface font-medium truncate">{item.name}</p>
              <p className="text-body-sm text-on-surface-variant truncate">{item.location}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-code-sm text-outline text-[11px]">{item.tag || "—"}</span>
                <span className="text-on-surface-variant/50">·</span>
                <span className="text-[11px] text-outline/70">{item.zone ? item.zone : "—"}</span>
                {item.latitude != null && item.longitude != null && (
                  <>
                    <span className="text-on-surface-variant/50">·</span>
                    <span className="text-[11px] text-outline/70">
                      {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
              item.status === "Found"
                ? "bg-tertiary-container/20 text-tertiary"
                : "bg-error-container/20 text-error"
            }`}>
              {status}
            </span>
            <div className="text-[11px] text-outline font-mono">{item.date || "—"}</div>
          </div>
        </div>

        {claim && (
          <div className="flex items-center justify-between text-body-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                claim.rawStatus === "pending"
                  ? "bg-surface-container-high text-on-surface-variant"
                  : claim.rawStatus === "under_review"
                  ? "bg-primary-container/20 text-primary"
                  : claim.rawStatus === "approved"
                  ? "bg-tertiary-container/20 text-tertiary"
                  : "bg-error-container/20 text-error"
              }`}>
                {claim.status}
              </span>
              <span className="text-on-surface-variant/70 truncate">Claimant: {claim.claimantName}</span>
            </div>
            <button
              onClick={onSelect}
              className="text-primary hover:underline font-label-sm flex-shrink-0 ml-2"
            >
              Review
            </button>
          </div>
        )}

        {handoverClaim && (
          <div className="flex items-center justify-between border-t border-outline-variant/20 pt-2">
            <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px] text-tertiary">verified</span>
              Ready for handover
            </div>
            <button
              onClick={onSelect}
              className="px-4 py-1.5 bg-secondary text-on-secondary rounded-lg font-label-sm hover:bg-secondary-container transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">handshake</span>
              Details
            </button>
          </div>
        )}

        {(!claim && item.recoveryState !== "handed_over") && (
          <div className="flex items-center justify-between">
            <div className="text-body-sm text-on-surface-variant">
              {item.recoveryState === "at_security"
                ? "Found item held at the Security Desk."
                : "No claim decision yet."}
            </div>
            <button
              onClick={() => onSelect()}
              className="text-body-sm text-on-surface-variant font-medium hover:text-on-surface transition-colors"
            >
              View details
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SecurityDeskPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { refreshItems } = useAppData();
  const navigate = useNavigate();

  const role = profile?.role;
  const roleKind = normalizeRole(role);

  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTable, setActiveTable] = useState("at_security");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const isAuthorized = authLoading ? false : roleKind === "security" || roleKind === "admin";

  useEffect(() => {
    if (authLoading || !user?.id) return;
    loadData();
  }, [authLoading, user?.id, refreshItems]);

  function loadData() {
    if (!user?.id) return;
    setLoading(true);
    setError("");
    Promise.all([
      fetchAllClaimsForSecurity(),
      supabase.from("items").select("*").order("created_at", { ascending: false }),
    ])
      .then(([claimRows, { data: itemRows, error: itemErr }]) => {
        if (itemErr) throw itemErr;
        const mapped = (itemRows || []).map((item) => ({ ...normalizeDbItem(item), _fromDb: true }));
        setItems(mapped);
        setClaims(claimRows.map(normalizeDbClaim));
      })
      .catch((err) => {
        console.warn("SecurityDesk load error:", err.message);
        setError("Unable to load recovery console data. Please refresh.");
      })
      .finally(() => setLoading(false));
  }

  function clearHighlights() {
    setSelectedItemId("");
    setSelectedItem(null);
    setActionError("");
    setActionSuccess("");
  }

  function claimForItem(itemId) {
    return claims.find(
      (c) =>
        c.itemId === itemId &&
        (c.rawStatus === "under_review" ||
          c.rawStatus === "approved" ||
          c.rawStatus === "pending")
    ) || null;
  }

  function claimableForHandover(item) {
    if (item.recoveryState !== "claim_approved") return null;
    const c = claimForItem(item.id);
    return c && c.rawStatus === "approved" ? c : null;
  }

  const honeCardCount = items.filter((item) => item.recoveryState === "claim_approved").length;
  const atSecurityCount = items.filter((i) => i.recoveryState === "at_security").length;
  const handedOverCount = items.filter((i) => i.recoveryState === "handed_over").length;
  const pendingClaimCount = claims.filter((c) => c.rawStatus === "pending").length;

  if (authLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-6 pb-24 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="mt-5 text-body-md text-on-surface-variant">Loading security console…</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-6 pb-24">
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3">
          <span className="material-symbols-outlined text-error text-3xl">cancel</span>
          <h1 className="text-display-lg text-on-surface">Access restricted</h1>
          <p className="text-body-lg text-on-surface-variant">
            The Security Desk is only available to authorized Security Desk and Admin users.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 bg-primary text-on-primary rounded-lg font-medium hover:bg-primary-container transition-colors"
          >
            Return to dashboard
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-6 pb-24">
        <div className="bg-error-container/20 border border-error/30 rounded-xl p-6 text-center">
          <p className="text-error text-body-md font-medium">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg font-medium hover:bg-primary-container transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6 pb-24">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">security</span>
          </div>
          <div>
            <h1 className="text-display-lg text-on-surface">Security Desk</h1>
            <p className="text-body-md text-on-surface-variant">
              Review found items, verify ownership claims, and complete handovers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card icon="folding_chair" title="Found at Security" value={atSecurityCount} color="primary" onClick={() => setActiveTable("at_security")} />
          <Card icon="handshake" title="Ready for Handover" value={honeCardCount} color="tertiary" onClick={() => setActiveTable("claim_approved")} />
          <Card icon="check_circle" title="Handed Over" value={handedOverCount} color="secondary" onClick={() => setActiveTable("handed_over")} />
          <Card icon="pending_actions" title="Pending Claims" value={pendingClaimCount} color="error" onClick={() => setActiveTable("pending_claims")} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "at_security", label: "Awaiting Security" },
            { id: "claim_approved", label: "Ready for Handover" },
            { id: "pending_claims", label: "Pending Claims" },
            { id: "handed_over", label: "Handed Over" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTable(tab.id)}
              className={`px-4 py-2 rounded-lg font-label-sm flex items-center gap-2 transition-colors ${
                activeTable === tab.id
                  ? "bg-secondary-container text-on-secondary-container font-medium"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {tab.id === "at_security" ? "folding_chair" : tab.id === "claim_approved" ? "handshake" : tab.id === "pending_claims" ? "pending_actions" : "check_circle"}
              </span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search item, location, tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-outline-variant/30 rounded-lg bg-surface-container-lowest text-on-surface text-body-sm focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-body-md text-on-surface-variant">Loading recovery console…</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {activeTable === "pending_claims" ? (
                claims
                  .filter((c) => c.rawStatus === "pending")
                  .filter((c) => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      c.itemName.toLowerCase().includes(q) ||
                      c.claimantName.toLowerCase().includes(q) ||
                      c.itemLocation.toLowerCase().includes(q)
                    );
                  })
                  .map((c) => {
                    const itemMatch = items.find((i) => i.id === c.itemId) || {
                      id: c.itemId,
                      name: c.itemName,
                      location: c.itemLocation,
                      status: c.itemStatus || "Found",
                      category: c.itemCategory,
                      recoveryState: "at_security",
                      image_path: c.itemImagePath,
                    };
                    return (
                      <ItemCard
                        key={c.id}
                        item={itemMatch}
                        claim={c}
                        handoverClaim={null}
                        isSelected={selectedItemId === itemMatch.id}
                        onSelect={() => {
                          setSelectedItemId(itemMatch.id);
                          setSelectedItem(itemMatch);
                          setActionError("");
                          setActionSuccess("");
                        }}
                      />
                    );
                  })
              ) : (
                items
                  .filter((item) => {
                    if (activeTable === "at_security" && item.recoveryState !== "at_security") return false;
                    if (activeTable === "claim_approved" && item.recoveryState !== "claim_approved") return false;
                    if (activeTable === "handed_over" && item.recoveryState !== "handed_over") return false;
                    if (searchQuery.trim()) {
                      const q = searchQuery.toLowerCase();
                      const matchName = item.name?.toLowerCase().includes(q);
                      const matchLoc = item.location?.toLowerCase().includes(q);
                      const matchTag = item.tag?.toLowerCase().includes(q);
                      return matchName || matchLoc || matchTag;
                    }
                    return true;
                  })
                  .map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      claim={claimForItem(item.id)}
                      handoverClaim={claimableForHandover(item)}
                      isSelected={selectedItemId === item.id}
                      onSelect={() => {
                        setSelectedItemId(item.id);
                        setSelectedItem(item);
                        setActionError("");
                        setActionSuccess("");
                      }}
                    />
                  ))
              )}

              {activeTable === "pending_claims" && claims.filter((c) => c.rawStatus === "pending").length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center text-center bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-6">
                  <span className="material-symbols-outlined text-outline text-3xl">done_all</span>
                  <p className="text-body-md text-on-surface font-medium mt-2">No pending claims awaiting review</p>
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="lg:col-span-1">
          {selectedItem ? (
            <DetailPanel
              item={selectedItem}
              claim={claimForItem(selectedItem.id)}
              handoverClaim={claimableForHandover(selectedItem)}
              onClose={() => clearHighlights()}
              submitHandoverAction={async () => {
                const targetClaim = claimableForHandover(selectedItem) || claimForItem(selectedItem.id);
                const receiverId = targetClaim?.claimantId || selectedItem.reportedBy;
                try {
                  await completeHandover({
                    itemId: selectedItem.id,
                    claimId: targetClaim?.id || null,
                    receiverId: receiverId,
                  });
                  setActionSuccess("Handover complete. Item resolved and handed over.");
                  refreshItems();
                  loadData();
                  setTimeout(() => {
                    setActionSuccess("");
                  }, 1600);
                } catch (err) {
                  setActionError(err.message || "Handover failed.");
                  throw err;
                }
              }}
            />
          ) : (
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-6 flex flex-col items-center justify-center gap-3 h-full min-h-[220px]">
              <span className="material-symbols-outlined text-outline text-4xl">search</span>
              <p className="text-body-md text-on-surface font-medium">Item detail</p>
              <p className="text-body-sm text-on-surface-variant text-center">Select an item to inspect its report, claim status, and handover options.</p>
            </div>
          )}
        </aside>
      </div>

      {actionError && (
        <div className="mt-4 p-3 bg-error-container/20 border border-error/30 rounded-lg text-error text-body-sm">{actionError}</div>
      )}
      {actionSuccess && (
        <div className="mt-4 p-3 bg-tertiary-container/20 border border-tertiary/30 rounded-lg text-tertiary text-body-sm">{actionSuccess}</div>
      )}
    </div>
  );
}

function DetailPanel({ item, claim, handoverClaim, onClose, submitHandoverAction }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  async function handleCompleteHandover() {
    setLoading(true);
    setActionError("");
    setActionSuccess("");
    try {
      await submitHandoverAction();
    } catch (err) {
      setActionError(err.message || "Handover failed.");
    } finally {
      setLoading(false);
    }
  }

  const canComplete = claim?.rawStatus === "approved";

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 border-b border-outline-variant/20 pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-code-sm text-outline">{item.tag || "—"}</span>
            {item.zone && <span className="text-[11px] text-outline/70 bg-surface-container px-2 py-0.5 rounded">{item.zone}</span>}
            {item.latitude != null && item.longitude != null && <span className="text-[11px] text-outline/70 font-mono">{item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}</span>}
          </div>
          <h2 className="text-headline-sm text-on-surface mt-2 truncate">{item.name}</h2>
          <p className="text-body-sm text-on-surface-variant mt-0.5 truncate">{item.location}</p>
        </div>
        <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {item.image_path && (
        <div className="relative w-full max-w-[160px] mx-auto">
          <div className="w-full aspect-square rounded-xl bg-surface-container overflow-hidden flex items-center justify-center">
            <ItemImage imagePath={item.image_path} alt={item.name} className="w-full h-full object-cover" />
          </div>
          {item.recoveryState === "claim_approved" && (
            <div className="absolute top-2 right-2 flex flex-col items-center gap-0.5 bg-secondary text-on-secondary rounded-full px-2 py-0.5 text-[10px] font-medium shadow-sm">
              <span className="material-symbols-outlined text-[10px]">check_circle</span>
              Ready
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 text-body-sm">
        <div><p className="text-[11px] text-on-surface-variant uppercase tracking-wide">Report Type</p><p className="font-medium text-on-surface capitalize">{item.status.toLowerCase()}</p></div>
        <div><p className="text-[11px] text-on-surface-variant uppercase tracking-wide">Category</p><p className="font-medium text-on-surface capitalize">{item.category}</p></div>
        <div><p className="text-[11px] text-on-surface-variant uppercase tracking-wide">Reported Location</p><p className="font-medium text-on-surface truncate">{item.location}</p></div>
        <div><p className="text-[11px] text-on-surface-variant uppercase tracking-wide">Campus Zone</p><p className="font-medium text-on-surface">{item.zone || "—"}</p></div>
        {item.latitude != null && item.longitude != null && <div className="col-span-2"><p className="text-[11px] text-on-surface-variant uppercase tracking-wide">Exact GPS</p><p className="font-mono text-on-surface text-[12px]">{item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}</p></div>}
        <div className="col-span-2"><p className="text-[11px] text-on-surface-variant uppercase tracking-wide">Report Date</p><p className="font-mono text-on-surface">{item.date || "—"}</p></div>
      </div>

      <div className="bg-surface-container border border-outline-variant/20 rounded-lg p-4">
        <p className="text-[11px] text-on-surface-variant uppercase tracking-wide mb-1">Current State</p>
        <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm">
          {item.status} · {RECOVERY_STAGE_LABELS[item.recoveryState] || "No stage"}
        </span>
      </div>

      {claim && (
        <div className="border-t border-outline-variant/20 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-label-lg text-on-surface font-medium">Ownership Claim</p>
            <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[11px] font-medium">{claim.status}</span>
          </div>

          <div className="bg-surface-container rounded-lg p-3 space-y-2 text-body-sm">
            <div className="flex justify-between"><span className="text-on-surface-variant">Claimant</span><span className="text-on-surface font-medium">{claim.claimantName}</span></div>
            {claim.claimantEmail && <div className="flex justify-between"><span className="text-on-surface-variant">Email</span><span className="text-on-surface truncate">{claim.claimantEmail}</span></div>}
            {claim.claimantPhone && <div className="flex justify-between"><span className="text-on-surface-variant">Phone</span><span className="text-on-surface">{claim.claimantPhone}</span></div>}
            {claim.reviewedBy && <div className="flex justify-between border-t border-outline-variant/10 pt-2"><span className="text-on-surface-variant">Reviewed</span><span className="text-on-surface">{claim.reviewedAt ? new Date(claim.reviewedAt).toLocaleString() : "—"}</span></div>}
          </div>

          <div>
            <p className="text-[11px] text-on-surface-variant uppercase tracking-wide mb-1">Verification Notes</p>
            <div className="bg-surface-container p-3 rounded-lg text-body-sm italic text-on-surface">&ldquo;{claim.notes || "—"}&rdquo;</div>
          </div>

          {claim.rawStatus === "pending" && (
            <div className="flex gap-2">
              <button onClick={() => navigate("/claims")} disabled={loading} className="flex-1 px-4 py-2 bg-tertiary text-on-tertiary rounded-lg font-medium hover:bg-tertiary-container disabled:opacity-50 transition-opacity flex items-center justify-center gap-2">
                {loading ? <div className="w-4 h-4 border-2 border-on-tertiary border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[18px]">check_circle</span>}
                Approve & Prepare Handover
              </button>
              <button onClick={() => navigate("/claims")} disabled={loading} className="px-4 py-2 bg-error text-on-error rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2">
                {loading ? <div className="w-4 h-4 border-2 border-on-error border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[18px]">cancel</span>}
                Reject
              </button>
            </div>
          )}

          {claim.rawStatus === "approved" && (
            <div className="border-t border-outline-variant/20 pt-3 space-y-2">
              <p className="text-[11px] text-on-surface-variant uppercase tracking-wide">Completion</p>
              <button onClick={handleCompleteHandover} disabled={loading || !canComplete} className="w-full px-4 py-2 bg-secondary text-on-secondary rounded-lg font-medium hover:bg-secondary-container disabled:opacity-50 transition-opacity flex items-center justify-center gap-2">
                {loading ? <div className="w-4 h-4 border-2 border-on-secondary border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[18px]">swap_horiz</span>}
                Complete Handover
              </button>
            </div>
          )}

          {claim.rawStatus === "under_review" && (
            <div className="bg-primary-container/20 border border-primary/20 rounded-lg p-3 text-body-sm text-primary font-medium">Under review by Security Desk. Use <strong>All Claims</strong> for the full review path.</div>
          )}
        </div>
      )}

      {!claim && item.recoveryState !== "handed_over" && (
        <div className="border-t border-outline-variant/20 pt-4">
          <p className="text-[11px] text-on-surface-variant uppercase tracking-wide mb-1">Ownership Claim</p>
          <div className="bg-surface-container rounded-lg p-3"><p className="text-body-sm text-on-surface-variant">No pending or approved claim exists for this item.</p></div>
        </div>
      )}

      {handoverClaim && (
        <div className="border-t border-outline-variant/20 pt-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-secondary">swap_horiz</span>
            <p className="text-headline-sm text-on-surface">Complete Handover</p>
          </div>

          <p className="text-[11px] text-on-surface-variant uppercase tracking-wide">Receiver</p>
          <div className="bg-surface-container rounded-lg p-3 text-body-sm text-on-surface">
            {item.reportedBy || claim.claimantName || "—"}
            {claim.claimantEmail && " — " + claim.claimantEmail}
          </div>

          <button className="px-4 py-2 border border-outline-variant text-on-surface rounded-lg font-medium hover:bg-surface-container transition-colors disabled:opacity-50" disabled={loading} onClick={handleCompleteHandover}>
            <span className="material-symbols-outlined text-[16px] mr-1.5">arrow_forward</span>
            Hand over to above receiver
          </button>
        </div>
      )}

      {actionError && <div className="p-3 bg-error-container/20 border border-error/30 rounded-lg text-error text-body-sm">{actionError}</div>}
      {actionSuccess && <div className="p-3 bg-tertiary-container/20 border border-tertiary/30 rounded-lg text-tertiary text-body-sm">{actionSuccess}</div>}
    </div>
  );
}
