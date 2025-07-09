/*
  # Standardize Roles to Affiliate Only

  1. Purpose
    - Remove 'agent' and 'advisor' roles from the system
    - Convert existing 'agent' users to 'affiliate' role
    - Update constraints and policies to reflect the simplified role system
    
  2. Changes
    - Update users table role constraint
    - Update roles table role constraint
    - Convert existing users with 'agent' or 'advisor' roles
    - Update RLS policies to use only 'affiliate' role
*/

-- Step 1: Update the users table role constraint
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_role_check CHECK (
  role = ANY (ARRAY['member'::text, 'admin'::text, 'affiliate'::text])
);

-- Step 2: Update the roles table role constraint
ALTER TABLE public.roles 
DROP CONSTRAINT IF EXISTS roles_role_check;

ALTER TABLE public.roles 
ADD CONSTRAINT roles_role_check CHECK (
  role = ANY (ARRAY['admin'::text, 'affiliate'::text, 'member'::text])
);

-- Step 3: Convert existing users with 'agent' or 'advisor' roles to 'affiliate'
UPDATE public.users
SET role = 'affiliate'
WHERE role IN ('agent', 'advisor');

UPDATE public.roles
SET role = 'affiliate'
WHERE role IN ('agent', 'advisor');

-- Step 4: Update app_metadata in auth.users
UPDATE auth.users
SET raw_app_metadata = 
  CASE 
    WHEN raw_app_metadata IS NULL THEN 
      jsonb_build_object('role', 'affiliate')
    ELSE
      jsonb_set(raw_app_metadata, '{role}', to_jsonb('affiliate'))
  END
WHERE 
  raw_app_metadata->>'role' IN ('agent', 'advisor');

-- Step 5: Create a function to check if user is an affiliate (simplified)
CREATE OR REPLACE FUNCTION public.is_affiliate(user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _user_id uuid;
  _user_role text;
BEGIN
  -- Use provided user_id or current user
  _user_id := COALESCE(user_id, auth.uid());
  
  -- Get user role from roles table
  SELECT role INTO _user_role FROM public.roles WHERE id = _user_id;
  
  -- Check if user has affiliate role
  RETURN _user_role = 'affiliate';
END;
$$;

-- Step 6: Update RLS policies to use only 'affiliate' role
-- For affiliate_links table
DROP POLICY IF EXISTS "Affiliates can view their links" ON affiliate_links;
CREATE POLICY "Affiliates can view their links"
  ON affiliate_links
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id = auth.uid() OR 
    has_role('affiliate') OR
    has_role('admin')
  );

-- For affiliate_coupons table
DROP POLICY IF EXISTS "Affiliates can view their coupons" ON affiliate_coupons;
CREATE POLICY "Affiliates can view their coupons"
  ON affiliate_coupons
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id = auth.uid() OR 
    has_role('affiliate') OR
    has_role('admin')
  );

-- For affiliate_commissions table
DROP POLICY IF EXISTS "Affiliates can view their commissions" ON affiliate_commissions;
CREATE POLICY "Affiliates can view their commissions"
  ON affiliate_commissions
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id = auth.uid() OR 
    has_role('affiliate') OR
    has_role('admin')
  );

-- For payout_requests table
DROP POLICY IF EXISTS "Affiliates can view their payout requests" ON payout_requests;
CREATE POLICY "Affiliates can view their payout requests"
  ON payout_requests
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id = auth.uid() OR 
    has_role('affiliate') OR
    has_role('admin')
  );

-- Step 7: Add a comment to document the standardization
COMMENT ON FUNCTION public.is_affiliate(uuid) IS 'Checks if a user has affiliate role';

-- Add helpful notice about the standardization
DO $$
BEGIN
  RAISE NOTICE '=== ROLE STANDARDIZATION COMPLETED ===';
  RAISE NOTICE '';
  RAISE NOTICE 'The following changes were made:';
  RAISE NOTICE '✅ Removed agent and advisor roles from constraints';
  RAISE NOTICE '✅ Converted existing agent/advisor users to affiliate role';
  RAISE NOTICE '✅ Updated RLS policies to use only affiliate role';
  RAISE NOTICE '✅ Simplified is_affiliate() function';
  RAISE NOTICE '';
  RAISE NOTICE 'Going forward, use these guidelines:';
  RAISE NOTICE '1. Use only "affiliate" role for affiliate users';
  RAISE NOTICE '2. Use has_role("affiliate") for permission checks';
  RAISE NOTICE '3. For UI, display "Affiliate" consistently';
  RAISE NOTICE '================================================';
END $$;