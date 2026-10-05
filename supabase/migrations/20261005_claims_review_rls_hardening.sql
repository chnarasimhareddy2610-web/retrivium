-- ============================================================
-- Retrivium — Claim review RLS hardening
-- Migration: 20261005_claims_review_rls_hardening
--
-- The original "claims: claimant update pending" policy restricted
-- the USING clause to pending claims, but its WITH CHECK only
-- required auth.uid() = claimant_id. That allowed a claimant to
-- rewrite their own pending row with status = 'approved',
-- reviewed_by and reviewed_at — i.e. approve their own claim
-- without the security desk.
--
-- This tightens the SAME existing policy so claimants may only
-- edit free-text notes on their own still-pending claim. Approval
-- and rejection stay exclusively with "claims: security update any"
-- (get_my_role() in ('security', 'admin')).
-- ============================================================

drop policy if exists "claims: claimant update pending" on public.claims;

create policy "claims: claimant update pending"
  on public.claims for update
  using (
    auth.uid() = claimant_id
    and status = 'pending'
  )
  with check (
    auth.uid() = claimant_id
    and status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
  );
