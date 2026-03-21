-- Bidirectional reviews (buyer ↔ seller)
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_confirmation_id UUID NOT NULL REFERENCES sale_confirmations(id),
  product_id UUID NOT NULL REFERENCES products_services(id),

  -- Who writes and about whom
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  reviewed_id UUID NOT NULL REFERENCES profiles(id),
  review_type review_type NOT NULL,

  -- Content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comentario TEXT,
  fotos TEXT[] DEFAULT '{}',

  -- Response from reviewed user
  respuesta TEXT,
  respuesta_fecha TIMESTAMPTZ,

  -- Moderation
  visible BOOLEAN DEFAULT TRUE,
  reportada BOOLEAN DEFAULT FALSE,
  motivo_reporte TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT different_reviewer_reviewed CHECK (reviewer_id != reviewed_id),
  CONSTRAINT unique_review_per_sale UNIQUE (sale_confirmation_id, review_type)
);

-- Recalculate user ratings + trust points on review
CREATE OR REPLACE FUNCTION update_user_rating_on_review()
RETURNS TRIGGER AS $$
DECLARE
  new_avg DECIMAL(3,2);
  review_count INTEGER;
  points_to_add INTEGER;
BEGIN
  -- Calculate new average for reviewed user
  SELECT AVG(rating)::DECIMAL(3,2), COUNT(*)
  INTO new_avg, review_count
  FROM reviews
  WHERE reviewed_id = NEW.reviewed_id AND visible = TRUE;

  -- Update reviewed user's profile
  UPDATE profiles
  SET average_rating = COALESCE(new_avg, 0),
      reviews_count = COALESCE(review_count, 0),
      updated_at = NOW()
  WHERE id = NEW.reviewed_id;

  -- Trust points for reviewed user based on rating
  points_to_add := CASE
    WHEN NEW.rating = 5 THEN 5
    WHEN NEW.rating = 4 THEN 3
    WHEN NEW.rating = 3 THEN 1
    WHEN NEW.rating = 2 THEN 0
    WHEN NEW.rating = 1 THEN -2
    ELSE 0
  END;

  UPDATE profiles
  SET trust_points = GREATEST(0, trust_points + points_to_add)
  WHERE id = NEW.reviewed_id;

  -- Bonus trust points for writing a review (incentive)
  UPDATE profiles
  SET trust_points = trust_points + 2
  WHERE id = NEW.reviewer_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalc_rating_on_review
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_user_rating_on_review();

-- Update separated ratings (as_seller / as_buyer)
CREATE OR REPLACE FUNCTION update_separated_ratings()
RETURNS TRIGGER AS $$
BEGIN
  -- Rating as seller
  UPDATE profiles SET
    average_rating_as_seller = COALESCE((
      SELECT AVG(rating)::DECIMAL(3,2) FROM reviews
      WHERE reviewed_id = NEW.reviewed_id AND review_type = 'buyer_to_seller' AND visible = TRUE
    ), 0),
    reviews_count_as_seller = (
      SELECT COUNT(*) FROM reviews
      WHERE reviewed_id = NEW.reviewed_id AND review_type = 'buyer_to_seller' AND visible = TRUE
    )
  WHERE id = NEW.reviewed_id;

  -- Rating as buyer
  UPDATE profiles SET
    average_rating_as_buyer = COALESCE((
      SELECT AVG(rating)::DECIMAL(3,2) FROM reviews
      WHERE reviewed_id = NEW.reviewed_id AND review_type = 'seller_to_buyer' AND visible = TRUE
    ), 0),
    reviews_count_as_buyer = (
      SELECT COUNT(*) FROM reviews
      WHERE reviewed_id = NEW.reviewed_id AND review_type = 'seller_to_buyer' AND visible = TRUE
    )
  WHERE id = NEW.reviewed_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_separated_ratings_trigger
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_separated_ratings();

-- Updated_at trigger
CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Indexes
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewed ON reviews(reviewed_id);
CREATE INDEX idx_reviews_sale ON reviews(sale_confirmation_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_type ON reviews(review_type);
CREATE INDEX idx_reviews_visible ON reviews(visible) WHERE visible = TRUE;

-- RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible reviews"
  ON reviews FOR SELECT
  USING (visible = TRUE);

CREATE POLICY "Participants can create reviews on completed sales"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM sale_confirmations sc
      WHERE sc.id = sale_confirmation_id
        AND sc.status = 'completed'
        AND (
          (review_type = 'buyer_to_seller' AND sc.buyer_id = auth.uid() AND sc.seller_id = reviewed_id)
          OR
          (review_type = 'seller_to_buyer' AND sc.seller_id = auth.uid() AND sc.buyer_id = reviewed_id)
        )
    )
  );

CREATE POLICY "Reviewed user can respond"
  ON reviews FOR UPDATE
  USING (auth.uid() = reviewed_id)
  WITH CHECK (auth.uid() = reviewed_id);

CREATE POLICY "Admin can manage reviews"
  ON reviews FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));
