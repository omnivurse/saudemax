/*
  # Fix Role Update Trigger

  1. Problem
    - Trigger "on_role_update" for relation "roles" already exists
    - Need to safely drop and recreate the trigger

  2. Solution
    - Drop the existing trigger if it exists
    - Recreate the trigger with the correct function
    - Ensure the function exists before creating the trigger
*/

-- First, drop the existing trigger if it exists
DROP TRIGGER IF EXISTS on_role_update ON public.roles;

-- Make sure the sync_role_claim function exists
CREATE OR REPLACE FUNCTION public.sync_role_claim()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get the user's role
  SELECT role INTO user_role FROM public.roles WHERE id = NEW.id;

  -- Update auth.users.raw_app_metadata with the role
  IF user_role IS NOT NULL THEN
    UPDATE auth.users
    SET raw_app_metadata = 
      CASE 
        WHEN raw_app_metadata IS NULL THEN 
          jsonb_build_object('role', user_role)
        ELSE
          jsonb_set(raw_app_metadata, '{role}', to_jsonb(user_role))
      END
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Now recreate the trigger
CREATE TRIGGER on_role_update
  AFTER INSERT OR UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_role_claim();

-- Add helpful notice about the fix
DO $$
BEGIN
  RAISE NOTICE '=== TRIGGER FIXED ===';
  RAISE NOTICE '';
  RAISE NOTICE 'The on_role_update trigger has been successfully fixed:';
  RAISE NOTICE '✅ Dropped existing trigger';
  RAISE NOTICE '✅ Recreated sync_role_claim function';
  RAISE NOTICE '✅ Recreated trigger with proper function';
  RAISE NOTICE '';
  RAISE NOTICE 'This trigger will now properly sync user roles to JWT claims';
  RAISE NOTICE 'whenever a role is inserted or updated in the roles table.';
  RAISE NOTICE '=====================';
END $$;