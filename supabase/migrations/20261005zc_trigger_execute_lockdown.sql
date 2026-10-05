-- ============================================================
-- Retrivium — Trigger Function Execute Lockdown
-- Migration: 20261005zc_trigger_execute_lockdown
-- Target: Supabase (PostgreSQL 15+)
-- Requires: 20261005_notifications_trigger.sql
-- ============================================================
-- create_claim_outcome_notification() is an internal trigger
-- function: it is only ever invoked by the claims_outcome_notify
-- trigger, never called directly. PostgreSQL does not check
-- EXECUTE privilege for functions invoked by a trigger, so
-- revoking execute does not affect claim-outcome notification
-- creation — it only removes the ability of any client role to
-- call the function by hand (which errors anyway outside
-- trigger context, since NEW/OLD are unset).
--
-- Hosted Supabase auto-grants EXECUTE on functions to the
-- anon / authenticated / service_role roles, so all of them
-- are revoked explicitly (a bare "revoke from public" is a
-- no-op against those direct grants).
--
-- Verified live: an UPDATE fired the trigger for a role with no
-- EXECUTE privilege on the trigger function, and the function
-- ends up owned by postgres alone.

revoke execute on function create_claim_outcome_notification() from public;
revoke execute on function create_claim_outcome_notification() from anon;
revoke execute on function create_claim_outcome_notification() from authenticated;
revoke execute on function create_claim_outcome_notification() from service_role;
