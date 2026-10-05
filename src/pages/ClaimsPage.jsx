import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext";
import {
  fetchMyClaims,
  fetchAllClaimsForSecurity,
  createClaim,
  approveClaim,
  rejectClaim,
  normalizeDbClaim,
} from "../lib/claimService";
import ItemImage from "../components/common/ItemImage";
import { mockClaims } from "../data/dummyData";

/**
 * Fetch claims for the current user's role.
 * `isActive()` guards against a stale, superseded request (role/user
 * changed while this fetch was still in flight).
 */
async function loadClaimsData(user, { setDbClaims, setError, setLoading, isActive }) {
  if (!user?.id) {
    if (isActive()) {
      setDbClaims([]);
      setLoading(false);
    }
    return;
  }
  setLoading(true);
  setError("");
  try {
    const isSecurityOrAdmin = user.role === "security" || user.role === "admin";
    const rows = isSecurityOrAdmin
      ? await fetchAllClaimsForSecurity()
      : await fetchMyClaims(user.id);
    if (isActive()) setDbClaims(rows.map(normalizeDbClaim));
  } catch (err) {
    console.warn("Error fetching claims:", err.message);
    if (isActive()) setError("Failed to load claims from server.");
  } finally {
    if (isActive()) setLoading(false);
  }
}

