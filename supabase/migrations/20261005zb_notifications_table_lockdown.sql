-- ============================================================
-- Retrivium — Notifications Table Lockdown (RPC-only access)
-- Migration: 20261005zb_notifications_table_lockdown
-- Target: Supabase (PostgreSQL 15+)
-- Requires: 20261005za_notifications_rpc.sql
-- ============================================================
-- All client-facing notification reads and writes now go through
-- the SECURITY DEFINER RPCs created in 20261005za. The direct
-- table policies are removed so the notifications table is
-- unreachable from the client API for every role: RLS with no
-- policies is default-deny.
--
-- The only remaining writers are database-side:
--   * create_claim_outcome_notification() — SECURITY DEFINER
--     trigger function owned by `postgres` (the table owner,
--     exempt from RLS while force_row_security is off), which
--     creates claim-outcome notifications;
--   * the three notification RPCs from 20261005za, also owned
--     by `postgres`, which scope every statement to auth.uid()
--     inside the function body.
--
-- Do not add a client-facing policy back without a matching
-- server-side need.

drop policy if exists "notifications: user read own" on notifications;
drop policy if exists "notifications: user update own" on notifications;
