-- Disputes
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_confirmation_id UUID NOT NULL REFERENCES sale_confirmations(id),
  reporter_id UUID NOT NULL REFERENCES profiles(id),
  reported_id UUID NOT NULL REFERENCES profiles(id),
  motivo TEXT NOT NULL,
  descripcion TEXT,
  evidencia TEXT[] DEFAULT '{}',
  status dispute_status DEFAULT 'open',
  resolucion TEXT,
  admin_id UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX idx_disputes_sale ON disputes(sale_confirmation_id);
CREATE INDEX idx_disputes_status ON disputes(status);

-- RLS
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view own disputes"
  ON disputes FOR SELECT
  USING (auth.uid() = reporter_id OR auth.uid() = reported_id);

CREATE POLICY "Users can create disputes"
  ON disputes FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admin can manage disputes"
  ON disputes FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));
