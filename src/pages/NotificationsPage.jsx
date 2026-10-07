import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  fetchMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  normalizeDbNotification,
} from "../lib/notificationService";

async function loadNotificationsData(userId, setDbNotes, setError, setLoading) {
  if (!userId) {
    setLoading(false);
    return;
  }
  setLoading(true);
  setError("");
  try {
    const rows = await fetchMyNotifications(userId);
    setDbNotes(rows.map(normalizeDbNotification));
  } catch (err) {
    console.warn("Error fetching notifications from DB:", err.message);
    setError("Could not load latest notifications from server.");
  } finally {
    setLoading(false);
  }
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [dbNotes, setDbNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const userId = user?.id;

  useEffect(() => {
    loadNotificationsData(userId, setDbNotes, setError, setLoading);
  }, [userId]);

  const handleMarkAllRead = async () => {
    if (!userId || actionLoading) return;
    setActionLoading(true);
    try {
      await markAllNotificationsRead(userId);
      setDbNotes((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
    } catch (err) {
      console.warn("Failed to mark all as read:", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkSingleRead = async (id, isRead) => {
    if (isRead || !userId) return;
    try {
      await markNotificationRead(id, userId);
      setDbNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.warn("Failed to mark notification read:", err.message);
    }
  };

  // Real DB notifications only — errors surface via the banner above,
  // never silently masked by mock data.
  const notifications = dbNotes;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 md:px-6 py-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-display-lg text-on-surface">Notifications</h1>
        <button
          onClick={handleMarkAllRead}
          disabled={actionLoading}
          className="text-primary hover:underline font-label-md disabled:opacity-50"
        >
          {actionLoading ? "Updating…" : "Mark all as read"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-error-container/20 border border-error/30 text-error text-body-sm rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-body-sm text-on-surface-variant">Loading notifications…</p>
        </div>
      ) : error ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 bg-surface-container-lowest border border-outline-variant/20 rounded-xl">
          <span className="material-symbols-outlined text-[28px] text-on-surface-variant">cloud_off</span>
          <p className="text-body-md text-on-surface-variant">Could not load notifications</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 bg-surface-container-lowest border border-outline-variant/20 rounded-xl">
          <span className="material-symbols-outlined text-[28px] text-on-surface-variant">notifications_off</span>
          <p className="text-body-md text-on-surface-variant">No notifications yet</p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl overflow-hidden shadow-sm flex flex-col">
          {notifications.map((note, index) => {
            let icon = "notifications";
            let iconColor = "text-on-surface-variant";
            let bgColor = "bg-surface-container-low";

            if (note.type === "match") {
              icon = "troubleshoot";
              iconColor = "text-primary";
              bgColor = "bg-primary-container/20";
            } else if (note.type === "claim_approved" || note.type === "item_returned" || note.type === "item_handed_over") {
              icon = "verified";
              iconColor = "text-tertiary";
              bgColor = "bg-tertiary-container/20";
            } else if (note.type === "info_requested") {
              icon = "info";
              iconColor = "text-error";
              bgColor = "bg-error-container/20";
            }

            return (
              <Link
                key={note.id}
                to={note.link || "#"}
                onClick={() => handleMarkSingleRead(note.id, note.read)}
                className={`p-4 flex gap-4 hover:bg-surface-container transition-colors ${
                  index !== notifications.length - 1 ? "border-b border-outline-variant/10" : ""
                } ${!note.read ? "bg-surface-container-lowest" : "bg-surface/50"}`}
              >
                <div className="flex-shrink-0 mt-1 relative">
                  <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center`}>
                    <span className={`material-symbols-outlined text-[20px] ${iconColor}`}>{icon}</span>
                  </div>
                  {!note.read && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary border-2 border-surface-container-lowest"></div>
                  )}
                </div>
                <div className="flex flex-col flex-1">
                  <p className={`text-body-lg ${!note.read ? "text-on-surface font-semibold" : "text-on-surface"}`}>
                    {note.title}
                  </p>
                  <p className="text-body-md text-on-surface-variant mt-0.5">{note.message}</p>
                  <p className="text-label-sm text-outline mt-2">{note.time}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
