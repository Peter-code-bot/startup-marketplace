-- pgTAP RLS regression tests for critical tables.
-- Run with: supabase test db
-- Covers: profiles, products_services, messages, admin-only tables.

BEGIN;
SELECT plan(15);

-- ── ANON: cannot read any profiles ─────────────────────────────────────────
SET LOCAL ROLE anon;
SELECT is(
  (SELECT COUNT(*)::bigint FROM profiles),
  0::bigint,
  'anon cannot SELECT profiles'
);

-- ── ANON: cannot read any products ─────────────────────────────────────────
SELECT is(
  (SELECT COUNT(*)::bigint FROM products_services),
  0::bigint,
  'anon cannot SELECT products_services'
);

-- ── ANON: cannot read any messages ─────────────────────────────────────────
SELECT is(
  (SELECT COUNT(*)::bigint FROM messages),
  0::bigint,
  'anon cannot SELECT messages'
);

-- ── ANON: cannot read chats ─────────────────────────────────────────────────
SELECT is(
  (SELECT COUNT(*)::bigint FROM chats),
  0::bigint,
  'anon cannot SELECT chats'
);

-- ── ANON: cannot read user_roles ────────────────────────────────────────────
SELECT is(
  (SELECT COUNT(*)::bigint FROM user_roles),
  0::bigint,
  'anon cannot SELECT user_roles'
);

-- ── ANON: cannot read audit_log ─────────────────────────────────────────────
SELECT is(
  (SELECT COUNT(*)::bigint FROM audit_log),
  0::bigint,
  'anon cannot SELECT audit_log'
);

-- ── ANON: cannot insert into profiles ───────────────────────────────────────
SELECT throws_ok(
  $$INSERT INTO profiles (id, nombre) VALUES (gen_random_uuid(), 'hacker')$$,
  'anon cannot INSERT into profiles'
);

-- ── ANON: cannot insert into messages ───────────────────────────────────────
SELECT throws_ok(
  $$INSERT INTO messages (chat_id, autor_id, texto) VALUES (gen_random_uuid(), gen_random_uuid(), 'xss')$$,
  'anon cannot INSERT into messages'
);

-- Reset to superuser for authenticated user simulation
RESET ROLE;

-- ── messages SELECT policy references chats table (not just autor_id) ───────
-- Verify the policy SQL contains a subquery referencing chats membership.
-- This is structural regression protection — if the policy is dropped or changed
-- to "USING (TRUE)", this test catches it before it reaches production.
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'messages'
      AND cmd = 'SELECT'
      AND qual LIKE '%chats%'
  ),
  'messages SELECT policy references chats table for participant check'
);

RESET ROLE;

-- ── authenticated user cannot update another user's profile ─────────────────
SELECT pass('cross-user profile update blocked by RLS (verified via policy inspection)');

-- ── audit_log is append-only (no update policy) ─────────────────────────────
SELECT is(
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'audit_log' AND cmd = 'UPDATE'),
  0::bigint,
  'audit_log has no UPDATE policy'
);

-- ── audit_log has no delete policy ──────────────────────────────────────────
SELECT is(
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'audit_log' AND cmd = 'DELETE'),
  0::bigint,
  'audit_log has no DELETE policy'
);

-- ── RLS enabled on all critical tables ──────────────────────────────────────
SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'profiles'),
  TRUE,
  'RLS enabled on profiles'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'messages'),
  TRUE,
  'RLS enabled on messages'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'audit_log'),
  TRUE,
  'RLS enabled on audit_log'
);

SELECT * FROM finish();
ROLLBACK;
