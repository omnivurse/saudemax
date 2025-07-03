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

-- Step 2: Check for existing policies before attempting to create new ones
DO $$
DECLARE
  policy_exists boolean;
BEGIN
  -- Check if the policy already exists for affiliate_links
  SELECT EXISTS(
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'affiliate_links'
    AND policyname = 'Affiliates can view their links'
  ) INTO policy_exists;
  
  -- Only create the policy if it doesn't exist
  IF NOT policy_exists THEN
    EXECUTE $POLICY$
      CREATE POLICY "Affiliates can view their links"
        ON affiliate_links
        FOR SELECT
        TO authenticated
        USING (
          affiliate_id = auth.uid() OR 
          is_affiliate(auth.uid()) OR
          has_role('admin')
        );
    $POLICY$;
  END IF;
  
  -- Check for create policy
  SELECT EXISTS(
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'affiliate_links'
    AND policyname = 'Affiliates can create their links'
  ) INTO policy_exists;
  
  IF NOT policy_exists THEN
    EXECUTE $POLICY$
      CREATE POLICY "Affiliates can create their links"
        ON affiliate_links
        FOR INSERT
        TO authenticated
        WITH CHECK (
          affiliate_id = auth.uid() OR 
          is_affiliate(auth.uid()) OR
          has_role('admin')
        );
    $POLICY$;
  END IF;
  
  -- Check for update policy
  SELECT EXISTS(
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'affiliate_links'
    AND policyname = 'Affiliates can update their links'
  ) INTO policy_exists;
  
  IF NOT policy_exists THEN
    EXECUTE $POLICY$
      CREATE POLICY "Affiliates can update their links"
        ON affiliate_links
        FOR UPDATE
        TO authenticated
        USING (
          affiliate_id = auth.uid() OR 
          is_affiliate(auth.uid()) OR
          has_role('admin')
        );
    $POLICY$;
  END IF;
  
  -- Check for delete policy
  SELECT EXISTS(
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'affiliate_links'
    AND policyname = 'Affiliates can delete their links'
  ) INTO policy_exists;
  
  IF NOT policy_exists THEN
    EXECUTE $POLICY$
      CREATE POLICY "Affiliates can delete their links"
        ON affiliate_links
        FOR DELETE
        TO authenticated
        USING (
          affiliate_id = auth.uid() OR 
          is_affiliate(auth.uid()) OR
          has_role('admin')
        );
    $POLICY$;
  END IF;
  
  -- Check for affiliate_coupons policy
  SELECT EXISTS(
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'affiliate_coupons'
    AND policyname = 'Affiliates can view their coupons'
  ) INTO policy_exists;
  
  IF NOT policy_exists THEN
    EXECUTE $POLICY$
      CREATE POLICY "Affiliates can view their coupons"
        ON affiliate_coupons
        FOR SELECT
        TO authenticated
        USING (
          affiliate_id = auth.uid() OR 
          is_affiliate(auth.uid()) OR
          has_role('admin')
        );
    $POLICY$;
  END IF;
  
  -- Check for affiliate_commissions policy
  SELECT EXISTS(
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'affiliate_commissions'
    AND policyname = 'Affiliates can view their commissions'
  ) INTO policy_exists;
  
  IF NOT policy_exists THEN
    EXECUTE $POLICY$
      CREATE POLICY "Affiliates can view their commissions"
        ON affiliate_commissions
        FOR SELECT
        TO authenticated
        USING (
          affiliate_id = auth.uid() OR 
          is_affiliate(auth.uid()) OR
          has_role('admin')
        );
    $POLICY$;
  END IF;
  
  -- Check for payout_requests select policy
  SELECT EXISTS(
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'payout_requests'
    AND policyname = 'Affiliates can view their payout requests'
  ) INTO policy_exists;
  
  IF NOT policy_exists THEN
    EXECUTE $POLICY$
      CREATE POLICY "Affiliates can view their payout requests"
        ON payout_requests
        FOR SELECT
        TO authenticated
        USING (
          affiliate_id = auth.uid() OR 
          is_affiliate(auth.uid()) OR
          has_role('admin')
        );
    $POLICY$;
  END IF;
  
  -- Check for payout_requests insert policy
  SELECT EXISTS(
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'payout_requests'
    AND policyname = 'Affiliates can create their payout requests'
  ) INTO policy_exists;
  
  IF NOT policy_exists THEN
    EXECUTE $POLICY$
      CREATE POLICY "Affiliates can create their payout requests"
        ON payout_requests
        FOR INSERT
        TO authenticated
        WITH CHECK (
          affiliate_id = auth.uid() OR 
          is_affiliate(auth.uid()) OR
          has_role('admin')
        );
    $POLICY$;
  END IF;
  
  -- Check for users policy
  SELECT EXISTS(
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users'
    AND policyname = 'Affiliates can view their referred members'
  ) INTO policy_exists;
  
  IF NOT policy_exists THEN
    EXECUTE $POLICY$
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
    $POLICY$;
  END IF;
END $$;

-- Step 3: Add a comment to document the standardization
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