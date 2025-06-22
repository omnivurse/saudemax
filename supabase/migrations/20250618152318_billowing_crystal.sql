/*
  # Fix RLS Performance Issues

  1. Problem
    - Current RLS policies use auth.uid() directly, causing it to be re-evaluated for each row
    - This produces suboptimal query performance at scale
    
  2. Solution
    - Replace auth.uid() with (SELECT auth.uid()) in all RLS policies
    - This ensures the function is only evaluated once per query
    
  3. Tables Fixed
    - member_profiles
    - affiliates
    - affiliate_referrals
    - affiliate_withdrawals
    - users
    - enrollment_selections
    - member_dependents
    - support_tickets
    - support_messages
    - documents
    - share_requests
    - share_request_documents
    - billing_records
    - payment_methods
    - notification_preferences
    - affiliate_links
    - affiliate_coupons
    - agent_commissions
    - payout_requests
    - affiliate_visits
    - roles
    - role_permissions
*/

-- Fix member_profiles policies
DROP POLICY IF EXISTS "Members can read own profile" ON member_profiles;
CREATE POLICY "Members can read own profile"
  ON member_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Members can update own profile" ON member_profiles;
CREATE POLICY "Members can update own profile"
  ON member_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Advisors can access assigned member profiles" ON member_profiles;
CREATE POLICY "Advisors can access assigned member profiles"
  ON member_profiles
  FOR SELECT
  TO authenticated
  USING (
    advisor_id = (SELECT auth.uid()) OR has_role('advisor')
  );

-- Fix affiliates policies
DROP POLICY IF EXISTS "Affiliates can view own profile" ON affiliates;
CREATE POLICY "Affiliates can view own profile"
  ON affiliates
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Affiliates can update own profile" ON affiliates;
CREATE POLICY "Affiliates can update own profile"
  ON affiliates
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Affiliates can create own profile" ON affiliates;
CREATE POLICY "Affiliates can create own profile"
  ON affiliates
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Fix affiliate_referrals policies
DROP POLICY IF EXISTS "Affiliates can view own referrals" ON affiliate_referrals;
CREATE POLICY "Affiliates can view own referrals"
  ON affiliate_referrals
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = (SELECT auth.uid())
    )
  );

-- Fix affiliate_withdrawals policies
DROP POLICY IF EXISTS "Affiliates can manage own withdrawals" ON affiliate_withdrawals;
CREATE POLICY "Affiliates can manage own withdrawals"
  ON affiliate_withdrawals
  FOR ALL
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = (SELECT auth.uid())
    )
  );

-- Fix users policies
DROP POLICY IF EXISTS "Users can read own profile data" ON users;
CREATE POLICY "Users can read own profile data"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()));

-- Fix enrollment_selections policies
DROP POLICY IF EXISTS "Users can insert their own selections" ON enrollment_selections;
CREATE POLICY "Users can insert their own selections"
  ON enrollment_selections
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view their own selections" ON enrollment_selections;
CREATE POLICY "Users can view their own selections"
  ON enrollment_selections
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Fix member_dependents policies
DROP POLICY IF EXISTS "Members can read own dependents" ON member_dependents;
CREATE POLICY "Members can read own dependents"
  ON member_dependents
  FOR ALL
  TO authenticated
  USING (
    member_profile_id IN (
      SELECT id FROM member_profiles WHERE user_id = (SELECT auth.uid())
    )
  );

-- Fix support_tickets policies
DROP POLICY IF EXISTS "Members can manage own support tickets" ON support_tickets;
CREATE POLICY "Members can manage own support tickets"
  ON support_tickets
  FOR ALL
  TO authenticated
  USING (
    member_profile_id IN (
      SELECT id FROM member_profiles WHERE user_id = (SELECT auth.uid())
    )
  );

-- Fix support_messages policies
DROP POLICY IF EXISTS "Members can read own support messages" ON support_messages;
CREATE POLICY "Members can read own support messages"
  ON support_messages
  FOR SELECT
  TO authenticated
  USING (
    support_ticket_id IN (
      SELECT st.id FROM support_tickets st
      JOIN member_profiles mp ON st.member_profile_id = mp.id
      WHERE mp.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Members can create support messages" ON support_messages;
CREATE POLICY "Members can create support messages"
  ON support_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    support_ticket_id IN (
      SELECT st.id FROM support_tickets st
      JOIN member_profiles mp ON st.member_profile_id = mp.id
      WHERE mp.user_id = (SELECT auth.uid())
    )
  );

-- Fix documents policies
DROP POLICY IF EXISTS "Members can read own documents" ON documents;
CREATE POLICY "Members can read own documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    member_profile_id IN (
      SELECT id FROM member_profiles WHERE user_id = (SELECT auth.uid())
    )
  );

-- Fix share_requests policies
DROP POLICY IF EXISTS "Members can manage own share requests" ON share_requests;
CREATE POLICY "Members can manage own share requests"
  ON share_requests
  FOR ALL
  TO authenticated
  USING (
    member_profile_id IN (
      SELECT id FROM member_profiles WHERE user_id = (SELECT auth.uid())
    )
  );

-- Fix share_request_documents policies
DROP POLICY IF EXISTS "Members can manage own share request documents" ON share_request_documents;
CREATE POLICY "Members can manage own share request documents"
  ON share_request_documents
  FOR ALL
  TO authenticated
  USING (
    share_request_id IN (
      SELECT sr.id FROM share_requests sr
      JOIN member_profiles mp ON sr.member_profile_id = mp.id
      WHERE mp.user_id = (SELECT auth.uid())
    )
  );

