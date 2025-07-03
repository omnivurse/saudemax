-- Step 1: Create a function to safely add roles for existing users
CREATE OR REPLACE FUNCTION populate_missing_roles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  auth_user RECORD;
  default_role text;
  user_count int := 0;
BEGIN
  -- Loop through all users in auth.users
  FOR auth_user IN (
    SELECT id, email, raw_user_meta_data, raw_app_meta_data
    FROM auth.users
    WHERE NOT EXISTS (
      SELECT 1 FROM public.roles WHERE id = auth.users.id
    )
  ) LOOP
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
    
    user_count := user_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Added roles for % users', user_count;
END;
$$;

-- Step 2: Create a function to ensure users table entries exist
CREATE OR REPLACE FUNCTION ensure_users_table_entries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  auth_user RECORD;
  user_count int := 0;
BEGIN
  -- Loop through all users in auth.users
  FOR auth_user IN (
    SELECT id, email, raw_user_meta_data
    FROM auth.users
    WHERE NOT EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.users.id
    )
  ) LOOP
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
      COALESCE(
        (SELECT role FROM public.roles WHERE id = auth_user.id),
        COALESCE(auth_user.raw_user_meta_data->>'role', 'member')
      ),
      true,
      now(),
      now()
    )
    ON CONFLICT (id) DO NOTHING;
    
    user_count := user_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Added users table entries for % users', user_count;
END;
$$;

-- Step 3: Execute the functions to populate missing data
SELECT populate_missing_roles();
SELECT ensure_users_table_entries();

-- Step 4: Create a function to check role system health
CREATE OR REPLACE FUNCTION check_role_system_health()
RETURNS TABLE (
  check_name text,
  status text,
  details text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Check for users without roles
  RETURN QUERY
  SELECT 
    'Users without roles' as check_name,
    CASE 
      WHEN count(*) = 0 THEN 'PASS' 
      ELSE 'FAIL' 
    END as status,
    count(*)::text || ' users found without roles' as details
  FROM 
    auth.users
  WHERE 
    NOT EXISTS (SELECT 1 FROM public.roles WHERE id = auth.users.id);

  -- Check for roles without users
  RETURN QUERY
  SELECT 
    'Roles without users' as check_name,
    CASE 
      WHEN count(*) = 0 THEN 'PASS' 
      ELSE 'WARN' 
    END as status,
    count(*)::text || ' roles found without corresponding auth users' as details
  FROM 
    public.roles
  WHERE 
    NOT EXISTS (SELECT 1 FROM auth.users WHERE id = public.roles.id);

  -- Check for users without users table entries
  RETURN QUERY
  SELECT 
    'Auth users without users table entries' as check_name,
    CASE 
      WHEN count(*) = 0 THEN 'PASS' 
      ELSE 'FAIL' 
    END as status,
    count(*)::text || ' auth users found without users table entries' as details
  FROM 
    auth.users
  WHERE 
    NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.users.id);

  -- Check for role-app_metadata mismatches
  RETURN QUERY
  SELECT 
    'Role-app_metadata mismatches' as check_name,
    CASE 
      WHEN count(*) = 0 THEN 'PASS' 
      ELSE 'WARN' 
    END as status,
    count(*)::text || ' users found with role-app_metadata mismatches' as details
  FROM 
    public.roles r
  JOIN 
    auth.users u ON r.id = u.id
  WHERE 
    u.raw_app_meta_data IS NOT NULL AND
    u.raw_app_meta_data ? 'role' AND
    r.role != u.raw_app_meta_data->>'role';
END;
$$;

-- Step 5: Run the health check and display results
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '=== ROLE SYSTEM HEALTH CHECK ===';
  RAISE NOTICE '';
  
  FOR r IN (SELECT * FROM check_role_system_health()) LOOP
    RAISE NOTICE '% - %: %', r.status, r.check_name, r.details;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Role system health check complete.';
  RAISE NOTICE 'If any checks failed, run SELECT populate_missing_roles(); and SELECT ensure_users_table_entries(); again.';
  RAISE NOTICE '================================';
END $$;

-- Step 6: Create a function to check if user is an affiliate
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
  
  IF _app_metadata->>'affiliate_access' = 'true' THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Step 7: Grant execute permissions
GRANT EXECUTE ON FUNCTION populate_missing_roles() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION ensure_users_table_entries() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION check_role_system_health() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_affiliate(uuid) TO authenticated, service_role;

-- Add a comment to document the function
COMMENT ON FUNCTION public.is_affiliate(uuid) IS 'Checks if a user is an affiliate (includes both affiliate and agent roles for backward compatibility)';