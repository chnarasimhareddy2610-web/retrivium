-- ============================================================
-- Retrivium — Notifications RPC Switchover
-- Migration: 20261005za_notifications_rpc
-- Target: Supabase (PostgreSQL 15+)
-- Requires: 20261005_notifications_schema.sql,
--           20261005_notifications_trigger.sql
-- ============================================================
-- The frontend used to read and update the notifications table
-- through the client API (supabase.from("notifications")).
-- Those direct table paths relied on RLS alone. This switchover
-- moves every client-facing notification operation behind
-- SECURITY DEFINER functions that derive the caller from
-- auth.uid() server-side, so a client can never target another
-- user's rows even if RLS were misconfigured later.
--
-- The functions take NO user_id parameter: the effective user
-- is always auth.uid() evaluated inside the function body.
--
-- They are owned by `postgres` — the same role that owns the
-- notifications table — so (with force_row_security off) they
-- bypass RLS by design and re-apply the ownership check
-- explicitly in every WHERE clause (defense in depth).

create or replace function get_my_notifications()
returns setof notifications
language sql
security definer
set search_path = public, pg_temp
as $$
  select *
  from notifications
  where user_id = auth.uid()
  order by created_at desc;
$$;

create or replace function mark_notification_read(p_notification_id uuid)
returns notifications
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row notifications;
begin
  -- Only a row owned by the caller is touched. If nothing
  -- matches (unknown id, or another user's notification) the
  -- call fails loudly instead of silently succeeding.
  update notifications
    set read_at = now()
    where id = p_notification_id
      and user_id = auth.uid()
    returning * into v_row;

  if v_row is null then
    raise exception 'notification_not_found_or_not_owned';
  end if;

  return v_row;
end;
$$;

create or replace function mark_all_notifications_read()
returns setof notifications
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return query
    update notifications
      set read_at = now()
      where user_id = auth.uid()
        and read_at is null
      returning *;
end;
$$;

-- Only authenticated users may call the notification RPCs.
-- Functions are executable by `public` by default, and hosted
-- Supabase additionally auto-grants EXECUTE on new functions
-- to the anon / authenticated / service_role roles, so we
-- revoke from all of them explicitly and then grant back to
-- `authenticated` only. (An anon caller would fail closed
-- inside the functions anyway — auth.uid() is null — but we
-- remove the surface entirely.)
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
