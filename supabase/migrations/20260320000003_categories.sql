-- Categories table (predefined, admin-managed)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icono TEXT NOT NULL,
  parent_id UUID REFERENCES categories(id),
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories"
  ON categories FOR SELECT
  USING (activo = TRUE);

CREATE POLICY "Admin can manage categories"
  ON categories FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Seed categories
INSERT INTO categories (nombre, slug, icono, orden) VALUES
  ('Comida', 'comida', 'UtensilsCrossed', 1),
  ('Ropa', 'ropa', 'Shirt', 2),
  ('Tecnología', 'tecnologia', 'Laptop', 3),
  ('Hogar', 'hogar', 'Home', 4),
  ('Belleza', 'belleza', 'Sparkles', 5),
  ('Salud', 'salud', 'Heart', 6),
  ('Educación', 'educacion', 'GraduationCap', 7),
  ('Transporte', 'transporte', 'Car', 8),
  ('Eventos', 'eventos', 'PartyPopper', 9),
  ('Mascotas', 'mascotas', 'PawPrint', 10),
  ('Servicios Profesionales', 'servicios-profesionales', 'Briefcase', 11),
  ('Otros', 'otros', 'MoreHorizontal', 12);
