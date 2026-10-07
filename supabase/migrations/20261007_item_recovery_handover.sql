-- ============================================================
-- Retrivium — Item Recovery Lifecycle & Handover foundation
-- Migration: 20261007_item_recovery_handover
-- Target: Supabase (PostgreSQL 15+)
--
-- WHY
-- ----
-- items.status keeps its existing meaning (lost / found / resolved) and
-- its existing enum — nothing is renamed or replaced. What was missing
-- is the *custody* half of the real-world flow:
--
--   LOST -> FOUND -> CLAIM SUBMITTED -> CLAIM APPROVED
--        -> READY FOR HANDOVER -> HANDED OVER -> RESOLVED
--   (plus CLAIM REJECTED and NO CLAIM / WAITING AT SECURITY)
--
-- MODEL CHOSEN (smallest clean addition)
-- --------------------------------------
--   * Claim *decision* state stays exactly where it already lives:
--     claims.status (pending / under_review / approved / rejected).
--     It is NOT duplicated — the two claim stages of the flow
--     (CLAIM SUBMITTED, CLAIM APPROVED / CLAIM REJECTED) are read from
--     the existing claim row.
--   * items.recovery_state (new, nullable) carries only the CUSTODY
--     stage, which nothing currently models:
--         at_security    - found item held at the Security Desk
--                          (NO CLAIM / WAITING AT SECURITY, and the
--                          state a CLAIM REJECTED item returns to)
--         claim_approved - approved claim, item is READY FOR HANDOVER
--         handed_over    - physically handed over (=> status resolved)
--     NULL means "no custody state" (lost items, and legacy rows).
--   * handover_records is a new append-only table: who received the
--     item, who handed it over, and when.
--
-- The stage transitions are driven by database triggers, so a client
-- can never manufacture a stage by button visibility alone.
--
-- This migration is purely additive: no existing column, policy,
-- function or row is modified or deleted. Existing rows receive NULL
-- recovery_state and keep rendering exactly as before.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. CUSTODY STAGE ENUM
-- ────────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'item_recovery_state'
      and n.nspname = 'public'
  ) then
    create type public.item_recovery_state as enum (
      'at_security',     -- waiting at Security (no approved claim yet)
      'claim_approved',  -- approved claim: READY FOR HANDOVER
      'handed_over'      -- physically handed over (item resolved)
    );
  end if;
end $$;

comment on type public.item_recovery_state is
  'Custody stage of an item recovery. Claim decision state (pending/under_review/approved/rejected) is NOT duplicated here — it lives on claims.status.';


-- ────────────────────────────────────────────────────────────
-- 2. COLUMN (nullable — old rows keep working untouched)
-- ────────────────────────────────────────────────────────────
alter table public.items
  add column if not exists recovery_state public.item_recovery_state;

comment on column public.items.recovery_state is
  'Custody/recovery stage: at_security | claim_approved | handed_over. NULL = not part of a custody flow (lost items, legacy rows). Written only by security/admin flows and server-side triggers.';


-- ────────────────────────────────────────────────────────────
-- 3. INVARIANT CHECKS (idempotent)
-- ────────────────────────────────────────────────────────────
alter table public.items
  drop constraint if exists items_handed_over_requires_resolved,
  drop constraint if exists items_custody_requires_found;

alter table public.items
  add constraint items_handed_over_requires_resolved
    check (recovery_state is distinct from 'handed_over' or status = 'resolved'),
  add constraint items_custody_requires_found
    check (recovery_state is null or recovery_state = 'handed_over' or status = 'found');


