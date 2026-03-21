-- Seed data for VICINO marketplace
-- Note: Profiles are auto-created via trigger when auth users are created.
-- This seed assumes you create test users via Supabase Auth first.
-- Categories are already seeded in migration 003.

-- To test locally, create users via Supabase Studio or the Auth API,
-- then run the following to set up test data:

-- Example: After creating 5 test users, update their profiles:
-- UPDATE profiles SET nombre = 'María García', es_vendedor = true, nombre_negocio = 'Tamales Doña María',
--   descripcion_negocio = 'Los mejores tamales de Puebla', categoria_negocio = 'Comida',
--   metodos_pago_aceptados = 'Efectivo, transferencia SPEI', trust_level = 'nuevo', trust_points = 10
--   WHERE email = 'maria@test.com';

-- For development, the categories are already seeded in the migration.
-- Additional test data should be created via the UI or Supabase Studio.