export default function ClaimsPage() {
  const { user, profile } = useAuth();
  const { dbItems, refreshItems } = useAppData();

  const userRole = profile?.role || "student";
  const isSecurity = userRole === "security" || userRole === "admin";

  const [dbClaims, setDbClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Student claim file modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [claimNotes, setClaimNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Security detail/review modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewClaim, setReviewClaim] = useState(null);
  const [reviewActionLoading, setReviewActionLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState("");

  // Filter available found items from DB for students
  const claimableFoundItems = dbItems.filter(
    (item) => item.status === "Found" && item._fromDb && item.reportedBy !== user?.id
  );

  useEffect(() => {
    // Cancel in-flight fetches when role/user changes so a slow
    // pre-role fetch (e.g. student path) cannot overwrite the
    // security/admin result after the profile has loaded.
    let active = true;
    const isActive = () => active;

    loadClaimsData(
      { id: user?.id, role: userRole },
      { setDbClaims, setError, setLoading, isActive }
    );

    return () => {
      active = false;
    };
  }, [user?.id, userRole]);

  const handleOpenModal = () => {
    setModalOpen(true);
    setFormError("");
    setSuccessMsg("");
    setClaimNotes("");
    if (claimableFoundItems.length > 0) {
      setSelectedItemId(claimableFoundItems[0].id);
    } else {
      setSelectedItemId("");
    }
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    if (!selectedItemId) {
      setFormError("Please select a found item to claim.");
      return;
    }
    if (!claimNotes.trim()) {
      setFormError("Please provide proof/notes of ownership.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const newClaimRow = await createClaim({
        itemId: selectedItemId,
        userId: user.id,
        notes: claimNotes,
      });

      const normalized = normalizeDbClaim(newClaimRow);
      setDbClaims((prev) => [normalized, ...prev]);
      setSuccessMsg("Claim submitted successfully! Security Desk will review your request.");
      setClaimNotes("");
      setTimeout(() => {
        setModalOpen(false);
        setSuccessMsg("");
      }, 2000);
    } catch (err) {
      setFormError(err.message || "Failed to submit claim. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Security Review Actions — hard role guard: students can never trigger these.
  const handleOpenReview = (claim) => {
    if (!isSecurity || !claim?._fromDb) return;
    setReviewClaim(claim);
    setReviewError("");
    setReviewSuccessMsg("");
    setReviewModalOpen(true);
  };

  const handleApproveClaim = async () => {
    if (!isSecurity || !reviewClaim || reviewActionLoading) return;
    setReviewActionLoading(true);
    setReviewError("");
    try {
      const updatedRow = await approveClaim({
        claimId: reviewClaim.id,
        itemId: reviewClaim.itemId,
        reviewerId: user.id,
      });
      const normalized = normalizeDbClaim(updatedRow);
      setDbClaims((prev) =>
        prev.map((c) => (c.id === reviewClaim.id ? normalized : c))
      );
      // Item status changed in the DB (resolved) — sync shared item state.
      refreshItems();
      setReviewSuccessMsg("Claim APPROVED. Item status updated to Resolved.");
      setTimeout(() => {
        setReviewModalOpen(false);
        setReviewClaim(null);
      }, 1500);
    } catch (err) {
      setReviewError(err.message || "Failed to approve claim.");
    } finally {
      setReviewActionLoading(false);
    }
  };

  const handleRejectClaim = async () => {
    if (!isSecurity || !reviewClaim || reviewActionLoading) return;
    setReviewActionLoading(true);
    setReviewError("");
    try {
      const updatedRow = await rejectClaim({
        claimId: reviewClaim.id,
        reviewerId: user.id,
      });
      const normalized = normalizeDbClaim(updatedRow);
      setDbClaims((prev) =>
        prev.map((c) => (c.id === reviewClaim.id ? normalized : c))
      );
      // Re-sync shared item state so Browse/Reports match the DB.
      refreshItems();
      setReviewSuccessMsg("Claim REJECTED.");
      setTimeout(() => {
        setReviewModalOpen(false);
        setReviewClaim(null);
      }, 1500);
    } catch (err) {
      setReviewError(err.message || "Failed to reject claim.");
    } finally {
      setReviewActionLoading(false);
    }
  };

  // Security Desk always works from live DB claims (no demo fixtures with fake ids).
  // Students keep the existing demo fallback while they have no claims of their own.
  const displayClaims = isSecurity
    ? dbClaims
    : dbClaims.length > 0
    ? dbClaims
    : mockClaims;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-6 pb-24">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-display-lg text-on-surface">
                {isSecurity ? "Security Desk — Claim Reviews" : "My Claims"}
              </h1>
              {isSecurity && (
                <span className="px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary font-code-sm text-xs font-semibold uppercase">
                  Security Mode
                </span>
              )}
            </div>
            <p className="text-body-lg text-on-surface-variant">
              {isSecurity
                ? "Review verification notes and approve ownership claims."
                : "Track ownership verifications and item recovery."}
            </p>
          </div>
          {!isSecurity && (
            <button
              onClick={handleOpenModal}
              className="px-4 py-2 bg-primary text-on-primary rounded-lg font-medium hover:bg-primary-container transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              File a Claim
            </button>
          )}
        </div>

        {error && (
          <div className="p-3 bg-error-container/20 border border-error/30 text-error text-body-sm rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-body-sm text-on-surface-variant">
              {isSecurity ? "Loading incoming claims…" : "Loading your claims…"}
            </p>
          </div>
        ) : displayClaims.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-center bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-6">
            <span className="material-symbols-outlined text-outline text-4xl">
              {isSecurity ? "inbox" : "assignment"}
            </span>
            <p className="text-body-md text-on-surface font-medium">
              {isSecurity ? "No claims awaiting review." : "You have not filed any claims yet."}
            </p>
            <p className="text-body-sm text-on-surface-variant">
              {isSecurity
                ? "New student claims will appear here for verification."
                : "Claims you submit on found items will show up here."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayClaims.map((claim) => (
              <div
                key={claim.id}
                className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5 shadow-sm flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-code-sm text-outline truncate max-w-[120px]">
                      {claim.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 ${
                        claim.status === "Approved"
                          ? "bg-tertiary-container/20 text-tertiary"
                          : claim.status === "Rejected"
                          ? "bg-error-container/20 text-error"
                          : claim.status === "Under Review"
                          ? "bg-primary-container/20 text-primary"
                          : "bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      {claim.status === "Approved" && (
                        <span className="material-symbols-outlined text-[10px]">check_circle</span>
                      )}
                      {claim.status === "Rejected" && (
                        <span className="material-symbols-outlined text-[10px]">cancel</span>
                      )}
                      {claim.status === "Under Review" && (
                        <span className="material-symbols-outlined text-[10px]">pending</span>
                      )}
                      {claim.status}
                    </span>
                  </div>
                  <span className="text-label-sm text-on-surface-variant flex-shrink-0">
                    {claim.date}
                  </span>
                </div>

                <h3 className="font-headline-sm text-on-surface mb-1 truncate">
                  {claim.itemName}
                </h3>
                {isSecurity && claim.claimantName && (
                  <p className="text-body-sm text-primary font-medium mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">person</span>
                    Claimant: {claim.claimantName}
                  </p>
                )}

                <p className="text-body-sm text-on-surface-variant bg-surface-container-low p-3 rounded-lg mb-4 italic line-clamp-2">
                  "{claim.notes}"
                </p>

                <div className="flex justify-between items-center border-t border-outline-variant/20 pt-4 mt-auto">
                  <span className="text-label-sm text-on-surface-variant">
                    {isSecurity
                      ? claim.status === "Pending"
                        ? "Action required by Security Desk"
                        : `Reviewed by ${claim.reviewedBy ? "Security" : "System"}`
                      : "Security Desk verification required"}
                  </span>
                  <button
                    onClick={() => (isSecurity ? handleOpenReview(claim) : undefined)}
                    className="text-primary hover:underline font-label-md"
                  >
                    {isSecurity ? "Review Claim" : "View Details"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student Claim Submission Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-6 max-w-md w-full shadow-xl flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-headline-sm text-on-surface">File Ownership Claim</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-error-container/20 border border-error/30 text-error text-body-sm rounded-lg">
                {formError}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-tertiary-container/20 border border-tertiary/30 text-tertiary text-body-sm rounded-lg">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmitClaim} className="flex flex-col gap-4">
              <div>
                <label className="block text-label-lg text-on-surface mb-1.5">Select Found Item</label>
                {claimableFoundItems.length > 0 ? (
                  <select
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    className="w-full h-10 px-3 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface text-body-md focus:border-primary focus:outline-none"
                  >
                    {claimableFoundItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.location})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-body-sm text-on-surface-variant p-3 bg-surface-container-low rounded-lg">
                    No database-backed found items available to claim right now.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-label-lg text-on-surface mb-1.5">
                  Proof / Verification Notes
                </label>
                <textarea
                  rows="3"
                  value={claimNotes}
                  onChange={(e) => setClaimNotes(e.target.value)}
                  placeholder="Provide serial numbers, distinctive markings, or lock screen details to prove ownership…"
                  className="w-full p-3 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface text-body-md focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-outline-variant text-on-surface rounded-lg font-medium hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || claimableFoundItems.length === 0}
                  className="px-4 py-2 bg-primary text-on-primary rounded-lg font-medium hover:bg-primary-container transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && (
                    <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {submitting ? "Submitting…" : "Submit Claim"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security Desk Review Modal */}
      {reviewModalOpen && reviewClaim && (
        <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-6 max-w-lg w-full shadow-xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
              <div>
                <h2 className="text-headline-sm text-on-surface">Security Desk — Claim Review</h2>
                <p className="text-label-sm text-outline">Claim ID: {reviewClaim.id}</p>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {reviewError && (
              <div className="p-3 bg-error-container/20 border border-error/30 text-error text-body-sm rounded-lg">
                {reviewError}
              </div>
            )}

            {reviewSuccessMsg && (
              <div className="p-3 bg-tertiary-container/20 border border-tertiary/30 text-tertiary text-body-sm rounded-lg">
                {successMsg || reviewSuccessMsg}
              </div>
            )}

            {/* Found Item Details */}
            <div className="flex gap-4 p-3 bg-surface-container-low rounded-lg items-start">
              {reviewClaim.itemImagePath && (
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-surface">
                  <ItemImage imagePath={reviewClaim.itemImagePath} alt={reviewClaim.itemName} />
                </div>
              )}
              <div>
                <h4 className="font-headline-sm text-on-surface">{reviewClaim.itemName}</h4>
                <p className="text-body-sm text-on-surface-variant mt-0.5">
                  Category: {reviewClaim.itemCategory} • Location: {reviewClaim.itemLocation}
                </p>
                <span className="inline-block mt-2 px-2 py-0.5 rounded text-[11px] font-semibold bg-primary-container/20 text-primary capitalize">
                  Item Status: {reviewClaim.itemStatus}
                </span>
              </div>
            </div>

            {/* Claimant Info */}
            <div className="flex flex-col gap-1 border-t border-b border-outline-variant/20 py-3">
              <h4 className="text-label-lg font-semibold text-on-surface uppercase">Claimant Profile</h4>
              <p className="text-body-md text-on-surface font-medium">{reviewClaim.claimantName}</p>
              {reviewClaim.claimantEmail && (
                <p className="text-body-sm text-on-surface-variant">Email: {reviewClaim.claimantEmail}</p>
              )}
              {reviewClaim.claimantPhone && (
                <p className="text-body-sm text-on-surface-variant">Phone: {reviewClaim.claimantPhone}</p>
              )}
              {reviewClaim.claimantDept && (
                <p className="text-body-sm text-on-surface-variant">Department: {reviewClaim.claimantDept}</p>
              )}
            </div>

            {/* Proof Notes */}
            <div>
              <h4 className="text-label-lg font-semibold text-on-surface uppercase mb-1">
                Proof / Verification Notes
              </h4>
              <div className="p-3 bg-surface-container-low rounded-lg text-body-md text-on-surface italic">
                "{reviewClaim.notes}"
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-4 border-t border-outline-variant/20 pt-4">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="px-4 py-2 border border-outline-variant text-on-surface rounded-lg font-medium hover:bg-surface-container"
              >
                Close
              </button>

              {reviewClaim.status !== "Approved" && reviewClaim.status !== "Rejected" ? (
                <>
                  <button
                    type="button"
                    onClick={handleRejectClaim}
                    disabled={reviewActionLoading}
                    className="px-4 py-2 bg-error text-on-error rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[18px]">cancel</span>
                    Reject Claim
                  </button>
                  <button
                    type="button"
                    onClick={handleApproveClaim}
                    disabled={reviewActionLoading}
                    className="px-4 py-2 bg-tertiary text-on-tertiary rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {reviewActionLoading ? (
                      <div className="w-4 h-4 border-2 border-on-tertiary border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    )}
                    Approve & Resolve
                  </button>
                </>
              ) : (
                <div className="text-body-sm text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                  This claim has already been {reviewClaim.status.toLowerCase()}.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
