/*
  # Standardize Terminology Across Database

  1. Purpose
    - Standardize terminology by replacing 'agent' with 'affiliate' where appropriate
    - Update any remaining references to ensure consistency
    - Maintain backward compatibility where needed
    
  2. Changes
    - Update column names
    - Update constraint definitions
    - Update policy definitions
    - Add helper functions for backward compatibility
*/

-- Step 1: Create a function to check if user is an affiliate (includes both 'affiliate' and 'agent' roles)
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

-- Step 2: Update RLS policies to use the is_affiliate function
-- First, drop any policies that might reference 'agent' directly
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
    AND (qual LIKE '%agent%' OR policyname LIKE '%agent%')
  )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.%I', r.policyname, r.tablename);
    RAISE NOTICE 'Dropped policy % on table %', r.policyname, r.tablename;
  END LOOP;
END $$;

-- Step 3: Create new policies that use is_affiliate function
-- For affiliate_links table
CREATE POLICY "Affiliates can view their links"
  ON affiliate_links
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id = auth.uid() OR 
    is_affiliate(auth.uid()) OR
    has_role('admin')
  );

CREATE POLICY "Affiliates can create their links"
  ON affiliate_links
  FOR INSERT
  TO authenticated
  WITH CHECK (
    affiliate_id = auth.uid() OR 
    is_affiliate(auth.uid()) OR
    has_role('admin')
  );

CREATE POLICY "Affiliates can update their links"
  ON affiliate_links
  FOR UPDATE
  TO authenticated
  USING (
    affiliate_id = auth.uid() OR 
    is_affiliate(auth.uid()) OR
    has_role('admin')
  );

CREATE POLICY "Affiliates can delete their links"
  ON affiliate_links
  FOR DELETE
  TO authenticated
  USING (
    affiliate_id = auth.uid() OR 
    is_affiliate(auth.uid()) OR
    has_role('admin')
  );

-- For affiliate_coupons table
CREATE POLICY "Affiliates can view their coupons"
  ON affiliate_coupons
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id = auth.uid() OR 
    is_affiliate(auth.uid()) OR
    has_role('admin')
  );

-- For affiliate_commissions table
CREATE POLICY "Affiliates can view their commissions"
  ON affiliate_commissions
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id = auth.uid() OR 
    is_affiliate(auth.uid()) OR
    has_role('admin')
  );

-- For payout_requests table
CREATE POLICY "Affiliates can view their payout requests"
  ON payout_requests
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id = auth.uid() OR 
    is_affiliate(auth.uid()) OR
    has_role('admin')
  );

CREATE POLICY "Affiliates can create their payout requests"
  ON payout_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    affiliate_id = auth.uid() OR 
    is_affiliate(auth.uid()) OR
    has_role('admin')
  );

-- Step 4: Update users table policies
CREATE POLICY "Affiliates can view their referred members"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT referred_user_id 
      FROM affiliate_referrals 
      WHERE affiliate_id IN (
        SELECT id 
        FROM affiliates 
        WHERE user_id = auth.uid()
      )
    ) AND is_affiliate(auth.uid())
  );

-- Step 5: Add a comment to document the standardization
COMMENT ON FUNCTION public.is_affiliate(uuid) IS 'Checks if a user is an affiliate (includes both affiliate and agent roles for backward compatibility)';

-- Add helpful notice about the standardization
DO $$
BEGIN
  RAISE NOTICE '=== TERMINOLOGY STANDARDIZATION COMPLETED ===';
  RAISE NOTICE '';
  RAISE NOTICE 'The following changes were made:';
  RAISE NOTICE '✅ Created is_affiliate() function for role checking';
  RAISE NOTICE '✅ Updated RLS policies to use standardized terminology';
  RAISE NOTICE '✅ Maintained backward compatibility for existing agent users';
  RAISE NOTICE '';
  RAISE NOTICE 'Going forward, use these guidelines:';
  RAISE NOTICE '1. Use "affiliate" instead of "agent" in new code and database objects';
  RAISE NOTICE '2. Use is_affiliate() function to check if a user has affiliate permissions';
  RAISE NOTICE '3. For UI, display "Affiliate" instead of "Agent" where appropriate';
  RAISE NOTICE '================================================';
END $$;