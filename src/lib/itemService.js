import { supabase } from "./supabaseClient";

const BUCKET = "item-images";
const SIGNED_URL_EXPIRY = 60 * 60; // 1 hour in seconds

/**
 * Upload an image file to private item-images bucket.
 * Path: {userId}/{itemId}/photo.{ext}
 * Returns the storage path string, or throws.
 */
export async function uploadItemImage(file, userId, itemId) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${itemId}/photo.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error) throw error;
  return path;
}

/**
 * Delete a stored image from the bucket (best-effort).
 */
export async function deleteItemImage(path) {
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

/**
 * Create a signed URL for displaying a private image.
 * Returns null if path is falsy.
 */
export async function getSignedImageUrl(path) {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRY);
  if (error) {
    console.warn("Failed to create signed URL:", error.message);
    return null;
  }
  return data.signedUrl;
}

/**
 * Insert a new item record.
 * `itemData` should map to the Supabase `items` table columns.
 * Returns the inserted row.
 */
export async function insertItem(itemData) {
  const { data, error } = await supabase
    .from("items")
    .insert(itemData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Update image_path on an existing item row.
 */
export async function updateItemImagePath(id, imagePath) {
  const { error } = await supabase
    .from("items")
    .update({ image_path: imagePath })
    .eq("id", id);
  if (error) throw error;
}

/**
 * Fetch all items for Browse — ordered newest first.
 */
export async function fetchAllItems() {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * Fetch items reported by the current authenticated user.
 */
export async function fetchMyItems(userId) {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("reporter_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * Main entry point: create a report (upload image if provided, insert row).
 *
 * Strategy: Option A — UUID generated client-side.
 *   1. Generate UUID.
 *   2. Upload image (if any) using that UUID as path segment.
 *   3. Insert DB row with same UUID.
 *   4. On DB failure: attempt to delete the orphaned image.
 *
 * Returns the final inserted DB row.
 */
export async function createReport({ userId, name, location, status, category, description, imageFile }) {
  // Generate a UUID for this item
  const itemId = crypto.randomUUID();
  const referenceTag = `REP-${Math.floor(1000 + Math.random() * 9000)}`;

  let imagePath = null;

  // Step 1: Upload image if provided
  if (imageFile) {
    imagePath = await uploadItemImage(imageFile, userId, itemId);
  }

  // Map UI status ('Lost' | 'Found') to lowercase DB enum ('lost' | 'found')
  const dbStatus = (status || "Lost").toLowerCase();

  // Step 2: Insert DB row
  const itemData = {
    id: itemId,
    reporter_id: userId,
    name: name.trim(),
    description: description?.trim() || `${status} item reported at ${location.trim()}`,
    category: category || "Other",
    status: dbStatus,
    location: location.trim(),
    image_path: imagePath,
    reference_tag: referenceTag,
    custody_info: dbStatus === "found" ? "Held at Security Desk" : null,
  };

  try {
    const row = await insertItem(itemData);
    return row;
  } catch (dbError) {
    // Cleanup orphaned image on DB failure (best-effort)
    if (imagePath) {
      await deleteItemImage(imagePath).catch(() => {});
    }
    throw dbError;
  }
}

/**
 * Normalize a DB row to the shape the existing UI expects.
 * Fills in all fields used by FeedList, ReportsPage, etc.
 */
export function normalizeDbItem(row) {
  // Map DB status ('lost' | 'found' | 'resolved') back to UI status ('Lost' | 'Found' | 'Resolved')
  const uiStatus = row.status
    ? row.status.charAt(0).toUpperCase() + row.status.slice(1).toLowerCase()
    : "Lost";

  return {
    id: row.id,
    name: row.name,
    location: row.location,
    status: uiStatus,
    category: row.category || "Other",
    date: row.created_at
      ? new Date(row.created_at).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "",
    tag: row.reference_tag || "",
    description: row.description || "",
    custody: row.custody_info || null,
    reportedBy: row.reporter_id, // UUID; can be resolved to name later
    image: null, // signed URL resolved separately per-component via getSignedImageUrl
    image_path: row.image_path || null,
    markerId: null,
    _fromDb: true,
  };
}
