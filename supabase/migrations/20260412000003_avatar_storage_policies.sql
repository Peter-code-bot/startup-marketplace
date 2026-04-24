-- Allow authenticated users to upload to their own folder in avatars bucket
CREATE POLICY "avatar_upload" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Allow authenticated users to update their own avatars
CREATE POLICY "avatar_update" ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Allow public read access to all avatars
CREATE POLICY "avatar_read" ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to delete their own avatars
CREATE POLICY "avatar_delete" ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
