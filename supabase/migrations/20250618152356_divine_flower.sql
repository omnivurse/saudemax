/*
  # Fix Multiple Permissive Policies

  1. Problem
    - Multiple permissive policies for the same role and action on tables
    - This causes each policy to be evaluated separately, reducing performance
    
  2. Solution
    - Combine multiple permissive policies into single policies with OR conditions
    - This ensures only one policy needs to be evaluated per role/action
    
  3. Tables Fixed
    - affiliate_coupons
    - affiliate_links
    - affiliate_referrals
    - affiliate_visits
    - affiliate_withdrawals
    - affiliates
    - agent_commissions
    - enrollment_selections
    - member_profiles
    - payout_requests
    - promo_assets
    - role_permissions
    - roles
    - users
*/

-- Fix affiliate_coupons policies
DROP POLICY IF EXISTS "Admins can manage all affiliate coupons" ON affiliate_coupons;
DROP POLICY IF EXISTS "Agents can view own coupons" ON affiliate_coupons;

CREATE POLICY "Combined affiliate_coupons policy"
  ON affiliate_coupons
  FOR SELECT
  TO authenticated
  USING (
    has_role('admin') OR 
    agent_id = (SELECT auth.uid())
  );

-- Fix affiliate_links policies
DROP POLICY IF EXISTS "Admins can manage all affiliate links" ON affiliate_links;
DROP POLICY IF EXISTS "Agents can view own links" ON affiliate_links;
DROP POLICY IF EXISTS "Agents can create own links" ON affiliate_links;
DROP POLICY IF EXISTS "Agents can update own links" ON affiliate_links;
DROP POLICY IF EXISTS "Agents can delete own links" ON affiliate_links;

CREATE POLICY "Combined affiliate_links select policy"
  ON affiliate_links
  FOR SELECT
  TO authenticated
  USING (
    has_role('admin') OR 
    agent_id = (SELECT auth.uid())
  );

CREATE POLICY "Combined affiliate_links insert policy"
  ON affiliate_links
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role('admin') OR 
    agent_id = (SELECT auth.uid())
  );

CREATE POLICY "Combined affiliate_links update policy"
  ON affiliate_links
  FOR UPDATE
  TO authenticated
  USING (
    has_role('admin') OR 
    agent_id = (SELECT auth.uid())
  );

CREATE POLICY "Combined affiliate_links delete policy"
  ON affiliate_links
  FOR DELETE
  TO authenticated
  USING (
    has_role('admin') OR 
    agent_id = (SELECT auth.uid())
  );

-- Fix affiliate_referrals policies
DROP POLICY IF EXISTS "Admins can manage all referrals" ON affiliate_referrals;
DROP POLICY IF EXISTS "Affiliates can view own referrals" ON affiliate_referrals;

CREATE POLICY "Combined affiliate_referrals policy"
  ON affiliate_referrals
  FOR SELECT
  TO authenticated
  USING (
    has_role('admin') OR 
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = (SELECT auth.uid())
    )
  );

-- Fix affiliate_visits policies
DROP POLICY IF EXISTS "Admins can view all visits" ON affiliate_visits;
DROP POLICY IF EXISTS "Affiliates can view own visits" ON affiliate_visits;
DROP POLICY IF EXISTS "Anonymous visit tracking" ON affiliate_visits;

CREATE POLICY "Combined affiliate_visits select policy"
  ON affiliate_visits
  FOR SELECT
  TO authenticated
  USING (
    has_role('admin') OR 
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Anonymous visit tracking"
  ON affiliate_visits
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Fix affiliate_withdrawals policies
DROP POLICY IF EXISTS "Admins can manage all withdrawals" ON affiliate_withdrawals;
DROP POLICY IF EXISTS "Affiliates can manage own withdrawals" ON affiliate_withdrawals;

CREATE POLICY "Combined affiliate_withdrawals select policy"
  ON affiliate_withdrawals
  FOR SELECT
  TO authenticated
  USING (
    has_role('admin') OR 
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Combined affiliate_withdrawals insert policy"
  ON affiliate_withdrawals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role('admin') OR 
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Combined affiliate_withdrawals update policy"
  ON affiliate_withdrawals
  FOR UPDATE
  TO authenticated
  USING (
    has_role('admin') OR 
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Combined affiliate_withdrawals delete policy"
  ON affiliate_withdrawals
  FOR DELETE
  TO authenticated
  USING (
    has_role('admin') OR 
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = (SELECT auth.uid())
    )
  );

-- Fix affiliates policies
DROP POLICY IF EXISTS "Admins can manage all affiliates" ON affiliates;
DROP POLICY IF EXISTS "Affiliates can view own profile" ON affiliates;
DROP POLICY IF EXISTS "Affiliates can update own profile" ON affiliates;
DROP POLICY IF EXISTS "Affiliates can create own profile" ON affiliates;
DROP POLICY IF EXISTS "Public can view active affiliates" ON affiliates;

CREATE POLICY "Combined affiliates select policy"
  ON affiliates
  FOR SELECT
  TO authenticated
  USING (
    has_role('admin') OR 
    user_id = (SELECT auth.uid()) OR
    status = 'active'
  );

CREATE POLICY "Combined affiliates insert policy"
  ON affiliates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role('admin') OR 
    user_id = (SELECT auth.uid())
  );

CREATE POLICY "Combined affiliates update policy"
  ON affiliates
  FOR UPDATE
  TO authenticated
  USING (
    has_role('admin') OR 
    user_id = (SELECT auth.uid())
  );

CREATE POLICY "Public can view active affiliates"
  ON affiliates
  FOR SELECT
  TO anon
  USING (status = 'active');

-- Fix agent_commissions policies
DROP POLICY IF EXISTS "Admins can manage all commissions" ON agent_commissions;
DROP POLICY IF EXISTS "Agents can view own commissions" ON agent_commissions;

CREATE POLICY "Combined agent_commissions policy"
  ON agent_commissions
  FOR SELECT
  TO authenticated
  USING (
    has_role('admin') OR 
    agent_id = (SELECT auth.uid())
  );

-- Fix enrollment_selections policies
DROP POLICY IF EXISTS "Admins can access all selections" ON enrollment_selections;
DROP POLICY IF EXISTS "Users can insert their own selections" ON enrollment_selections;
DROP POLICY IF EXISTS "Users can view their own selections" ON enrollment_selections;

CREATE POLICY "Combined enrollment_selections select policy"
  ON enrollment_selections
  FOR SELECT
  TO authenticated
  USING (
    has_role('admin') OR 
    user_id = (SELECT auth.uid())
  );

CREATE POLICY "Combined enrollment_selections insert policy"
  ON enrollment_selections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role('admin') OR 
    user_id = (SELECT auth.uid())
  );

