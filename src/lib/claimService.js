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
 * `itemId`: UUID of item being claimed
 * `userId`: UUID of claiming user
 * `notes`: verification/proof details provided by user
 */
export async function createClaim({ itemId, userId, notes }) {
  if (!itemId || !userId) {
    throw new Error("Missing required parameters to submit claim.");
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

  const { data, error } = await supabase
    .from("claims")
    .insert({
      item_id: itemId,
      claimant_id: userId,
      status: "pending",
      notes: notes?.trim() || null,
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
 * Updates claim status to 'approved', sets reviewed_by, and marks item as 'resolved'.
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

  // 2. Update item status to 'resolved' (and set resolved_at timestamp)
  if (itemId) {
    const { data: resolvedRows, error: itemError } = await supabase
      .from("items")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .select("id");

    if (itemError) {
      console.warn("Failed to update item to resolved:", itemError.message);
    } else if (!resolvedRows?.length) {
      console.warn("Item was not resolved: no item row matched (RLS or missing id).");
    }
  }

  return updatedClaim;
}

/**
 * Reject a claim by Security / Admin.
 * Updates claim status to 'rejected' and sets reviewed_by.
 */
export async function rejectClaim({ claimId, reviewerId }) {
  if (!claimId || !reviewerId) {
    throw new Error("Missing parameters to reject claim.");
  }

  const { data, error } = await supabase
    .from("claims")
    .update({
      status: "rejected",
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

  if (error) throw error;
  return data;
}

/**
 * Normalize DB claim row for UI consumption.
 */
export function normalizeDbClaim(row) {
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
    notes: row.notes || "No details provided.",
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
