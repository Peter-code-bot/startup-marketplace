-- Product variants (size, color, etc.)
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID NOT NULL REFERENCES products_services(id) ON DELETE CASCADE,
  sku TEXT,
  talla TEXT,
  color TEXT,
  stock INTEGER DEFAULT 0,
  precio_override DECIMAL(10,2),
  peso NUMERIC,
  largo NUMERIC,
  ancho NUMERIC,
  alto NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX idx_variants_producto ON product_variants(producto_id);

-- RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view variants"
  ON product_variants FOR SELECT
  USING (TRUE);

CREATE POLICY "Sellers can manage own variants"
  ON product_variants FOR ALL
  USING (EXISTS (
    SELECT 1 FROM products_services
    WHERE products_services.id = product_variants.producto_id
    AND products_services.creador_id = auth.uid()
  ));
