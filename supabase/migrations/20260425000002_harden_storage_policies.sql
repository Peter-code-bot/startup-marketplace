-- Harden storage bucket policies to scope uploads/deletes by owner UID.
-- This prevents authenticated users from deleting other users' files.

-- ── product-media ────────────────────────────────────────────────────────────
-- Drop weak policies that only checked auth.uid() IS NOT NULL
DROP POLICY IF EXISTS "Authenticated upload product media" ON storage.objects;
DROP POLICY IF EXISTS "Owner delete product media" ON storage.objects;

-- New policies: first path segment must equal uploading user's UID
CREATE POLICY "Owner upload product media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-media' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owner delete product media" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-media' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── avatars ──────────────────────────────────────────────────────────────────
-- Drop weak policies
DROP POLICY IF EXISTS "avatar_upload" ON storage.objects;
DROP POLICY IF EXISTS "avatar_update" ON storage.objects;
DROP POLICY IF EXISTS "avatar_delete" ON storage.objects;

CREATE POLICY "avatar_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatar_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatar_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── chat-media ───────────────────────────────────────────────────────────────
-- Scope chat media uploads to uploading user's UID folder
DROP POLICY IF EXISTS "Authenticated upload chat media" ON storage.objects;

CREATE POLICY "Owner upload chat media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-media' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── media_assets table ───────────────────────────────────────────────────────
-- NOTE: media_assets uses a polymorphic owner_id pattern (product/profile/chat/review).
-- Fixing UPDATE/DELETE to owner requires JOINs per owner_type — deferred to a
-- dedicated refactor that adds a user_id column for direct ownership tracking.
-- For now, this is an accepted known risk logged in the security posture doc.
