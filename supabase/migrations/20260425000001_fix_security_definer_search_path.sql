-- Fix search_path on SECURITY DEFINER functions to prevent search_path injection.
-- Functions defined before 20260327000002 were missing SET search_path.
-- generate_user_id() and handle_new_user() were already fixed in 20260327000002.

ALTER FUNCTION public.has_role(uuid, app_role)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.get_or_create_chat(uuid, uuid, uuid)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.mark_messages_as_read(uuid, uuid)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.make_admin(text)
  SET search_path = public, pg_temp;
