-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Custom enums
CREATE TYPE trust_level AS ENUM ('nuevo', 'verificado', 'confiable', 'estrella', 'elite');
CREATE TYPE listing_type AS ENUM ('producto', 'servicio');
CREATE TYPE listing_status AS ENUM ('borrador', 'disponible', 'pausado', 'agotado', 'eliminado');
CREATE TYPE delivery_mode AS ENUM ('pickup', 'envio', 'ambos');
CREATE TYPE sale_status AS ENUM ('pending_confirmation', 'completed', 'cancelled', 'expired');
CREATE TYPE dispute_status AS ENUM ('open', 'under_review', 'resolved_buyer', 'resolved_seller', 'closed');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE review_type AS ENUM ('buyer_to_seller', 'seller_to_buyer');
CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE coupon_type AS ENUM ('porcentaje', 'monto_fijo');
CREATE TYPE booking_status AS ENUM ('pendiente', 'confirmado', 'completado', 'cancelado');

-- Helper function for updated_at timestamps
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
