-- ============================================================
-- Retrivium — Optional GPS coordinates for item reports
-- Migration: 20261007_items_gps_coordinates
-- Target: Supabase (PostgreSQL 15+)
--
-- Adds two NULLABLE columns to `items` so a reporter can optionally
-- attach the browser-reported position of a lost/found item.
--
-- Design notes:
--   * Both columns are nullable so every existing row (and every
--     report submitted without GPS) keeps working with NULL coords.
--   * numeric(9,6) comfortably fits lat (±90.xxxxxx) and lng
--     (±180.xxxxxx) at ~0.11 m precision, without float drift.
--   * CHECK constraints enforce valid Earth coordinates. They allow
--     NULL (unknown position) but reject out-of-range values.
--   * A paired CHECK requires both coordinates to be present or both
--     absent, so a half-set position can never be stored.
--   * Purely additive: no RLS policies, grants, or existing columns
--     are modified. Existing security behaviour is untouched.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. COLUMNS
-- ────────────────────────────────────────────────────────────
alter table public.items
  add column if not exists latitude  numeric(9,6),
  add column if not exists longitude numeric(9,6);

comment on column public.items.latitude is
  'Optional browser GPS latitude (-90..90) captured with the reporter''s explicit consent. NULL when location was not captured.';

comment on column public.items.longitude is
  'Optional browser GPS longitude (-180..180) captured with the reporter''s explicit consent. NULL when location was not captured.';

-- ────────────────────────────────────────────────────────────
-- 2. VALIDATION (idempotent — drop-then-add)
-- ────────────────────────────────────────────────────────────
alter table public.items
  drop constraint if exists items_latitude_range_check,
  drop constraint if exists items_longitude_range_check,
  drop constraint if exists items_coordinates_paired_check;

alter table public.items
  add constraint items_latitude_range_check
    check (latitude is null or (latitude >= -90 and latitude <= 90)),
  add constraint items_longitude_range_check
    check (longitude is null or (longitude >= -180 and longitude <= 180)),
  add constraint items_coordinates_paired_check
    check ((latitude is null) = (longitude is null));

-- ────────────────────────────────────────────────────────────
-- 3. INDEX (optional spatial filtering by area)
-- ────────────────────────────────────────────────────────────
create index if not exists items_coordinates_idx
  on public.items (latitude, longitude)
  where latitude is not null and longitude is not null;
