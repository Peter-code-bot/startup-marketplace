-- Fix: generate_user_id() needs SECURITY DEFINER to bypass RLS
-- when called from handle_new_user() trigger during auth signup
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
