-- Revoke EXECUTE on the new-user trigger function from regular users.
-- It is only invoked by the auth trigger and never needs to be called by clients.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- Drop the plaintext password columns. All logins now go through Supabase Auth.
ALTER TABLE public.staff DROP COLUMN IF EXISTS "Login Password";
ALTER TABLE public.students DROP COLUMN IF EXISTS parent_password;