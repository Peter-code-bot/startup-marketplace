-- Admin action audit log — append-only, no UPDATE/DELETE policies.
-- Realtime REPLICA IDENTITY FULL on chat tables so DELETE events include old row data.

-- ── audit_log table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_read_audit" ON audit_log
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_insert_audit" ON audit_log
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- No UPDATE/DELETE — audit log is append-only

-- ── Realtime: REPLICA IDENTITY FULL ─────────────────────────────────────────
-- Required so DELETE events on Realtime channels include old row data,
-- preventing partial update delivery to subscribers.
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE chats REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;
