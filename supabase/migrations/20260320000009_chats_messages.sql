-- Chats (one per buyer-seller pair)
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comprador_id UUID NOT NULL REFERENCES profiles(id),
  vendedor_id UUID NOT NULL REFERENCES profiles(id),
  ultimo_producto_id UUID REFERENCES products_services(id),
  no_leidos_comprador INTEGER DEFAULT 0,
  no_leidos_vendedor INTEGER DEFAULT 0,
  oculto_para_comprador BOOLEAN DEFAULT FALSE,
  oculto_para_vendedor BOOLEAN DEFAULT FALSE,
  deleted_at_comprador TIMESTAMPTZ,
  deleted_at_vendedor TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- One chat per buyer-seller pair
CREATE UNIQUE INDEX idx_chats_pair ON chats(
  LEAST(comprador_id, vendedor_id),
  GREATEST(comprador_id, vendedor_id)
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  publicacion_id UUID REFERENCES products_services(id) ON DELETE SET NULL,
  leido_por_comprador BOOLEAN DEFAULT FALSE,
  leido_por_vendedor BOOLEAN DEFAULT FALSE,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key from sale_confirmations to chats (now that chats exists)
ALTER TABLE sale_confirmations
  ADD CONSTRAINT fk_sale_chat FOREIGN KEY (chat_id) REFERENCES chats(id);

-- Get or create chat (idempotent)
CREATE OR REPLACE FUNCTION get_or_create_chat(
  p_comprador_id UUID,
  p_vendedor_id UUID,
  p_producto_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  chat_id UUID;
BEGIN
  SELECT id INTO chat_id
  FROM chats
  WHERE (comprador_id = p_comprador_id AND vendedor_id = p_vendedor_id)
     OR (comprador_id = p_vendedor_id AND vendedor_id = p_comprador_id);

  IF chat_id IS NULL THEN
    INSERT INTO chats (comprador_id, vendedor_id, ultimo_producto_id)
    VALUES (p_comprador_id, p_vendedor_id, p_producto_id)
    RETURNING id INTO chat_id;
  ELSE
    IF p_producto_id IS NOT NULL THEN
      UPDATE chats SET ultimo_producto_id = p_producto_id, updated_at = NOW()
      WHERE id = chat_id;
    END IF;
  END IF;

  -- Unhide chat for both users
  UPDATE chats SET
    oculto_para_comprador = FALSE,
    oculto_para_vendedor = FALSE
  WHERE id = chat_id;

  RETURN chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment unread count on new message
CREATE OR REPLACE FUNCTION increment_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.autor_id = (SELECT comprador_id FROM chats WHERE id = NEW.chat_id) THEN
    UPDATE chats SET no_leidos_vendedor = no_leidos_vendedor + 1, updated_at = NOW()
    WHERE id = NEW.chat_id;
    NEW.leido_por_comprador := TRUE;
  ELSE
    UPDATE chats SET no_leidos_comprador = no_leidos_comprador + 1, updated_at = NOW()
    WHERE id = NEW.chat_id;
    NEW.leido_por_vendedor := TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_message
  BEFORE INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION increment_unread_count();

-- Mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(p_chat_id UUID, p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  is_buyer BOOLEAN;
BEGIN
  SELECT (comprador_id = p_user_id) INTO is_buyer FROM chats WHERE id = p_chat_id;

  IF is_buyer THEN
    UPDATE messages SET leido_por_comprador = TRUE
    WHERE chat_id = p_chat_id AND leido_por_comprador = FALSE;
    UPDATE chats SET no_leidos_comprador = 0 WHERE id = p_chat_id;
  ELSE
    UPDATE messages SET leido_por_vendedor = TRUE
    WHERE chat_id = p_chat_id AND leido_por_vendedor = FALSE;
    UPDATE chats SET no_leidos_vendedor = 0 WHERE id = p_chat_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Unhide chat on new message
CREATE OR REPLACE FUNCTION unhide_chat_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chats SET
    oculto_para_comprador = FALSE,
    oculto_para_vendedor = FALSE,
    updated_at = NOW()
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER unhide_on_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION unhide_chat_on_new_message();

-- Updated_at trigger for chats
CREATE TRIGGER chats_updated_at
  BEFORE UPDATE ON chats
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Indexes
CREATE INDEX idx_chats_comprador ON chats(comprador_id);
CREATE INDEX idx_chats_vendedor ON chats(vendedor_id);
CREATE INDEX idx_chats_updated ON chats(updated_at DESC);
CREATE INDEX idx_messages_chat ON messages(chat_id, created_at DESC);
CREATE INDEX idx_messages_autor ON messages(autor_id);

-- RLS for chats
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view own chats"
  ON chats FOR SELECT
  USING (auth.uid() = comprador_id OR auth.uid() = vendedor_id);

CREATE POLICY "Authenticated users can create chats"
  ON chats FOR INSERT
  WITH CHECK (auth.uid() = comprador_id OR auth.uid() = vendedor_id);

CREATE POLICY "Participants can update own chats"
  ON chats FOR UPDATE
  USING (auth.uid() = comprador_id OR auth.uid() = vendedor_id);

-- RLS for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages"
  ON messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM chats
    WHERE chats.id = messages.chat_id
    AND (chats.comprador_id = auth.uid() OR chats.vendedor_id = auth.uid())
  ));

CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = autor_id
    AND EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_id
      AND (chats.comprador_id = auth.uid() OR chats.vendedor_id = auth.uid())
    )
  );

-- Enable Realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chats;
