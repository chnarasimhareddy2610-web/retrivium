-- ============================================================
-- Retrivium — Notifications Table & RLS Policies
-- Migration: 20261005_notifications_schema
-- Target: Supabase (PostgreSQL 15+)
-- ============================================================

create table if not exists notifications (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references profiles(id) on delete cascade,
  type             text        not null default 'info',
  title            text        not null check (char_length(title) between 2 and 150),
  message          text        not null check (char_length(message) between 2 and 500),
  related_item_id  uuid        references items(id) on delete cascade,
  related_claim_id uuid        references claims(id) on delete cascade,
  read_at          timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table notifications is
  'User notifications for item matches, claim status updates, and campus security updates.';

create trigger notifications_updated_at
  before update on notifications
  for each row execute procedure update_updated_at_column();

create index if not exists notifications_user_idx       on notifications(user_id);
create index if not exists notifications_read_at_idx    on notifications(read_at);
create index if not exists notifications_created_at_idx on notifications(created_at desc);

-- ── ROW LEVEL SECURITY ──

alter table notifications enable row level security;

-- Authenticated users can read only their own notifications
create policy "notifications: user read own"
  on notifications for select
  using (auth.uid() = user_id);

-- Authenticated users can update (e.g. mark read) only their own notifications
create policy "notifications: user update own"
  on notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Authenticated users / system triggers can insert notifications
create policy "notifications: authenticated insert"
  on notifications for insert
  with check (auth.role() = 'authenticated');