-- ────────────────────────────────────────────────────────────
-- 4. items custody-state guard trigger
--    * normalises: resolving an item that was never physically
--      handed over clears its custody stage (no stale "held by
--      security" label on a resolved item);
--    * blocks students from writing custody stages they have no
--      business writing (e.g. forcing handed_over). Security/Admin
--      and database-side (SECURITY DEFINER) writers are allowed.
--    Students may still record the honest default for their own new
--    found report: at_security <-> NULL.
-- ────────────────────────────────────────────────────────────
create or replace function public.items_recovery_guard()
returns trigger
language plpgsql
as $$
declare
  v_role public.user_role;
begin
  -- Resolving outside the handover flow must not leave a stale stage.
  if new.status = 'resolved'
     and new.recovery_state in ('at_security', 'claim_approved') then
    new.recovery_state := null;
  end if;

  if (TG_OP = 'INSERT' and new.recovery_state is not null)
     or (TG_OP = 'UPDATE' and new.recovery_state is distinct from old.recovery_state) then
    -- Database-side writers (postgres via SECURITY DEFINER triggers/RPCs,
    -- migrations, service role) are trusted. Client roles are not.
    if current_user in ('anon', 'authenticated') then
      v_role := coalesce(public.get_my_role(), 'student'::public.user_role);
      if v_role not in ('security', 'admin') then
        -- Students may only move between NULL and the honest default.
        if coalesce(new.recovery_state, 'at_security') <> 'at_security'
           or (TG_OP = 'UPDATE'
               and coalesce(old.recovery_state, 'at_security') <> 'at_security') then
          raise exception 'forbidden_recovery_state_change';
        end if;
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists items_recovery_guard on public.items;
create trigger items_recovery_guard
  before insert or update on public.items
  for each row
  execute function public.items_recovery_guard();


-- ────────────────────────────────────────────────────────────
-- 5. handover_records — append-only proof of a completed handover
-- ────────────────────────────────────────────────────────────
create table if not exists public.handover_records (
  id             uuid        primary key default gen_random_uuid(),

  item_id        uuid        not null references public.items(id)   on delete cascade,
  -- Present whenever the handover satisfies an approved claim.
  -- Nullable only so the schema does not forbid a future no-claim
  -- return; the RPC today always requires an approved claim.
  claim_id       uuid        references public.claims(id) on delete set null,

  -- Who physically received the item (must match the approved claimant).
  receiver_id    uuid        not null references public.profiles(id) on delete restrict,
  -- Security/Admin user who completed the handover.
  performed_by   uuid        not null references public.profiles(id) on delete restrict,

  handed_over_at timestamptz not null default now(),
  notes          text        check (char_length(notes) <= 500),
  created_at     timestamptz not null default now()
);

comment on table public.handover_records is
  'Append-only record of a completed physical handover. One per item; written only by the complete_handover() SECURITY DEFINER RPC.';

-- One completed handover per item — hard backstop against duplicates.
create unique index if not exists handover_records_item_uniq
  on public.handover_records (item_id);

create index if not exists handover_records_claim_idx    on public.handover_records (claim_id);
create index if not exists handover_records_receiver_idx on public.handover_records (receiver_id);
create index if not exists handover_records_performer_idx on public.handover_records (performed_by);
create index if not exists handover_records_created_idx  on public.handover_records (created_at desc);

-- ── RLS ──────────────────────────────────────────────────────
alter table public.handover_records enable row level security;

-- Participants (receiver / the security user who signed it off) and
-- Security/Admin can read. There is deliberately NO insert/update/delete
-- policy: RLS is default-deny, so clients cannot write handovers at all —
-- only the SECURITY DEFINER RPC below can.
drop policy if exists "handover: participants read" on public.handover_records;
create policy "handover: participants read"
  on public.handover_records for select
  to authenticated
  using (auth.uid() = receiver_id or auth.uid() = performed_by);

drop policy if exists "handover: security read all" on public.handover_records;
create policy "handover: security read all"
  on public.handover_records for select
  to authenticated
  using ( public.get_my_role() in ('security', 'admin') );


-- ────────────────────────────────────────────────────────────
-- 6. Claim decision -> item custody stage (server-side)
--    CLAIM APPROVED => READY FOR HANDOVER
--    CLAIM REJECTED => back to waiting at Security
-- ────────────────────────────────────────────────────────────
create or replace function public.apply_claim_outcome_to_item()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_item public.items%rowtype;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  select * into v_item from public.items where id = new.item_id for update;
  if not found then
    return new;
  end if;
  -- Never regress a completed handover.
  if v_item.recovery_state = 'handed_over' or v_item.status <> 'found' then
    return new;
  end if;

  if new.status = 'approved' then
    update public.items set recovery_state = 'claim_approved' where id = new.item_id;
  elsif new.status = 'rejected' then
    update public.items set recovery_state = 'at_security' where id = new.item_id;
  elsif new.status in ('pending', 'under_review') then
    -- A claim was re-opened after approval: back to review, item stays
    -- at Security until a claim is approved again.
    update public.items
       set recovery_state = 'at_security'
     where id = new.item_id and recovery_state = 'claim_approved';
  end if;

  return new;
end;
$$;

drop trigger if exists claims_recovery_transition on public.claims;
create trigger claims_recovery_transition
  after update of status on public.claims
  for each row
  execute function public.apply_claim_outcome_to_item();


-- ────────────────────────────────────────────────────────────
-- 7. complete_handover() — the ONLY way to complete a handover
--    Verifies every precondition server-side; the frontend is
--    never trusted for authorisation.
-- ────────────────────────────────────────────────────────────
create or replace function public.complete_handover(
  p_item_id     uuid,
  p_claim_id    uuid,
  p_receiver_id uuid,
  p_notes       text default null
)
returns public.handover_records
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role   public.user_role;
  v_item   public.items%rowtype;
  v_claim  public.claims%rowtype;
  v_record public.handover_records%rowtype;
  v_name   text;
begin
  -- 0. Must be a signed-in user at all.
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  -- 1. Caller must be Security/Admin (derived server-side from the JWT
  --    profile row, never from a client-supplied flag).
  v_role := coalesce(public.get_my_role(), 'student'::public.user_role);
  if v_role not in ('security', 'admin') then
    raise exception 'handover_forbidden: security role required';
  end if;

  if p_item_id is null or p_receiver_id is null then
    raise exception 'missing_arguments';
  end if;

  -- 2. Item exists and is in a handover-able stage.
  select * into v_item from public.items where id = p_item_id for update;
  if not found then
    raise exception 'item_not_found';
  end if;
  -- Blocks LOST -> HANDED_OVER and anything already resolved.
  if v_item.status <> 'found' then
    raise exception 'invalid_transition: item is not a found item awaiting handover';
  end if;
  if v_item.recovery_state = 'handed_over' then
    raise exception 'already_handed_over';
  end if;

  -- 3. Resolve the claim: explicit id must belong to this item, otherwise
  --    pick the item's approved claim.
  if p_claim_id is not null then
    select * into v_claim
      from public.claims
     where id = p_claim_id and item_id = p_item_id
     for update;
    if not found then
      raise exception 'claim_not_found_for_item';
    end if;
  else
    select * into v_claim
      from public.claims
     where item_id = p_item_id
     order by (status = 'approved') desc, reviewed_at desc nulls last, created_at desc
     limit 1
     for update;
    if not found then
      raise exception 'claim_required: no claim exists for this item';
    end if;
  end if;

  -- 4. The claim must be approved — blocks rejected/pending claims and
  --    the FOUND -> HANDED_OVER-without-approved-claim shortcut.
  if v_claim.status <> 'approved' then
    raise exception 'claim_not_approved';
  end if;

  -- 5. Receiver must be the approved claimant (no impersonation).
  if p_receiver_id is distinct from v_claim.claimant_id then
    raise exception 'receiver_must_match_approved_claim';
  end if;

  -- 6. Not already handed over (in addition to the unique index).
  if exists (select 1 from public.handover_records where item_id = p_item_id) then
    raise exception 'handover_already_completed';
  end if;

  -- 7. Record the handover.
  insert into public.handover_records (item_id, claim_id, receiver_id, performed_by, notes)
  values (
    p_item_id,
    v_claim.id,
    p_receiver_id,
    auth.uid(),
    nullif(btrim(coalesce(p_notes, '')), '')
  )
  returning * into v_record;

  -- 8. Item becomes resolved through the existing status model.
  update public.items
     set status = 'resolved',
         recovery_state = 'handed_over',
         resolved_at = now()
   where id = p_item_id;

  -- 9. Reuse the existing notification table/infrastructure — no second
  --    notification system. One handover notification per item.
  if not exists (
    select 1 from public.notifications
     where related_item_id = p_item_id
       and type = 'item_handed_over'
  ) then
    select name into v_name from public.items where id = p_item_id;

    insert into public.notifications (user_id, type, title, message, related_item_id, related_claim_id)
    values (
      v_claim.claimant_id,
      'item_handed_over',
      'Handover complete',
      'Your item "' || coalesce(v_name, 'your item') ||
        '" was handed over to you at the Security Desk.',
      p_item_id,
      v_claim.id
    );
  end if;

  return v_record;
end;
$$;

comment on function public.complete_handover(uuid, uuid, uuid, text) is
  'Completes a physical item handover. SECURITY DEFINER: authorises the caller as Security/Admin, requires an approved claim whose claimant matches the receiver, and records the handover atomically.';

-- Hosted Supabase auto-grants EXECUTE to anon/authenticated/service_role
-- at creation time, so revoke explicitly and grant back to authenticated
-- only (same pattern as the notification RPCs).
revoke execute on function public.complete_handover(uuid, uuid, uuid, text) from public;
revoke execute on function public.complete_handover(uuid, uuid, uuid, text) from anon;
revoke execute on function public.complete_handover(uuid, uuid, uuid, text) from service_role;
grant  execute on function public.complete_handover(uuid, uuid, uuid, text) to authenticated;


-- ────────────────────────────────────────────────────────────
-- 8. Keep the existing claim notification text truthful
--    The claim_outcome trigger previously told the claimant the item was
--    "resolved" on approval. Under the recovery lifecycle an approval now
--    means READY FOR HANDOVER, and resolution happens at handover, so only
--    the message string is corrected. Everything else about that trigger
--    (definer, duplicate guards, claim decision states, RLS posture) is
--    unchanged, and the notification is still produced by the same
--    infrastructure — no second notification system is introduced.
-- ────────────────────────────────────────────────────────────
create or replace function public.create_claim_outcome_notification()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_item_name text;
begin
  if new.status = old.status then
    return new;
  end if;

  if new.status = 'approved' then
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
        '" was approved — it is ready for handover at the Security Desk.',
      new.item_id,
      new.id
    );

  elsif new.status = 'rejected' then
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

-- Internal trigger function: keep client roles from calling it directly.
revoke execute on function public.create_claim_outcome_notification() from public;
revoke execute on function public.create_claim_outcome_notification() from anon;
revoke execute on function public.create_claim_outcome_notification() from authenticated;
revoke execute on function public.create_claim_outcome_notification() from service_role;
