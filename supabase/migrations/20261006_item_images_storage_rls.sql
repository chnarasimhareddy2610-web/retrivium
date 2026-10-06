-- ============================================================
-- Retrivium — Storage RLS for the item-images bucket
-- Migration: 20261006_item_images_storage_rls.sql
-- Target: Supabase (PostgreSQL 15+ / Storage RLS)
--
-- Bucket : item-images (PRIVATE, already exists)
-- Access: authenticated uploads + signed-URL reads
--
-- Path convention used by the app (src/lib/itemService.js):
--   {auth.uid()}/{item_id}/photo.{ext}
--
-- Cleanup note:
--   createReport() deletes an orphaned object via
--   supabase.storage.from('item-images').remove([path]) if the
--   DB insert fails after upload. That client call authenticates
--   as the same logged-in user, so a matching DELETE policy is
--   required for the cleanup to succeed.
-- ============================================================

-- Ensure the bucket exists (idempotent — no-op if present).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('item-images', 'item-images', false, null, null)
on conflict (id) do nothing;

-- Enable RLS on the underlying storage.objects table.
-- create policy requires RLS to be enabled; this makes the intent
-- explicit and is safe to re-run.
-- NOTE: `storage.objects` is owned by the Supabase storage service
-- (not the calling role), so this DDL and the policies below must be
-- applied by a role that owns the table — i.e. the Supabase Dashboard
-- SQL Editor, the `service_role` key, or the `supabase` CLI with the
-- service role key. The `execute_sql` MCP helper runs as a restricted
-- role and cannot own this table, so it cannot apply this migration.
-- Apply it by pasting this file into Dashboard → SQL Editor and running it.
alter table storage.objects enable row level security;

-- Drop any pre-existing policies for this bucket from this migration
-- family so the definitions below are applied exactly once and stay
-- in sync with the source of truth in this file. Drops are scoped by
-- policy name, so they never touch policies authored elsewhere.
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname in (
        'item-images: authenticated read',
        'item-images: authenticated insert own folder',
        'item-images: authenticated delete own folder'
      )
  ) then
    execute 'drop policy "item-images: authenticated read" on storage.objects';
    execute 'drop policy "item-images: authenticated insert own folder" on storage.objects';
    execute 'drop policy "item-images: authenticated delete own folder" on storage.objects';
  end if;
end;
$$;

-- ── 1. SELECT ──────────────────────────────────────────────────────
-- Authenticated users may read any object in item-images.
--
-- Reason: Browse / Reports render item photos via
--   supabase.storage.from('item-images').createSignedUrl(path, ttl)
-- for items reported by *other* authenticated campus users. A signed
-- URL is generated server-side using the caller's auth context, so the
-- read must be permitted by a storage policy for the authenticated role.
-- (A per-owner SELECT like owner_id = auth.uid() would block signed-URL
-- reads of other users' photos, which Browse needs.)
create policy "item-images: authenticated read"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'item-images'
  );

-- ── 2. INSERT ──────────────────────────────────────────────────────
-- Authenticated users may upload only into their own top-level folder:
--   {auth.uid()}/*
--
-- Reason: itemService.uploadItemImage() always uploads to
--   {userId}/{itemId}/photo.{ext}, where userId == auth.uid() at
--   upload time. Restricting to the caller's own prefix prevents one
--   user from writing into another user's folder.
-- Uses auth.jwt()->>'sub' (the UUID subject claim) so the folder prefix
-- is derived from the verified JWT rather than auth.uid().
create policy "item-images: authenticated insert own folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'item-images'
    and (storage.foldername(name))[1] = auth.jwt()->>'sub'
  );

-- ── 3. DELETE ──────────────────────────────────────────────────────
-- Authenticated users may delete only objects in their own top-level
-- folder: {auth.uid()}/*
--
-- Reason: itemService.createReport() performs best-effort cleanup of an
-- orphaned object via supabase.storage.from('item-images').remove([path])
-- when the DB insert fails after a successful upload. The client remove()
-- authenticates as the same logged-in user who uploaded, so a matching
-- DELETE policy over the caller's own prefix is required for cleanup to
-- succeed. No other user can delete another user's photos.
create policy "item-images: authenticated delete own folder"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'item-images'
    and (storage.foldername(name))[1] = auth.jwt()->>'sub'
  );

-- NOTICE: no UPDATE policy is created.
-- Rationale: the existing upload implementation (uploadItemImage) uses
-- supabase.storage.from('item-images').upload(path, file, {upsert:false,...})
-- which performs an INSERT (creating a new object). Supabase storage does
-- not expose in-place object updates via the client SDK the same way a
-- relational row update works; "upsert:false" forbids replacing an existing
-- object at the same path. There is therefore no client code path today that
-- requires an UPDATE on storage.objects, so no UPDATE policy is added.
