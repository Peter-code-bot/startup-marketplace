-- Auto-update trust level based on trust_points
CREATE OR REPLACE FUNCTION update_trust_level_from_points()
RETURNS TRIGGER AS $$
DECLARE
  new_level trust_level;
  old_level trust_level;
BEGIN
  old_level := OLD.trust_level;

  new_level := CASE
    WHEN NEW.trust_points >= 1000 THEN 'elite'::trust_level
    WHEN NEW.trust_points >= 500 THEN 'estrella'::trust_level
    WHEN NEW.trust_points >= 200 THEN 'confiable'::trust_level
    WHEN NEW.trust_points >= 50 THEN 'verificado'::trust_level
    ELSE 'nuevo'::trust_level
  END;

  IF new_level != old_level THEN
    NEW.trust_level := new_level;

    -- Create notification on level up (only when going up)
    IF new_level > old_level THEN
      INSERT INTO notifications (user_id, tipo, titulo, mensaje, data)
      VALUES (
        NEW.id,
        'trust_upgrade',
        '¡Subiste de nivel!',
        'Ahora eres ' || CASE new_level
          WHEN 'verificado' THEN 'Verificado 🔵'
          WHEN 'confiable' THEN 'Confiable 🟢'
          WHEN 'estrella' THEN 'Estrella ⭐'
          WHEN 'elite' THEN 'Élite 🏆'
          ELSE ''
        END,
        jsonb_build_object('old_level', old_level::TEXT, 'new_level', new_level::TEXT)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_update_trust_level
  BEFORE UPDATE OF trust_points ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_trust_level_from_points();

-- Deduct trust points on sale cancellation
CREATE OR REPLACE FUNCTION handle_sale_cancellation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status = 'pending_confirmation' AND NEW.cancelled_by IS NOT NULL THEN
    IF NEW.cancelled_by = NEW.seller_id THEN
      UPDATE profiles SET trust_points = GREATEST(0, trust_points - 5) WHERE id = NEW.seller_id;
    ELSIF NEW.cancelled_by = NEW.buyer_id THEN
      UPDATE profiles SET trust_points = GREATEST(0, trust_points - 3) WHERE id = NEW.buyer_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_sale_cancellation
  AFTER UPDATE OF status ON sale_confirmations
  FOR EACH ROW
  WHEN (NEW.status = 'cancelled')
  EXECUTE FUNCTION handle_sale_cancellation();
