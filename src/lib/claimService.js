import { supabase } from "./supabaseClient";

/**
 * Fetch all claims for the current authenticated user.
 */
export async function fetchMyClaims(userId) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("claims")
    .select(`
      *,
      item:items (
        id,
        name,
        category,
        status,
        location,
        image_path
      )
    `)
    .eq("claimant_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Submit a claim on a FOUND item.
 * Accepts structured ownership evidence fields:
 *   - notes: primary proof/description (required)
 *   - distinguishingFeatures: unique marks, scratches, stickers, identifiers
 *   - knownContents: bag contents, wallet cards, what's inside the case, etc.
 *   - contextDetails: when/where/how the claimant last had the item
 *
 * All evidence is stored in the `notes` column as a structured JSON blob so
 * no schema migration is required.
 */
export async function createClaim({ itemId, userId, notes, distinguishingFeatures, knownContents, contextDetails }) {
  if (!itemId || !userId) {
    throw new Error("Missing required parameters to submit claim.");
  }

  if (!notes?.trim()) {
    throw new Error("Proof / verification notes are required.");
  }

  // Check if user already claimed this item
  const { data: existing, error: checkError } = await supabase
    .from("claims")
    .select("id")
    .eq("item_id", itemId)
    .eq("claimant_id", userId)
    .maybeSingle();

  if (checkError) {
    console.warn("Check existing claim error:", checkError.message);
  }

  if (existing) {
    throw new Error("You have already submitted a claim for this item.");
  }

  // Serialize structured evidence into the notes column as a JSON blob.
  // This keeps the schema additive-free while enabling richer evidence collection.
  const evidenceBlob = JSON.stringify({
    notes: notes.trim(),
    distinguishingFeatures: distinguishingFeatures?.trim() || null,
    knownContents: knownContents?.trim() || null,
    contextDetails: contextDetails?.trim() || null,
  });

  const { data, error } = await supabase
    .from("claims")
    .insert({
      item_id: itemId,
      claimant_id: userId,
      status: "pending",
      notes: evidenceBlob,
    })
    .select(`
      *,
      item:items (
        id,
        name,
        category,
        status,
        location,
        image_path
      )
    `)
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("You have already submitted a claim for this item.");
    }
    if (error.message?.includes("check constraint") || error.message?.includes("RLS")) {
      throw new Error("Claims can only be filed on found items by other users.");
    }
    throw error;
  }

  return data;
}

/**
 * Fetch all claims for Security Desk review (pending or under_review claims).
 */
