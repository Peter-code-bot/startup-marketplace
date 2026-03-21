-- Coupons (informational — mentioned during negotiation)
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL UNIQUE,
  tipo_descuento coupon_type NOT NULL,
  valor NUMERIC NOT NULL CHECK (valor > 0),
  fecha_inicio TIMESTAMPTZ DEFAULT NOW(),
  fecha_expiracion TIMESTAMPTZ,
  usos_maximos INTEGER,
  usos_actuales INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX idx_coupons_vendedor ON coupons(vendedor_id);
CREATE INDEX idx_coupons_codigo ON coupons(codigo);

-- RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupons"
  ON coupons FOR SELECT
  USING (activo = TRUE);

CREATE POLICY "Sellers can manage own coupons"
  ON coupons FOR ALL
  USING (auth.uid() = vendedor_id);
