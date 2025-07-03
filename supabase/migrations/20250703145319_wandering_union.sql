/*
  # Fix Roles Foreign Key Constraint Issue

  1. Problem
    - Insert or update on table "roles" violates foreign key constraint "roles_id_fkey"
    - This happens when trying to add a role for a user that doesn't exist in auth.users
    
  2. Solution
    - Create a safer version of the populate_missing_roles function
    - Only insert roles for users that actually exist in auth.users
    - Add better error handling and reporting
*/

-- Step 1: Create a safer function to add roles for existing users
CREATE OR REPLACE FUNCTION populate_missing_roles_safely()
RETURNS TABLE (
  user_id uuid,
  email text,
  status text,
  message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  auth_user RECORD;
  default_role text;
  success_count int := 0;
  error_count int := 0;
BEGIN
  -- Loop through all users in auth.users
  FOR auth_user IN (
    SELECT id, email, raw_user_meta_data, raw_app_meta_data
    FROM auth.users
  ) LOOP
    BEGIN
      -- Check if user already has a role
      IF EXISTS (SELECT 1 FROM public.roles WHERE id = auth_user.id) THEN
        -- Skip users that already have roles
        user_id := auth_user.id;
        email := auth_user.email;
        status := 'SKIPPED';
        message := 'User already has a role';
        RETURN NEXT;
        CONTINUE;
      END IF;
      
      -- Determine the appropriate role
      IF auth_user.raw_user_meta_data IS NOT NULL AND auth_user.raw_user_meta_data ? 'role' THEN
        default_role := auth_user.raw_user_meta_data->>'role';
      ELSIF auth_user.raw_app_meta_data IS NOT NULL AND auth_user.raw_app_meta_data ? 'role' THEN
        default_role := auth_user.raw_app_meta_data->>'role';
      ELSE
        -- Default to 'member' if no role is specified
        default_role := 'member';
      END IF;
      
      -- Validate role
      IF default_role NOT IN ('admin', 'affiliate', 'member', 'advisor', 'agent') THEN
        default_role := 'member';
      END IF;

      -- Insert into roles table
      INSERT INTO public.roles (id, role, created_at, updated_at)
      VALUES (auth_user.id, default_role, now(), now())
      ON CONFLICT (id) DO NOTHING;
      
      -- Update app_metadata to ensure JWT claims are correct
      UPDATE auth.users
      SET raw_app_meta_data = 
        CASE 
          WHEN raw_app_meta_data IS NULL THEN 
            jsonb_build_object('role', default_role)
          ELSE
            jsonb_set(raw_app_meta_data, '{role}', to_jsonb(default_role))
        END
      WHERE id = auth_user.id;
      
      -- If role is agent, also set affiliate_access
      IF default_role = 'agent' THEN
        UPDATE auth.users
        SET raw_app_meta_data = 
          jsonb_set(
            COALESCE(raw_app_meta_data, '{}'::jsonb),
            '{affiliate_access}',
            'true'::jsonb
          )
        WHERE id = auth_user.id;
      END IF;
      
      success_count := success_count + 1;
      
      -- Return success result
      user_id := auth_user.id;
      email := auth_user.email;
      status := 'SUCCESS';
      message := 'Role added: ' || default_role;
      RETURN NEXT;
      
    EXCEPTION WHEN OTHERS THEN
      -- Return error result
      user_id := auth_user.id;
      email := auth_user.email;
      status := 'ERROR';
      message := SQLERRM;
      error_count := error_count + 1;
      RETURN NEXT;
    END;
  END LOOP;
  
  -- Return summary
  user_id := NULL;
  email := NULL;
  status := 'SUMMARY';
  message := 'Processed ' || (success_count + error_count)::text || ' users. ' || 
             'Success: ' || success_count::text || ', ' ||
             'Errors: ' || error_count::text;
  RETURN NEXT;
END;
$$;

-- Step 2: Create a safer function to ensure users table entries exist
CREATE OR REPLACE FUNCTION ensure_users_table_entries_safely()
RETURNS TABLE (
  user_id uuid,
  email text,
  status text,
  message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  auth_user RECORD;
  success_count int := 0;
  error_count int := 0;
BEGIN
  -- Loop through all users in auth.users
  FOR auth_user IN (
    SELECT id, email, raw_user_meta_data
    FROM auth.users
  ) LOOP
    BEGIN
      -- Check if user already has a users table entry
      IF EXISTS (SELECT 1 FROM public.users WHERE id = auth_user.id) THEN
        -- Skip users that already have entries
        user_id := auth_user.id;
        email := auth_user.email;
        status := 'SKIPPED';
        message := 'User already has a users table entry';
        RETURN NEXT;
        CONTINUE;
      END IF;
      
      -- Get role from roles table or default to member
      DECLARE
        user_role text;
      BEGIN
        SELECT role INTO user_role FROM public.roles WHERE id = auth_user.id;
        IF user_role IS NULL THEN
          user_role := COALESCE(auth_user.raw_user_meta_data->>'role', 'member');
        END IF;
        
        -- Insert into users table
        INSERT INTO public.users (
          id, 
          email, 
          full_name, 
          role, 
          is_active, 
          created_at, 
          updated_at
        )
        VALUES (
          auth_user.id,
          auth_user.email,
          COALESCE(auth_user.raw_user_meta_data->>'full_name', 'User'),
          user_role,
          true,
          now(),
          now()
        )
        ON CONFLICT (id) DO NOTHING;
        
        success_count := success_count + 1;
        
        -- Return success result
        user_id := auth_user.id;
        email := auth_user.email;
        status := 'SUCCESS';
        message := 'Users table entry added with role: ' || user_role;
        RETURN NEXT;
      END;
    EXCEPTION WHEN OTHERS THEN
      -- Return error result
      user_id := auth_user.id;
      email := auth_user.email;
      status := 'ERROR';
      message := SQLERRM;
      error_count := error_count + 1;
      RETURN NEXT;
    END;
  END LOOP;
  
  -- Return summary
  user_id := NULL;
  email := NULL;
  status := 'SUMMARY';
  message := 'Processed ' || (success_count + error_count)::text || ' users. ' || 
             'Success: ' || success_count::text || ', ' ||
             'Errors: ' || error_count::text;
  RETURN NEXT;
END;
$$;

-- Step 3: Create a function to fix the roles table
CREATE OR REPLACE FUNCTION fix_roles_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  result_record RECORD;
  success_count int := 0;
  error_count int := 0;
BEGIN
  RAISE NOTICE 'Starting roles table fix...';
  
  -- First, populate missing roles
  FOR result_record IN (SELECT * FROM populate_missing_roles_safely()) LOOP
    IF result_record.status = 'SUCCESS' THEN
      success_count := success_count + 1;
    ELSIF result_record.status = 'ERROR' THEN
      error_count := error_count + 1;
      RAISE NOTICE 'Error for user %: %', result_record.email, result_record.message;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Roles table fix completed. Success: %, Errors: %', success_count, error_count;
  
  -- Reset counters
  success_count := 0;
  error_count := 0;
  
  -- Then, ensure users table entries
  FOR result_record IN (SELECT * FROM ensure_users_table_entries_safely()) LOOP
    IF result_record.status = 'SUCCESS' THEN
      success_count := success_count + 1;
    ELSIF result_record.status = 'ERROR' THEN
      error_count := error_count + 1;
      RAISE NOTICE 'Error for user %: %', result_record.email, result_record.message;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Users table fix completed. Success: %, Errors: %', success_count, error_count;
END;
$$;

-- Step 4: Run the fix
SELECT fix_roles_table();

-- Step 5: Create a function to check if user is an affiliate
CREATE OR REPLACE FUNCTION public.is_affiliate(user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _user_id uuid;
  _user_role text;
  _app_metadata jsonb;
BEGIN
  -- Use provided user_id or current user
  _user_id := COALESCE(user_id, auth.uid());
  
  -- Get user role from roles table
  SELECT role INTO _user_role FROM public.roles WHERE id = _user_id;
  
  -- Check if user has affiliate or agent role
  IF _user_role IN ('affiliate', 'agent') THEN
    RETURN true;
  END IF;
  
  -- Check app_metadata for affiliate_access flag
  SELECT raw_app_metadata INTO _app_metadata FROM auth.users WHERE id = _user_id;
  
  IF _app_metadata IS NOT NULL AND _app_metadata->>'affiliate_access' = 'true' THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Step 6: Grant execute permissions
GRANT EXECUTE ON FUNCTION populate_missing_roles_safely() TO service_role;
GRANT EXECUTE ON FUNCTION ensure_users_table_entries_safely() TO service_role;
GRANT EXECUTE ON FUNCTION fix_roles_table() TO service_role;
GRANT EXECUTE ON FUNCTION public.is_affiliate(uuid) TO authenticated, service_role;

-- Add a comment to document the function
COMMENT ON FUNCTION public.is_affiliate(uuid) IS 'Checks if a user has affiliate permissions (includes both affiliate and agent roles)';

-- Step 7: Run a final health check
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '=== FINAL ROLE SYSTEM HEALTH CHECK ===';
  RAISE NOTICE '';
  
  FOR r IN (SELECT * FROM check_role_system_health()) LOOP
    RAISE NOTICE '% - %: %', r.status, r.check_name, r.details;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Role system health check complete.';
  RAISE NOTICE '================================';
END $$;