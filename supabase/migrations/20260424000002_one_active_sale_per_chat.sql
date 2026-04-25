-- Only one active sale confirmation per chat at a time.
-- Completed/cancelled/expired can coexist with new ones.
CREATE UNIQUE INDEX IF NOT EXISTS one_active_sale_per_chat
ON sale_confirmations (chat_id)
WHERE status = 'pending_confirmation';
