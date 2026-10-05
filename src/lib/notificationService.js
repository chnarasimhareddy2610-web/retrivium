import { supabase } from "./supabaseClient";

/**
 * Fetch notifications for the current authenticated user.
 */
export async function fetchMyNotifications(userId) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationRead(notificationId, userId) {
  if (!notificationId || !userId) return null;

  const { data, error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mark all notifications for a user as read.
 */
export async function markAllNotificationsRead(userId) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null)
    .select();

  if (error) throw error;
  return data;
}

/**
 * Helper to normalize DB notification row for UI rendering.
 */
export function normalizeDbNotification(row) {
  return {
    id: row.id,
    type: row.type || "info",
    title: row.title,
    message: row.message,
    read: !!row.read_at,
    time: row.created_at
      ? new Date(row.created_at).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Just now",
    link: row.related_claim_id ? "/claims" : "/browse",
    _fromDb: true,
  };
}
