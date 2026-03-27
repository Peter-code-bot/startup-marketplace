-- Fix signup: add INSERT policy + recreate triggers with proper SECURITY DEFINER

-- 1. Add INSERT policy on profiles (needed for signup trigger)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Allow trigger insert profiles'
  ) THEN
    CREATE POLICY "Allow trigger insert profiles"
      ON profiles FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- 2. Recreate handle_new_user with proper SECURITY DEFINER + search_path
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
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Recreate generate_user_id with proper SECURITY DEFINER + search_path
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Ensure triggers exist and are correctly attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS set_user_id ON profiles;
CREATE TRIGGER set_user_id
  BEFORE INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.user_id IS NULL)
  EXECUTE FUNCTION generate_user_id();

-- 5. Add INSERT policy for trust_level_verification
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'trust_level_verification' AND policyname = 'Users can create own verification'
  ) THEN
    CREATE POLICY "Users can create own verification"
      ON trust_level_verification FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
