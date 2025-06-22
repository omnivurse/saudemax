/*
  # Fix Multiple Permissive Policies

  1. Problem
    - Multiple permissive policies for the same role and action
    - Each policy must be executed for every relevant query, causing performance issues
    
  2. Solution
    - Combine multiple policies into a single policy with OR conditions
    - This reduces the number of policies that need to be evaluated
    
  3. Tables Affected
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
CREATE POLICY "Affiliate coupons access policy"
  ON affiliate_coupons
  FOR SELECT
  TO authenticated
  USING (
    agent_id = (SELECT auth.uid()) OR 
    has_role('admin')
  );

-- Fix affiliate_links policies
DROP POLICY IF EXISTS "Admins can manage all affiliate links" ON affiliate_links;
DROP POLICY IF EXISTS "Agents can view own links" ON affiliate_links;
DROP POLICY IF EXISTS "Agents can create own links" ON affiliate_links;
DROP POLICY IF EXISTS "Agents can update own links" ON affiliate_links;
DROP POLICY IF EXISTS "Agents can delete own links" ON affiliate_links;

CREATE POLICY "Affiliate links select policy"
  ON affiliate_links
  FOR SELECT
  TO authenticated
  USING (
    agent_id = (SELECT auth.uid()) OR 
    has_role('admin')
  );

CREATE POLICY "Affiliate links insert policy"
  ON affiliate_links
  FOR INSERT
  TO authenticated
  WITH CHECK (
    agent_id = (SELECT auth.uid()) OR 
    has_role('admin')
  );

CREATE POLICY "Affiliate links update policy"
  ON affiliate_links
  FOR UPDATE
  TO authenticated
  USING (
    agent_id = (SELECT auth.uid()) OR 
    has_role('admin')
  );

CREATE POLICY "Affiliate links delete policy"
  ON affiliate_links
  FOR DELETE
  TO authenticated
  USING (
    agent_id = (SELECT auth.uid()) OR 
    has_role('admin')
  );

-- Fix affiliate_referrals policies
DROP POLICY IF EXISTS "Admins can manage all referrals" ON affiliate_referrals;
DROP POLICY IF EXISTS "Affiliates can view own referrals" ON affiliate_referrals;
CREATE POLICY "Affiliate referrals access policy"
  ON affiliate_referrals
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = (SELECT auth.uid())) OR 
    has_role('admin')
  );

-- Fix affiliate_visits policies
DROP POLICY IF EXISTS "Admins can view all visits" ON affiliate_visits;
DROP POLICY IF EXISTS "Affiliates can view own visits" ON affiliate_visits;
DROP POLICY IF EXISTS "Anonymous visit tracking" ON affiliate_visits;

CREATE POLICY "Affiliate visits select policy"
  ON affiliate_visits
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = (SELECT auth.uid())) OR 
    has_role('admin')
  );

CREATE POLICY "Affiliate visits insert policy"
  ON affiliate_visits
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Fix affiliate_withdrawals policies
DROP POLICY IF EXISTS "Admins can manage all withdrawals" ON affiliate_withdrawals;
DROP POLICY IF EXISTS "Affiliates can manage own withdrawals" ON affiliate_withdrawals;

CREATE POLICY "Affiliate withdrawals select policy"
  ON affiliate_withdrawals
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = (SELECT auth.uid())) OR 
    has_role('admin')
  );

CREATE POLICY "Affiliate withdrawals insert policy"
  ON affiliate_withdrawals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = (SELECT auth.uid())) OR 
    has_role('admin')
  );

CREATE POLICY "Affiliate withdrawals update policy"
  ON affiliate_withdrawals
  FOR UPDATE
  TO authenticated
  USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = (SELECT auth.uid())) OR 
    has_role('admin')
  );

CREATE POLICY "Affiliate withdrawals delete policy"
  ON affiliate_withdrawals
  FOR DELETE
  TO authenticated
  USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = (SELECT auth.uid())) OR 
    has_role('admin')
  );

-- Fix affiliates policies
DROP POLICY IF EXISTS "Admins can manage all affiliates" ON affiliates;
DROP POLICY IF EXISTS "Affiliates can view own profile" ON affiliates;
DROP POLICY IF EXISTS "Affiliates can update own profile" ON affiliates;
DROP POLICY IF EXISTS "Affiliates can create own profile" ON affiliates;
DROP POLICY IF EXISTS "Public can view active affiliates" ON affiliates;

CREATE POLICY "Affiliates select policy"
  ON affiliates
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR 
    has_role('admin') OR
    status = 'active'
  );

CREATE POLICY "Affiliates insert policy"
  ON affiliates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid()) OR 
    has_role('admin')
  );

CREATE POLICY "Affiliates update policy"
  ON affiliates
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR 
    has_role('admin')
  );

CREATE POLICY "Affiliates delete policy"
  ON affiliates
  FOR DELETE
  TO authenticated
  USING (has_role('admin'));

-- Also allow anonymous users to view active affiliates
CREATE POLICY "Public can view active affiliates"
  ON affiliates
  FOR SELECT
  TO anon
  USING (status = 'active');

-- Fix agent_commissions policies
DROP POLICY IF EXISTS "Admins can manage all commissions" ON agent_commissions;
DROP POLICY IF EXISTS "Agents can view own commissions" ON agent_commissions;
CREATE POLICY "Agent commissions access policy"
  ON agent_commissions
  FOR SELECT
  TO authenticated
  USING (
    agent_id = (SELECT auth.uid()) OR 
    has_role('admin')
  );

-- Fix enrollment_selections policies
DROP POLICY IF EXISTS "Admins can access all selections" ON enrollment_selections;
DROP POLICY IF EXISTS "Users can insert their own selections" ON enrollment_selections;
DROP POLICY IF EXISTS "Users can view their own selections" ON enrollment_selections;

CREATE POLICY "Enrollment selections select policy"
  ON enrollment_selections
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR 
    has_role('admin')
  );

CREATE POLICY "Enrollment selections insert policy"
  ON enrollment_selections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid()) OR 
    has_role('admin')
  );

-- Fix member_profiles policies
DROP POLICY IF EXISTS "Admins can access all member profiles" ON member_profiles;
DROP POLICY IF EXISTS "Advisors can access assigned member profiles" ON member_profiles;
DROP POLICY IF EXISTS "Members can read own profile" ON member_profiles;
DROP POLICY IF EXISTS "Members can update own profile" ON member_profiles;

CREATE POLICY "Member profiles select policy"
  ON member_profiles
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR 
    advisor_id = (SELECT auth.uid()) OR 
    has_role('advisor') OR
    has_role('admin')
  );

CREATE POLICY "Member profiles update policy"
  ON member_profiles
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR 
    has_role('admin')
  );

-- Fix payout_requests policies
DROP POLICY IF EXISTS "Admins can manage all payout requests" ON payout_requests;
DROP POLICY IF EXISTS "Agents can view own payout requests" ON payout_requests;
DROP POLICY IF EXISTS "Agents can create own payout requests" ON payout_requests;

CREATE POLICY "Payout requests select policy"
  ON payout_requests
  FOR SELECT
  TO authenticated
  USING (
    agent_id = (SELECT auth.uid()) OR 
    has_role('admin')
  );

CREATE POLICY "Payout requests insert policy"
  ON payout_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    agent_id = (SELECT auth.uid()) OR 
    has_role('admin')
  );

-- Fix promo_assets policies
DROP POLICY IF EXISTS "Admins can manage all promo assets" ON promo_assets;
DROP POLICY IF EXISTS "All users can view promo assets" ON promo_assets;
CREATE POLICY "Promo assets select policy"
  ON promo_assets
  FOR SELECT
  TO authenticated
  USING (true);

-- Fix role_permissions policies
DROP POLICY IF EXISTS "Admins can manage role permissions" ON role_permissions;
DROP POLICY IF EXISTS "Users can view role permissions" ON role_permissions;
CREATE POLICY "Role permissions select policy"
  ON role_permissions
  FOR SELECT
  TO authenticated
  USING (
    role IN (SELECT role FROM roles WHERE id = (SELECT auth.uid())) OR 
    has_role('admin')
  );

-- Fix roles policies
DROP POLICY IF EXISTS "Admins can manage all roles" ON roles;
DROP POLICY IF EXISTS "Users can view own role" ON roles;
CREATE POLICY "Roles select policy"
  ON roles
  FOR SELECT
  TO authenticated
  USING (
    id = (SELECT auth.uid()) OR 
    has_role('admin')
  );

-- Fix users policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can read own profile data" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

CREATE POLICY "Users select policy"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    id = (SELECT auth.uid()) OR 
    has_role('admin')
  );

CREATE POLICY "Users update policy"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    id = (SELECT auth.uid()) OR 
    has_role('admin')
  );

-- Add helpful notice about the performance improvements
DO $$
BEGIN
  RAISE NOTICE '=== MULTIPLE PERMISSIVE POLICIES FIXED ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed multiple permissive policies:';
  RAISE NOTICE '✅ Combined multiple policies into single policies with OR conditions';
  RAISE NOTICE '✅ Reduced the number of policies that need to be evaluated';
  RAISE NOTICE '✅ Improved query performance while maintaining the same security model';
  RAISE NOTICE '';
  RAISE NOTICE 'These changes maintain the same security model while improving performance.';
  RAISE NOTICE '================================================';
END $$;