-- ============================================================
-- Retrivium — Automatic Claim Outcome Notifications
-- Migration: 20261005_notifications_trigger
-- Target: Supabase (PostgreSQL 15+)
-- Requires: 20261005_notifications_schema.sql (notifications table)
-- ============================================================
-- Server-side guarantee: whenever a claim transitions to a terminal
-- outcome (approved / rejected), the claimant receives exactly one
-- notification. UI code cannot skip this path.

create or replace function create_claim_outcome_notification()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_item_name text;
begin
  -- Only act on an actual status transition; ignore unrelated updates
  -- (reviewer notes, timestamps, etc.) and repeated same-status writes.
  if new.status = old.status then
    return new;
  end if;

  if new.status = 'approved' then
    -- Duplicate guard: at most one approval notification per claim
    if exists (
      select 1
      from notifications
      where related_claim_id = new.id
        and type = 'claim_approved'
    ) then
      return new;
    end if;

    select name into v_item_name
    from items
    where id = new.item_id;

    insert into notifications (
      user_id, type, title, message, related_item_id, related_claim_id
    ) values (
      new.claimant_id,
      'claim_approved',
      'Claim approved',
      'Your claim for "' || coalesce(v_item_name, 'your item') ||
        '" was approved and the item was resolved.',
      new.item_id,
      new.id
    );

  elsif new.status = 'rejected' then
    -- Duplicate guard: at most one rejection notification per claim
    if exists (
      select 1
      from notifications
      where related_claim_id = new.id
        and type = 'claim_rejected'
    ) then
      return new;
    end if;

    select name into v_item_name
    from items
    where id = new.item_id;

    insert into notifications (
      user_id, type, title, message, related_item_id, related_claim_id
    ) values (
      new.claimant_id,
      'claim_rejected',
      'Claim rejected',
      'Your claim for "' || coalesce(v_item_name, 'your item') ||
        '" was rejected by Security.',
      new.item_id,
      new.id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists claims_outcome_notify on claims;

create trigger claims_outcome_notify
after update of status on claims
for each row
execute function create_claim_outcome_notification();
