-- Service availability (for service listings)
CREATE TABLE service_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio_id UUID NOT NULL REFERENCES products_services(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6), -- 0=Sunday
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  duracion INTEGER DEFAULT 60, -- minutes
  cupo INTEGER DEFAULT 1,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER availability_updated_at
  BEFORE UPDATE ON service_availability
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX idx_availability_servicio ON service_availability(servicio_id);

-- Bookings (service reservations)
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio_id UUID NOT NULL REFERENCES products_services(id),
  comprador_id UUID NOT NULL REFERENCES auth.users(id),
  vendedor_id UUID NOT NULL REFERENCES auth.users(id),
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME,
  duracion INTEGER,
  estatus booking_status DEFAULT 'pendiente',
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX idx_bookings_servicio ON bookings(servicio_id);
CREATE INDEX idx_bookings_comprador ON bookings(comprador_id);
CREATE INDEX idx_bookings_vendedor ON bookings(vendedor_id);

-- RLS for service_availability
ALTER TABLE service_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view availability"
  ON service_availability FOR SELECT
  USING (TRUE);

CREATE POLICY "Sellers can manage own availability"
  ON service_availability FOR ALL
  USING (EXISTS (
    SELECT 1 FROM products_services
    WHERE products_services.id = service_availability.servicio_id
    AND products_services.creador_id = auth.uid()
  ));

-- RLS for bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = comprador_id OR auth.uid() = vendedor_id);

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = comprador_id);

CREATE POLICY "Participants can update bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = comprador_id OR auth.uid() = vendedor_id);
