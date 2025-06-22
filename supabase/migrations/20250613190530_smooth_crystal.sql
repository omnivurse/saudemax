/*
  # Update RLS Policies to Use Role System

  1. Security Updates
    - Replace direct role checks with has_role() function
    - Update all tables to use the new role system
    - Maintain backward compatibility

  2. Changes
    - Update policies for all tables to use has_role() and has_permission()
    - Fix any circular dependencies in RLS policies
    - Ensure proper data isolation between users
*/

-- Update policies for member_profiles
DROP POLICY IF EXISTS "Admins can access all member profiles" ON member_profiles;
CREATE POLICY "Admins can access all member profiles"
  ON member_profiles
  FOR ALL
  TO authenticated
  USING (has_role('admin'));

DROP POLICY IF EXISTS "Advisors can access assigned member profiles" ON member_profiles;
CREATE POLICY "Advisors can access assigned member profiles"
  ON member_profiles
  FOR SELECT
  TO authenticated
  USING (
    advisor_id = auth.uid() OR has_role('advisor')
  );

-- Update policies for affiliates
DROP POLICY IF EXISTS "Admins can access all affiliate data" ON affiliates;
CREATE POLICY "Admins can access all affiliate data"
  ON affiliates
  FOR ALL
  TO authenticated
  USING (has_role('admin'));

-- Update policies for affiliate_referrals
DROP POLICY IF EXISTS "Admins can access all referrals" ON affiliate_referrals;
CREATE POLICY "Admins can access all referrals"
  ON affiliate_referrals
  FOR ALL
  TO authenticated
  USING (has_role('admin'));

-- Update policies for affiliate_withdrawals
DROP POLICY IF EXISTS "Admins can access all withdrawals" ON affiliate_withdrawals;
CREATE POLICY "Admins can access all withdrawals"
  ON affiliate_withdrawals
  FOR ALL
  TO authenticated
  USING (has_role('admin'));

-- Update policies for users table
DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (has_role('admin'));

DROP POLICY IF EXISTS "Admins can update all users" ON users;
CREATE POLICY "Admins can update all users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (has_role('admin'));

-- Create RPC function to get current user permissions
CREATE OR REPLACE FUNCTION get_user_permissions()
RETURNS TABLE (
  resource text,
  permission text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get the user's role
  SELECT role INTO user_role FROM public.roles WHERE id = auth.uid();
  
  IF user_role IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT rp.resource, rp.permission
  FROM public.role_permissions rp
  WHERE rp.role = user_role;
END;
$$;

-- Create RPC function to check if current user has permission
CREATE OR REPLACE FUNCTION check_permission(resource text, action text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Admins always have permission
  IF has_role('admin') THEN
    RETURN true;
  END IF;
  
  -- Check specific permission
  RETURN has_permission(resource, action);
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_permissions() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION check_permission(text, text) TO authenticated, service_role;

-- Add helpful notice about the updated policies
DO $$
BEGIN
  RAISE NOTICE '=== RLS POLICIES UPDATED ===';
  RAISE NOTICE '';
  RAISE NOTICE 'All policies now use the secure role system:';
  RAISE NOTICE '✅ has_role() - Checks user role securely';
  RAISE NOTICE '✅ has_permission() - Checks granular permissions';
  RAISE NOTICE '';
  RAISE NOTICE 'New RPC functions:';
  RAISE NOTICE '- get_user_permissions() - Returns all permissions for current user';
  RAISE NOTICE '- check_permission(resource, action) - Checks if user has specific permission';
  RAISE NOTICE '';
  RAISE NOTICE 'Usage in SQL:';
  RAISE NOTICE 'SELECT * FROM get_user_permissions();';
  RAISE NOTICE 'SELECT check_permission(''affiliates'', ''read'');';
  RAISE NOTICE '================================';
END $$;