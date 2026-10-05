import { supabase } from "./supabaseClient";

/**
 * Fetch notifications for the current authenticated user.
 *
 * All notification access now goes through the SECURITY DEFINER
 * RPCs in 20261005za_notifications_rpc.sql. The database derives
 * the caller from auth.uid() server-side — the client cannot
 * request another user's rows, and the notifications table has
 * no client-facing RLS policies at all (see
 * 20261005zb_notifications_table_lockdown.sql).
 */
export async function fetchMyNotifications(userId) {
  if (!userId) return [];

  const { data, error } = await supabase.rpc("get_my_notifications");

  if (error) throw error;
  return data ?? [];
}

/**
 * Mark a single notification as read.
 * The RPC only succeeds when the notification belongs to the
 * caller; any other id raises an error server-side.
 */
export async function markNotificationRead(notificationId, userId) {
  if (!notificationId || !userId) return null;

  const { data, error } = await supabase.rpc("mark_notification_read", {
    p_notification_id: notificationId,
  });

  if (error) throw error;
  return data;
}

/**
 * Mark all notifications for the current user as read.
 */
export async function markAllNotificationsRead(userId) {
  if (!userId) return [];

  const { data, error } = await supabase.rpc("mark_all_notifications_read");

  if (error) throw error;
  return data ?? [];
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