-- Fix billing_records policies
DROP POLICY IF EXISTS "Members can read own billing records" ON billing_records;
CREATE POLICY "Members can read own billing records"
  ON billing_records
  FOR SELECT
  TO authenticated
  USING (
    member_profile_id IN (
      SELECT id FROM member_profiles WHERE user_id = (SELECT auth.uid())
    )
  );

-- Fix payment_methods policies
DROP POLICY IF EXISTS "Members can manage own payment methods" ON payment_methods;
CREATE POLICY "Members can manage own payment methods"
  ON payment_methods
  FOR ALL
  TO authenticated
  USING (
    member_profile_id IN (
      SELECT id FROM member_profiles WHERE user_id = (SELECT auth.uid())
    )
  );

-- Fix notification_preferences policies
DROP POLICY IF EXISTS "Members can manage own notification preferences" ON notification_preferences;
CREATE POLICY "Members can manage own notification preferences"
  ON notification_preferences
  FOR ALL
  TO authenticated
  USING (
    member_profile_id IN (
      SELECT id FROM member_profiles WHERE user_id = (SELECT auth.uid())
    )
  );

-- Fix affiliate_links policies
DROP POLICY IF EXISTS "Agents can view own links" ON affiliate_links;
CREATE POLICY "Agents can view own links"
  ON affiliate_links
  FOR SELECT
  TO authenticated
  USING (agent_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Agents can create own links" ON affiliate_links;
CREATE POLICY "Agents can create own links"
  ON affiliate_links
  FOR INSERT
  TO authenticated
  WITH CHECK (agent_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Agents can update own links" ON affiliate_links;
CREATE POLICY "Agents can update own links"
  ON affiliate_links
  FOR UPDATE
  TO authenticated
  USING (agent_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Agents can delete own links" ON affiliate_links;
CREATE POLICY "Agents can delete own links"
  ON affiliate_links
  FOR DELETE
  TO authenticated
  USING (agent_id = (SELECT auth.uid()));

-- Fix affiliate_coupons policies
DROP POLICY IF EXISTS "Agents can view own coupons" ON affiliate_coupons;
CREATE POLICY "Agents can view own coupons"
  ON affiliate_coupons
  FOR SELECT
  TO authenticated
  USING (agent_id = (SELECT auth.uid()));

-- Fix agent_commissions policies
DROP POLICY IF EXISTS "Agents can view own commissions" ON agent_commissions;
CREATE POLICY "Agents can view own commissions"
  ON agent_commissions
  FOR SELECT
  TO authenticated
  USING (agent_id = (SELECT auth.uid()));

-- Fix payout_requests policies
DROP POLICY IF EXISTS "Agents can view own payout requests" ON payout_requests;
CREATE POLICY "Agents can view own payout requests"
  ON payout_requests
  FOR SELECT
  TO authenticated
  USING (agent_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Agents can create own payout requests" ON payout_requests;
CREATE POLICY "Agents can create own payout requests"
  ON payout_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (agent_id = (SELECT auth.uid()));

-- Fix affiliate_visits policies
DROP POLICY IF EXISTS "Affiliates can view own visits" ON affiliate_visits;
CREATE POLICY "Affiliates can view own visits"
  ON affiliate_visits
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = (SELECT auth.uid())
    )
  );

-- Fix roles policies
DROP POLICY IF EXISTS "Users can view own role" ON roles;
CREATE POLICY "Users can view own role"
  ON roles
  FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

-- Fix role_permissions policies
DROP POLICY IF EXISTS "Users can view role permissions" ON role_permissions;
CREATE POLICY "Users can view role permissions"
  ON role_permissions
  FOR SELECT
  TO authenticated
  USING (
    role IN (
      SELECT role FROM roles WHERE id = (SELECT auth.uid())
    )
  );

-- Add helpful notice about the performance fixes
DO $$
BEGIN
  RAISE NOTICE '=== RLS PERFORMANCE ISSUES FIXED ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed auth_rls_initplan warnings by replacing auth.uid() with (SELECT auth.uid())';
  RAISE NOTICE 'This ensures the function is only evaluated once per query instead of once per row.';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables fixed:';
  RAISE NOTICE '✅ member_profiles';
  RAISE NOTICE '✅ affiliates';
  RAISE NOTICE '✅ affiliate_referrals';
  RAISE NOTICE '✅ affiliate_withdrawals';
  RAISE NOTICE '✅ users';
  RAISE NOTICE '✅ enrollment_selections';
  RAISE NOTICE '✅ member_dependents';
  RAISE NOTICE '✅ support_tickets';
  RAISE NOTICE '✅ support_messages';
  RAISE NOTICE '✅ documents';
  RAISE NOTICE '✅ share_requests';
  RAISE NOTICE '✅ share_request_documents';
  RAISE NOTICE '✅ billing_records';
  RAISE NOTICE '✅ payment_methods';
  RAISE NOTICE '✅ notification_preferences';
  RAISE NOTICE '✅ affiliate_links';
  RAISE NOTICE '✅ affiliate_coupons';
  RAISE NOTICE '✅ agent_commissions';
  RAISE NOTICE '✅ payout_requests';
  RAISE NOTICE '✅ affiliate_visits';
  RAISE NOTICE '✅ roles';
  RAISE NOTICE '✅ role_permissions';
  RAISE NOTICE '';
  RAISE NOTICE 'For more information, see: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select';
  RAISE NOTICE '================================';
END $$;