-- Products and Services listings
CREATE TABLE products_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creador_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  titulo_en TEXT,
  descripcion TEXT NOT NULL,
  descripcion_en TEXT,
  slug TEXT UNIQUE,
  precio DECIMAL(10,2) NOT NULL CHECK (precio > 0),
  tipo listing_type NOT NULL DEFAULT 'producto',
  categoria TEXT NOT NULL,
  categoria_id UUID REFERENCES categories(id),
  imagen_principal TEXT,
  galeria_imagenes TEXT[] DEFAULT '{}',
  ubicacion TEXT,
  ubicacion_geo geography(POINT, 4326),
  disponibilidad TEXT,
  tipo_entrega delivery_mode DEFAULT 'pickup',
  estatus listing_status DEFAULT 'disponible',

  -- Stats (denormalized)
  ventas_count INTEGER DEFAULT 0,
  vistas_count INTEGER DEFAULT 0,
  favoritos_count INTEGER DEFAULT 0,

  -- Full-text search vector
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('spanish', COALESCE(titulo, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(descripcion, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(categoria, '')), 'C')
  ) STORED,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate slug
CREATE OR REPLACE FUNCTION generate_product_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  suffix TEXT;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := LOWER(REGEXP_REPLACE(
      TRANSLATE(NEW.titulo, 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN'),
      '[^a-z0-9\s-]', '', 'g'
    ));
    base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
    base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');
    base_slug := TRIM(BOTH '-' FROM base_slug);
    suffix := SUBSTR(gen_random_uuid()::TEXT, 1, 6);
    final_slug := base_slug || '-' || suffix;
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_product_slug
  BEFORE INSERT ON products_services
  FOR EACH ROW EXECUTE FUNCTION generate_product_slug();

-- Updated_at trigger
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products_services
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Indexes
CREATE INDEX idx_products_creador ON products_services(creador_id);
CREATE INDEX idx_products_estatus ON products_services(estatus);
CREATE INDEX idx_products_categoria ON products_services(categoria);
CREATE INDEX idx_products_tipo ON products_services(tipo);
CREATE INDEX idx_products_search ON products_services USING GIN(search_vector);
CREATE INDEX idx_products_location ON products_services USING GIST(ubicacion_geo);
CREATE INDEX idx_products_slug ON products_services(slug);
CREATE INDEX idx_products_created ON products_services(created_at DESC);
CREATE INDEX idx_products_precio ON products_services(precio);

-- RLS
ALTER TABLE products_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available products"
  ON products_services FOR SELECT
  USING (estatus = 'disponible' OR creador_id = auth.uid());

CREATE POLICY "Sellers can create products"
  ON products_services FOR INSERT
  WITH CHECK (auth.uid() = creador_id);

CREATE POLICY "Sellers can update own products"
  ON products_services FOR UPDATE
  USING (auth.uid() = creador_id)
  WITH CHECK (auth.uid() = creador_id);

CREATE POLICY "Sellers can delete own products"
  ON products_services FOR DELETE
  USING (auth.uid() = creador_id);
