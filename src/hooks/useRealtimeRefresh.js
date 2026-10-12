import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * useRealtimeRefresh
 *
 * Subscribes to Supabase Realtime postgres_changes for one or more tables
 * and calls the provided `onRefresh` callback whenever a change arrives.
 *
 * Design:
 * - Only subscribes when `userId` is truthy (authenticated users only).
 * - Cleans up the channel on unmount or when `userId` or `channelKey` changes.
 * - Deduplicates rapid bursts using a short debounce (500ms) so a single
 *   batch of server-side changes does not trigger multiple refetches.
 * - Falls back silently: if subscription fails (Realtime not enabled on the
 *   table), a console warning is emitted and no error is thrown.
 * - Never calls onRefresh after the component unmounts (uses a mounted ref).
 *
 * @param {object} options
 * @param {string|null} options.userId      - Current authenticated user id. Pass null to disable.
 * @param {string} options.channelKey       - Unique channel name. Must be unique per subscription context.
 * @param {Array<{table: string, schema?: string, filter?: string}>} options.tables
 *   - Tables to subscribe to. Each entry corresponds to one postgres_changes listener.
 * @param {() => void} options.onRefresh    - Callback invoked when a relevant change arrives.
 * @param {number} [options.debounceMs=500] - Debounce window in ms to batch rapid events.
 */
export function useRealtimeRefresh({
  userId,
  channelKey,
  tables,
  onRefresh,
  debounceMs = 500,
}) {
  // Keep stable references so the effect doesn't re-run because of inline
  // function/array identity changes.
  const onRefreshRef = useRef(onRefresh);
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  });

  useEffect(() => {
    if (!userId || !channelKey || !tables?.length) return;

    let mounted = true;
    let debounceTimer = null;

    const scheduleRefresh = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (mounted) {
          onRefreshRef.current?.();
        }
      }, debounceMs);
    };

    let channel;
    try {
      channel = supabase.channel(channelKey);

      for (const { table, schema = "public", filter } of tables) {
        const opts = { event: "*", schema, table };
        if (filter) opts.filter = filter;
        channel.on("postgres_changes", opts, scheduleRefresh);
      }

      channel.subscribe((status, err) => {
        if (err) {
          console.warn(
            `[useRealtimeRefresh] Channel "${channelKey}" subscription error:`,
            err?.message ?? err
          );
        }
        if (status === "CHANNEL_ERROR") {
          console.warn(
            `[useRealtimeRefresh] Channel "${channelKey}" reported CHANNEL_ERROR — Realtime may not be enabled for this table.`
          );
        }
      });
    } catch (err) {
      console.warn(
        `[useRealtimeRefresh] Failed to create channel "${channelKey}":`,
        err?.message ?? err
      );
    }

    return () => {
      mounted = false;
      if (debounceTimer) clearTimeout(debounceTimer);
      if (channel) {
        supabase.removeChannel(channel).catch(() => {});
      }
    };
  }, [userId, channelKey, debounceMs, tables]);
  // Note: `tables` is intentionally in deps. Callers should pass a stable
  // reference (e.g. a module-level constant) to avoid re-subscribing on every
  // render.
}
