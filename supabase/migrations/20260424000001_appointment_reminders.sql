-- Reminder flags for appointment notifications
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS reminder_1d_sent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_1h_sent BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_appointments_reminder_pending
  ON appointments (appointment_date, appointment_start)
  WHERE reminder_1d_sent = false OR reminder_1h_sent = false;
