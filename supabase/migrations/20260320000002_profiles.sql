-- Profiles table (auto-created on auth signup via trigger)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre TEXT NOT NULL DEFAULT '',
  display_name TEXT,
  foto TEXT,
  bio TEXT,
  telefono TEXT,
  ubicacion TEXT,
  ubicacion_lat DOUBLE PRECISION,
  ubicacion_lng DOUBLE PRECISION,

  -- Seller fields
  es_vendedor BOOLEAN DEFAULT FALSE,
  nombre_negocio TEXT,
  descripcion_negocio TEXT,
  categoria_negocio TEXT,
  metodos_pago_aceptados TEXT,

  -- Trust system
  trust_level trust_level DEFAULT 'nuevo',
  trust_points INTEGER DEFAULT 0,

  -- Stats (denormalized for performance)
  total_sales INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0,
  average_rating_as_seller NUMERIC(3,2) DEFAULT 0,
  average_rating_as_buyer NUMERIC(3,2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  reviews_count_as_seller INTEGER DEFAULT 0,
  reviews_count_as_buyer INTEGER DEFAULT 0,

  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,

  -- Tax (optional)
  rfc TEXT,

  -- Searchable short ID
  user_id TEXT UNIQUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate 8-char user_id
CREATE OR REPLACE FUNCTION generate_user_id()
RETURNS TRIGGER AS $$
DECLARE
  new_id TEXT;
  exists_already BOOLEAN;
BEGIN
  LOOP
    new_id := 'U' || LPAD(FLOOR(RANDOM() * 10000000)::TEXT, 7, '0');
    SELECT EXISTS(SELECT 1 FROM profiles WHERE user_id = new_id) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  NEW.user_id := new_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_user_id
  BEFORE INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.user_id IS NULL)
  EXECUTE FUNCTION generate_user_id();

-- Auto-create profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nombre, foto)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Updated_at trigger
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Indexes
CREATE INDEX idx_profiles_es_vendedor ON profiles(es_vendedor) WHERE es_vendedor = TRUE;
CREATE INDEX idx_profiles_trust_level ON profiles(trust_level);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow trigger insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User roles (admin, moderator, user)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

CREATE INDEX idx_roles_user ON user_roles(user_id);
CREATE INDEX idx_roles_role ON user_roles(role);

-- Helper function to check role
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage roles"
  ON user_roles FOR ALL
  USING (has_role(auth.uid(), 'admin'));
