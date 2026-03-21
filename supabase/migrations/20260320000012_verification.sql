-- Seller verification (KYC documents)
CREATE TABLE seller_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status verification_status DEFAULT 'pending',
  ine_front_url TEXT,
  ine_back_url TEXT,
  selfie_url TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewer_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER seller_verification_updated_at
  BEFORE UPDATE ON seller_verification
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX idx_seller_verification_user ON seller_verification(user_id);
CREATE INDEX idx_seller_verification_status ON seller_verification(status);

-- Trust level verification (progressive: 5 levels)
CREATE TABLE trust_level_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  current_level trust_level DEFAULT 'nuevo',

  -- Level 1: Phone + Selfie
  phone_number TEXT,
  phone_verified BOOLEAN DEFAULT FALSE,
  phone_verified_at TIMESTAMPTZ,
  selfie_url TEXT,
  selfie_verified BOOLEAN DEFAULT FALSE,

  -- Level 2: ID + Address
  id_front_url TEXT,
  id_back_url TEXT,
  id_verified BOOLEAN DEFAULT FALSE,
  address_proof_url TEXT,
  address_verified BOOLEAN DEFAULT FALSE,
  selfie_match_verified BOOLEAN DEFAULT FALSE,

  level_1_completed_at TIMESTAMPTZ,
  level_2_completed_at TIMESTAMPTZ,
  reviewer_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trust_verification_updated_at
  BEFORE UPDATE ON trust_level_verification
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Sync trust level from verification to profile
CREATE OR REPLACE FUNCTION update_profile_trust_level()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET trust_level = NEW.current_level, updated_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_trust_level
  AFTER UPDATE OF current_level ON trust_level_verification
  FOR EACH ROW EXECUTE FUNCTION update_profile_trust_level();

-- RLS for seller_verification
ALTER TABLE seller_verification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verification"
  ON seller_verification FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can submit verification"
  ON seller_verification FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own verification"
  ON seller_verification FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage verifications"
  ON seller_verification FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- RLS for trust_level_verification
ALTER TABLE trust_level_verification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trust verification"
  ON trust_level_verification FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can submit trust verification"
  ON trust_level_verification FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trust verification"
  ON trust_level_verification FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage trust verifications"
  ON trust_level_verification FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));
