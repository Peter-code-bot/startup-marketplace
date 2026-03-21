-- Media assets (polymorphic: product, profile, chat, review)
CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type TEXT NOT NULL CHECK (owner_type IN ('producto', 'servicio', 'profile', 'chat', 'review')),
  owner_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'audio')),
  url_original TEXT NOT NULL,
  url_optimized TEXT,
  url_thumbnail TEXT,
  duration_sec INTEGER,
  width INTEGER,
  height INTEGER,
  size_kb INTEGER,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER media_updated_at
  BEFORE UPDATE ON media_assets
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX idx_media_owner ON media_assets(owner_id, owner_type);
CREATE INDEX idx_media_order ON media_assets(owner_id, order_index);

-- RLS
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view media"
  ON media_assets FOR SELECT
  USING (TRUE);

CREATE POLICY "Authenticated users can insert media"
  ON media_assets FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Owners can manage media"
  ON media_assets FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Owners can delete media"
  ON media_assets FOR DELETE
  USING (auth.uid() IS NOT NULL);
