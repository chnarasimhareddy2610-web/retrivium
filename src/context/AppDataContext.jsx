/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { fetchAllItems, normalizeDbItem } from "../lib/itemService";
import { supabase } from "../lib/supabaseClient";

const AppDataContext = createContext(null);

async function loadItems(setDbItems, setDbLoaded) {
  try {
    const rows = await fetchAllItems();
    setDbItems(rows.map(normalizeDbItem));
  } catch (err) {
    console.warn("Could not load items from DB:", err.message);
  } finally {
    setDbLoaded(true);
  }
}

function resetItems(setDbItems, setDbLoaded) {
  setDbItems([]);
  setDbLoaded(false);
}

export function AppDataProvider({ children }) {
  const { user, profile } = useAuth();

  const [dbItems, setDbItems] = useState([]);
  const [dbLoaded, setDbLoaded] = useState(false);

  const currentUser = {
    id: user?.id || null,
    name: profile?.full_name || user?.user_metadata?.full_name || user?.email || "User",
    email: user?.email || "",
    role: profile?.role || "Student / Staff",
  };

  // Real DB items are the authoritative campus feed. The deprecated
  // mock feed is no longer merged in, so fake demo items never appear as
  // real campus reports.
  const items = dbLoaded ? dbItems : [];

  // Item-derived summary counts — computed from `items` after it is
  // declared, so nothing references `items` before its declaration.
  const totalCount = items.length;
  const foundCount = items.filter((i) => i.status === "Found").length;
  const lostCount = items.filter((i) => i.status === "Lost").length;
  const myReportsCount = items.filter(
    (i) => i.reportedBy === currentUser.id,
  ).length;

  // Load from DB when user logs in; clear on logout.
  const userId = user?.id;
  useEffect(() => {
    if (userId) {
      loadItems(setDbItems, setDbLoaded);
    } else {
      resetItems(setDbItems, setDbLoaded);
    }
  }, [userId]);

  /**
   * Called by ReportFormPage after successful DB insert.
   * Prepends the normalized row to local state so UI updates immediately.
   */
  const addDbItem = useCallback((normalizedItem) => {
    setDbItems((prev) => [normalizedItem, ...prev]);
  }, []);

  /**
   * Re-sync items from Supabase after a server-side mutation
   * (e.g. Security Desk approval resolving a claim's item),
   * so Browse / Reports reflect the new status without a reload.
   */
  const refreshItems = useCallback(() => {
    if (!userId) return Promise.resolve();
    return loadItems(setDbItems, setDbLoaded);
  }, [userId]);

  /**
   * Keep the map + list fresh without a full-page reload.
   *
   * We attempt a Supabase Realtime subscription on the `items` table first.
   * Realtime requires project-side enablement (realtime enabled + the table
   * registered as a realtime source) which we cannot assume, so the
   * subscription is wrapped in try/catch. If it fails, we fall back to a
   * lightweight polling refresh (every 30s). Either way the map/list stay
   * in sync with the latest DB state.
   *
   * Subscriptions and timers are cleaned up on logout / userId change.
   */
  useEffect(() => {
    if (!userId) return;

    // Polling fallback: refresh on a 30s cadence.
    const POLL_MS = 30_000;
    let realtimeActive = false;
    let timerId = null;

    const startPolling = () => {
      timerId = window.setInterval(() => {
        refreshItems().catch((err) => {
          console.warn("Campus map refresh (poll) failed:", err?.message || err);
        });
      }, POLL_MS);
    };

    startPolling();

    // Attempt a realtime subscription; if it succeeds, pause polling.
    let channel = null;
    try {
      channel = supabase
        .channel("items-map-sync")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "items",
          },
          () => {
            realtimeActive = true;
            if (timerId) {
              window.clearInterval(timerId);
              timerId = null;
            }
            refreshItems().catch((err) => {
              console.warn("Campus map refresh (realtime) failed:", err?.message || err);
            });
          }
        )
        .subscribe();
    } catch (err) {
      // Realtime not available — polling remains active.
      console.warn("Campus map: realtime subscription unavailable, using polling:", err?.message || err);
    }

    // Periodic health check: if the channel drops, resume polling.
    const heartbeat = window.setInterval(() => {
      if (channel && !realtimeActive) {
        // channel may have dropped; start polling again.
        if (!timerId) startPolling();
      }
    }, POLL_MS);

    return () => {
      if (channel) {
        supabase.removeChannel(channel).catch(() => {});
      }
      if (timerId) window.clearInterval(timerId);
      if (heartbeat) window.clearInterval(heartbeat);
    };
  }, [userId, refreshItems]);

  /**
   * Legacy addItem — kept so nothing else breaks.
   */
  const addItem = useCallback((newItem) => {
    const formattedItem = {
      id: newItem.id || Date.now(),
      name: newItem.name,
      location: newItem.location,
      status: newItem.status || "Lost",
      category: newItem.category || "Other",
      date: new Date().toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      }),
      tag: newItem.tag || `REP-${Math.floor(1000 + Math.random() * 9000)}`,
      description: newItem.description || `${newItem.status} item reported at ${newItem.location}`,
      custody: newItem.custody || (newItem.status === "Found" ? "Held at Security Desk" : null),
      reportedBy: newItem.reportedBy || currentUser.name,
      image: newItem.image || null,
      image_path: null,
      markerId: newItem.markerId || null,
      _fromDb: false,
    };
    setDbItems((prev) => [formattedItem, ...prev]);
    return formattedItem;
  }, [currentUser.name]);

  return (
    <AppDataContext.Provider
      value={{
        items,
        dbItems,
        dbLoaded,
        totalCount,
        foundCount,
        lostCount,
        myReportsCount,
        addItem,
        addDbItem,
        refreshItems,
        currentUser,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error("useAppData must be used within an AppDataProvider");
  return context;
}
