import { supabase } from "./supabaseClient";

/**
 * Item Recovery / Handover service.
 *
 * The sensitive completion step is NOT enforced in the browser: it calls the
 * SECURITY DEFINER RPC complete_handover(), which authorises the caller as
 * Security/Admin, requires an approved claim whose claimant matches the
 * receiver, and writes the handover record + resolves the item atomically.
 * Button visibility in the UI is cosmetic only.
 */

/** Human labels for the custody stage stored on items.recovery_state. */
export const RECOVERY_LABELS = {
  at_security: "Held by Security",
  claim_approved: "Ready for handover",
  handed_over: "Handed over",
};

/** Null-safe label lookup (legacy rows have no recovery state). */
export function recoveryLabel(state) {
  if (!state) return null;
  return RECOVERY_LABELS[state] || null;
}

/** Map server exception text to something a human can act on. */
function friendlyHandoverError(raw = "") {
  const message = String(raw);
  if (message.includes("handover_forbidden")) {
    return "Only Security Desk or Admin users can complete a handover.";
  }
  if (message.includes("already_handed_over") || message.includes("handover_already_completed")) {
    return "This item has already been handed over.";
  }
  if (message.includes("claim_not_approved")) {
    return "The claim for this item is not approved yet.";
  }
  if (message.includes("claim_required")) {
    return "No claim exists for this item, so it cannot be handed over.";
  }
  if (message.includes("receiver_must_match_approved_claim")) {
    return "The receiver must be the approved claimant.";
  }
  if (message.includes("invalid_transition")) {
    return "This item is not awaiting a handover.";
  }
  if (message.includes("item_not_found")) {
    return "Item not found.";
  }
  if (message.includes("not_authenticated")) {
    return "You must be signed in to complete a handover.";
  }
  return message;
}

/**
 * Complete a physical handover (Security/Admin only — enforced server-side).
 *
 * @param {string} itemId    item being handed over (must be status 'found')
 * @param {string} claimId   approved claim (optional; an approved claim for
 *                           the item is used when omitted)
 * @param {string} receiverId must equal the approved claimant
 * @param {string} notes     optional free-text note (<= 500 chars)
 * @returns the inserted handover record
 */
export async function completeHandover({ itemId, claimId, receiverId, notes }) {
  if (!itemId || !receiverId) {
    throw new Error("Missing parameters to complete handover.");
  }

  const { data, error } = await supabase.rpc("complete_handover", {
    p_item_id: itemId,
    p_claim_id: claimId || null,
    p_receiver_id: receiverId,
    p_notes: notes ? String(notes).slice(0, 500) : null,
  });

  if (error) throw new Error(friendlyHandoverError(error.message));
  return data;
}

/**
 * The approved claim for an item — the precondition for a handover.
 * Returns null when there is no approved claim.
 */
export async function fetchApprovedClaimForItem(itemId) {
  if (!itemId) return null;
  const { data, error } = await supabase
    .from("claims")
    .select("id, item_id, claimant_id, status, reviewed_by, reviewed_at")
    .eq("item_id", itemId)
    .eq("status", "approved")
    .order("reviewed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

/**
 * Handover records visible to the caller (RLS scopes this to participants
 * and Security/Admin — no client-side filtering needed).
 */
export async function fetchHandoverForItem(itemId) {
  if (!itemId) return null;
  const { data, error } = await supabase
    .from("handover_records")
    .select("*, receiver:profiles!receiver_id (id, display_name), performer:profiles!performed_by (id, display_name)")
    .eq("item_id", itemId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

/** Normalize a handover row for UI consumption. */
export function normalizeHandover(row) {
  if (!row) return null;
  return {
    id: row.id,
    itemId: row.item_id,
    claimId: row.claim_id || null,
    receiverId: row.receiver_id,
    receiverName: row.receiver?.display_name || "",
    performedById: row.performed_by,
    performedByName: row.performer?.display_name || "",
    notes: row.notes || "",
    handedOverAt: row.handed_over_at || row.created_at || null,
    createdAt: row.created_at || null,
    _fromDb: true,
  };
}