-- Fix member_profiles policies
DROP POLICY IF EXISTS "Admins can access all member profiles" ON member_profiles;
DROP POLICY IF EXISTS "Advisors can access assigned member profiles" ON member_profiles;
DROP POLICY IF EXISTS "Members can read own profile" ON member_profiles;
DROP POLICY IF EXISTS "Members can update own profile" ON member_profiles;

CREATE POLICY "Combined member_profiles select policy"
  ON member_profiles
  FOR SELECT
  TO authenticated
  USING (
    has_role('admin') OR 
    advisor_id = (SELECT auth.uid()) OR 
    has_role('advisor') OR
    user_id = (SELECT auth.uid())
  );

CREATE POLICY "Combined member_profiles update policy"
  ON member_profiles
  FOR UPDATE
  TO authenticated
  USING (
    has_role('admin') OR 
    user_id = (SELECT auth.uid())
  );

-- Fix payout_requests policies
DROP POLICY IF EXISTS "Admins can manage all payout requests" ON payout_requests;
DROP POLICY IF EXISTS "Agents can view own payout requests" ON payout_requests;
DROP POLICY IF EXISTS "Agents can create own payout requests" ON payout_requests;

CREATE POLICY "Combined payout_requests select policy"
  ON payout_requests
  FOR SELECT
  TO authenticated
  USING (
    has_role('admin') OR 
    agent_id = (SELECT auth.uid())
  );

CREATE POLICY "Combined payout_requests insert policy"
  ON payout_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role('admin') OR 
    agent_id = (SELECT auth.uid())
  );

-- Fix promo_assets policies
DROP POLICY IF EXISTS "Admins can manage all promo assets" ON promo_assets;
DROP POLICY IF EXISTS "All users can view promo assets" ON promo_assets;

CREATE POLICY "Combined promo_assets policy"
  ON promo_assets
  FOR SELECT
  TO authenticated
  USING (true);

-- Fix role_permissions policies
DROP POLICY IF EXISTS "Admins can manage role permissions" ON role_permissions;
DROP POLICY IF EXISTS "Users can view role permissions" ON role_permissions;

CREATE POLICY "Combined role_permissions policy"
  ON role_permissions
  FOR SELECT
  TO authenticated
  USING (
    has_role('admin') OR 
    role IN (
      SELECT role FROM roles WHERE id = (SELECT auth.uid())
    )
  );

-- Fix roles policies
DROP POLICY IF EXISTS "Admins can manage all roles" ON roles;
DROP POLICY IF EXISTS "Users can view own role" ON roles;

CREATE POLICY "Combined roles policy"
  ON roles
  FOR SELECT
  TO authenticated
  USING (
    has_role('admin') OR 
    id = (SELECT auth.uid())
  );

-- Fix users policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Users can read own profile data" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Combined users select policy"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    has_role('admin') OR 
    id = (SELECT auth.uid())
  );

CREATE POLICY "Combined users update policy"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    has_role('admin') OR 
    id = (SELECT auth.uid())
  );

-- Add helpful notice about the performance fixes
DO $$
BEGIN
  RAISE NOTICE '=== MULTIPLE PERMISSIVE POLICIES FIXED ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed multiple_permissive_policies warnings by combining policies with OR conditions';
  RAISE NOTICE 'This ensures only one policy needs to be evaluated per role/action.';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables fixed:';
  RAISE NOTICE '✅ affiliate_coupons';
  RAISE NOTICE '✅ affiliate_links';
  RAISE NOTICE '✅ affiliate_referrals';
  RAISE NOTICE '✅ affiliate_visits';
  RAISE NOTICE '✅ affiliate_withdrawals';
  RAISE NOTICE '✅ affiliates';
  RAISE NOTICE '✅ agent_commissions';
  RAISE NOTICE '✅ enrollment_selections';
  RAISE NOTICE '✅ member_profiles';
  RAISE NOTICE '✅ payout_requests';
  RAISE NOTICE '✅ promo_assets';
  RAISE NOTICE '✅ role_permissions';
  RAISE NOTICE '✅ roles';
  RAISE NOTICE '✅ users';
  RAISE NOTICE '';
  RAISE NOTICE 'For more information, see: https://supabase.com/docs/guides/database/postgres/row-level-security#multiple-policies';
  RAISE NOTICE '================================';
END $$;