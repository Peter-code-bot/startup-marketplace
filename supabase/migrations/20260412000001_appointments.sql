-- Campos de agenda en productos/servicios
ALTER TABLE products_services ADD COLUMN IF NOT EXISTS allow_appointments BOOLEAN DEFAULT false;
ALTER TABLE products_services ADD COLUMN IF NOT EXISTS appointment_start_time TIME DEFAULT '09:00';
ALTER TABLE products_services ADD COLUMN IF NOT EXISTS appointment_end_time TIME DEFAULT '18:00';
ALTER TABLE products_services ADD COLUMN IF NOT EXISTS appointment_duration_minutes INTEGER DEFAULT 60;

-- Tabla de citas
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products_services(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id),
  seller_id UUID NOT NULL REFERENCES profiles(id),
  appointment_date DATE NOT NULL,
  appointment_start TIME NOT NULL,
  appointment_end TIME NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, appointment_date, appointment_start)
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view appointments" ON appointments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create" ON appointments FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Participants can update" ON appointments FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE INDEX IF NOT EXISTS idx_appointments_product_date ON appointments(product_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_buyer ON appointments(buyer_id);
