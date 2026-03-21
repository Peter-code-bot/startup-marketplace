-- Sale confirmations (mutual confirmation system - replaces orders/cart)
CREATE TABLE sale_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products_services(id),
  buyer_id UUID NOT NULL REFERENCES profiles(id),
  seller_id UUID NOT NULL REFERENCES profiles(id),
  chat_id UUID, -- will reference chats table (created later)

  -- Agreed details
  precio_acordado DECIMAL(10,2) NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  metodo_pago TEXT, -- informational only: 'efectivo', 'transferencia', 'otro'
  notas TEXT,
  tipo_entrega TEXT DEFAULT 'pickup', -- 'pickup' or 'envio'

  -- Dual confirmation system
  initiated_by UUID NOT NULL REFERENCES profiles(id),
  buyer_confirmed BOOLEAN DEFAULT FALSE,
  buyer_confirmed_at TIMESTAMPTZ,
  seller_confirmed BOOLEAN DEFAULT FALSE,
  seller_confirmed_at TIMESTAMPTZ,

  -- Status
  status sale_status NOT NULL DEFAULT 'pending_confirmation',
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES profiles(id),
  cancel_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT different_users CHECK (buyer_id != seller_id),
  CONSTRAINT valid_initiator CHECK (initiated_by = buyer_id OR initiated_by = seller_id),
  CONSTRAINT positive_price CHECK (precio_acordado > 0),
  CONSTRAINT positive_quantity CHECK (cantidad > 0)
);

-- Auto-confirm initiator
CREATE OR REPLACE FUNCTION auto_confirm_initiator()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.initiated_by = NEW.buyer_id THEN
    NEW.buyer_confirmed := TRUE;
    NEW.buyer_confirmed_at := NOW();
  ELSIF NEW.initiated_by = NEW.seller_id THEN
    NEW.seller_confirmed := TRUE;
    NEW.seller_confirmed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_initiator_confirmed
  BEFORE INSERT ON sale_confirmations
  FOR EACH ROW EXECUTE FUNCTION auto_confirm_initiator();

-- Auto-complete when both confirm + award trust points
CREATE OR REPLACE FUNCTION check_sale_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.buyer_confirmed = TRUE
     AND NEW.seller_confirmed = TRUE
     AND NEW.status = 'pending_confirmation'
     AND (OLD.buyer_confirmed = FALSE OR OLD.seller_confirmed = FALSE)
  THEN
    NEW.status := 'completed';
    NEW.completed_at := NOW();

    -- Update seller stats + trust points
    UPDATE profiles
    SET total_sales = total_sales + 1,
        trust_points = trust_points + 10
    WHERE id = NEW.seller_id;

    -- Award buyer trust points
    UPDATE profiles
    SET trust_points = trust_points + 3
    WHERE id = NEW.buyer_id;

    -- Update product sales count
    UPDATE products_services
    SET ventas_count = ventas_count + NEW.cantidad
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER complete_sale_on_mutual_confirm
  BEFORE UPDATE ON sale_confirmations
  FOR EACH ROW EXECUTE FUNCTION check_sale_completion();

-- Expire stale confirmations (called by cron/edge function)
CREATE OR REPLACE FUNCTION expire_stale_confirmations()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE sale_confirmations
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending_confirmation'
    AND created_at < NOW() - INTERVAL '72 hours';
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Updated_at trigger
CREATE TRIGGER sale_confirmations_updated_at
  BEFORE UPDATE ON sale_confirmations
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Indexes
CREATE INDEX idx_sale_buyer ON sale_confirmations(buyer_id);
CREATE INDEX idx_sale_seller ON sale_confirmations(seller_id);
CREATE INDEX idx_sale_product ON sale_confirmations(product_id);
CREATE INDEX idx_sale_status ON sale_confirmations(status);
CREATE INDEX idx_sale_created ON sale_confirmations(created_at DESC);

-- RLS
ALTER TABLE sale_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view own confirmations"
  ON sale_confirmations FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Participants can create confirmations"
  ON sale_confirmations FOR INSERT
  WITH CHECK (
    auth.uid() = initiated_by
    AND (auth.uid() = buyer_id OR auth.uid() = seller_id)
  );

CREATE POLICY "Participants can confirm or cancel"
  ON sale_confirmations FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Admin can view all confirmations"
  ON sale_confirmations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));
