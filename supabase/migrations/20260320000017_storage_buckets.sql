-- Storage buckets

-- Product media (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-media',
  'product-media',
  TRUE,
  20971520, -- 20MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
);

-- Verification documents (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-documents',
  'verification-documents',
  FALSE,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Chat media (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-media',
  'chat-media',
  TRUE,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'audio/mpeg', 'audio/webm']
);

-- Review media (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'review-media',
  'review-media',
  TRUE,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Storage policies for product-media
CREATE POLICY "Public read for product media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-media');

CREATE POLICY "Authenticated upload product media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Owner delete product media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-media' AND auth.uid() IS NOT NULL);

-- Storage policies for verification-documents
CREATE POLICY "Owner read verification docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'verification-documents' AND auth.uid()::TEXT = (storage.foldername(name))[1]);

CREATE POLICY "Owner upload verification docs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'verification-documents' AND auth.uid()::TEXT = (storage.foldername(name))[1]);

-- Storage policies for chat-media
CREATE POLICY "Public read chat media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-media');

CREATE POLICY "Authenticated upload chat media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-media' AND auth.uid() IS NOT NULL);

-- Storage policies for review-media
CREATE POLICY "Public read review media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'review-media');

CREATE POLICY "Authenticated upload review media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'review-media' AND auth.uid() IS NOT NULL);
