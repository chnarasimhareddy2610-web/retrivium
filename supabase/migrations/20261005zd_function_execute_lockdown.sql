-- ============================================================
-- Retrivium — Function EXECUTE Lockdown (corrective)
-- Migration: 20261005zd_function_execute_lockdown
-- Target: Supabase (PostgreSQL 15+)
-- Requires: 20261005za_notifications_rpc.sql,
--           20261005zc_trigger_execute_lockdown.sql
-- ============================================================
-- Corrective migration for the live project. Hosted Supabase
-- auto-grants EXECUTE on newly created functions to the
-- anon / authenticated / service_role roles at creation
-- time, which made the bare "revoke from public" statements
-- in 20261005za / 20261005zc no-ops (they were applied
-- before the auto-grants, or targeted a role with no direct
-- grant). This migration revokes from the named roles
-- explicitly, which does stick, and re-grants the three
-- notification RPCs to `authenticated` only.
--
-- On a fresh install where 20261005za / 20261005zc already
-- contain the role-specific revokes, every statement here is
-- an idempotent no-op — running it is always safe.
--
-- Verified live afterwards via pg_proc.proacl and
-- has_function_privilege():
--   * get_my_notifications / mark_notification_read /
--     mark_all_notifications_read -> postgres + authenticated
--   * create_claim_outcome_notification -> postgres only
--   * anon: EXECUTE denied on all four

revoke execute on function get_my_notifications() from public;
revoke execute on function mark_notification_read(uuid) from public;
revoke execute on function mark_all_notifications_read() from public;
revoke execute on function get_my_notifications() from anon;
revoke execute on function mark_notification_read(uuid) from anon;
revoke execute on function mark_all_notifications_read() from anon;
revoke execute on function get_my_notifications() from service_role;
revoke execute on function mark_notification_read(uuid) from service_role;
revoke execute on function mark_all_notifications_read() from service_role;
grant execute on function get_my_notifications() to authenticated;
grant execute on function mark_notification_read(uuid) to authenticated;
grant execute on function mark_all_notifications_read() to authenticated;

revoke execute on function create_claim_outcome_notification() from public;
revoke execute on function create_claim_outcome_notification() from anon;
revoke execute on function create_claim_outcome_notification() from authenticated;
revoke execute on function create_claim_outcome_notification() from service_role;