export async function fetchAllClaimsForSecurity() {
  const { data, error } = await supabase
    .from("claims")
    .select(`
      *,
      item:items (
        id,
        name,
        category,
        status,
        location,
        image_path
      ),
      claimant:profiles!claimant_id (
        id,
        display_name,
        email,
        phone,
        department,
        student_id
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Approve a claim by Security / Admin.
 * Updates claim status to 'approved', sets reviewed_by, and (server-side)
 * moves the item into the READY FOR HANDOVER custody stage.
 *
 * Note: approval no longer marks the item resolved. Under the recovery
 * lifecycle the item resolves when it is physically handed over via the
 * complete_handover() RPC. The item transition itself is performed by the
 * `claims_recovery_transition` trigger, so it happens no matter which client
 * path approves the claim.
 */
export async function approveClaim({ claimId, itemId, reviewerId }) {
  if (!claimId || !reviewerId) {
    throw new Error("Missing parameters to approve claim.");
  }

  // 1. Update claim status to 'approved'
  const { data: updatedClaim, error: claimError } = await supabase
    .from("claims")
    .update({
      status: "approved",
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", claimId)
    .select(`
      *,
      item:items (
        id,
        name,
        category,
        status,
        location,
        image_path
      ),
      claimant:profiles!claimant_id (
        id,
        display_name,
        email,
        phone,
        department,
        student_id
      )
    `)
    .single();

  if (claimError) throw claimError;

  // 2. Read the item back: the `claims_recovery_transition` trigger has
  //    already advanced its custody stage to 'claim_approved' (ready for
  //    handover). Returning it lets callers refresh UI state without
  //    assuming what happened server-side.
  let updatedItem = null;
  if (itemId) {
    const { data: itemRow, error: itemError } = await supabase
      .from("items")
      .select("id, status, recovery_state")
      .eq("id", itemId)
      .maybeSingle();

    if (itemError) {
      console.warn("Could not refresh item after approval:", itemError.message);
    } else {
      updatedItem = itemRow || null;
    }
  }

  return { ...updatedClaim, updatedItem };
}

/**
 * Reject a claim by Security / Admin.
 * Optionally accepts a rejectionReason string which is appended to the
 * stored notes blob so the claimant can see Security's feedback.
 * No schema migration required — uses the existing notes column.
 */
export async function rejectClaim({ claimId, reviewerId, rejectionReason }) {
  if (!claimId || !reviewerId) {
    throw new Error("Missing parameters to reject claim.");
  }

  // If a rejection reason was provided, read the current notes, deserialize,
  // add the rejectionFeedback key, then re-serialize before writing back.
  let updatePayload = {
    status: "rejected",
    reviewed_by: reviewerId,
    reviewed_at: new Date().toISOString(),
  };

  if (rejectionReason?.trim()) {
    // Read existing notes so we don't lose evidence the claimant submitted.
    const { data: existing } = await supabase
      .from("claims")
      .select("notes")
      .eq("id", claimId)
      .single();

    const rawNotes = existing?.notes || "";
    let parsed;
    try {
      parsed = rawNotes ? JSON.parse(rawNotes) : {};
    } catch {
      parsed = { notes: rawNotes };
    }

    parsed.rejectionFeedback = rejectionReason.trim();
    updatePayload.notes = JSON.stringify(parsed);
  }

  const { data, error } = await supabase
    .from("claims")
    .update(updatePayload)
    .eq("id", claimId)
    .select(`
      *,
      item:items (
        id,
        name,
        category,
        status,
        location,
        image_path
      ),
      claimant:profiles!claimant_id (
        id,
        display_name,
        email,
        phone,
        department,
        student_id
      )
    `)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Normalize DB claim row for UI consumption.
 * The `notes` column may be a JSON blob (structured evidence) or a plain string
 * (legacy rows). Both cases are handled safely.
 */
export function normalizeDbClaim(row) {
  // Parse structured evidence blob if present; fall back to plain string.
  let evidenceNotes = "No details provided.";
  let distinguishingFeatures = null;
  let knownContents = null;
  let contextDetails = null;
  let rejectionFeedback = null;

  if (row.notes) {
    try {
      const parsed = JSON.parse(row.notes);
      evidenceNotes = parsed.notes || "No details provided.";
      distinguishingFeatures = parsed.distinguishingFeatures || null;
      knownContents = parsed.knownContents || null;
      contextDetails = parsed.contextDetails || null;
      rejectionFeedback = parsed.rejectionFeedback || null;
    } catch {
      // Legacy plain-text notes — display as-is.
      evidenceNotes = row.notes;
    }
  }

  return {
    id: row.id,
    itemId: row.item_id,
    itemName: row.item?.name || "Found Item",
    itemLocation: row.item?.location || "",
    itemCategory: row.item?.category || "Other",
    itemImagePath: row.item?.image_path || null,
    itemStatus: row.item?.status || "found",
    status: mapClaimStatus(row.status),
    rawStatus: row.status,
    date: row.created_at
      ? new Date(row.created_at).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "Recently",
    claimantId: row.claimant_id,
    claimantName: row.claimant?.display_name || "Student User",
    claimantEmail: row.claimant?.email || "",
    claimantPhone: row.claimant?.phone || "",
    claimantDept: row.claimant?.department || "",
    claimantStudentId: row.claimant?.student_id || "",
    // Structured evidence fields (null for legacy claims).
    notes: evidenceNotes,
    distinguishingFeatures,
    knownContents,
    contextDetails,
    // Security feedback on rejection (null unless rejected with feedback).
    rejectionFeedback,
    reviewedBy: row.reviewed_by || null,
    reviewedAt: row.reviewed_at || null,
    _fromDb: true,
  };
}

function mapClaimStatus(status) {
  switch (status?.toLowerCase()) {
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "under_review":
    case "under review":
      return "Under Review";
    case "pending":
    default:
      return "Pending";
  }
}
