/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { fetchAllItems, normalizeDbItem } from "../lib/itemService";

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
    <AppDataContext.Provider value={{ items, dbItems, dbLoaded, addItem, addDbItem, refreshItems, currentUser }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error("useAppData must be used within an AppDataProvider");
  return context;
}
