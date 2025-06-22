/*
  # Database Cleanup and Optimization

  1. Fixes
    - Remove redundant policies
    - Consolidate multiple permissive policies
    - Fix security issues
    - Optimize RLS performance
    
  2. Tables Affected
    - All tables with RLS enabled
    
  3. Performance Improvements
    - Replace auth.uid() with (SELECT auth.uid())
    - Combine multiple policies with OR conditions
    - Remove circular dependencies
*/

-- Step 1: Fix duplicate policies on affiliate tables
DO $$
DECLARE
    tables text[] := ARRAY['affiliates', 'affiliate_visits', 'affiliate_referrals', 'affiliate_withdrawals', 'affiliate_links', 'affiliate_coupons'];
    t text;
    r RECORD;
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        -- Get all policies for the table
        FOR r IN (
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = t
        )
        LOOP
            -- Drop all policies to avoid conflicts
            EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.%I', r.policyname, t);
        END LOOP;
    END LOOP;
END $$;

-- Step 2: Create optimized policies for affiliate tables

-- Affiliates table
CREATE POLICY "Affiliates select policy"
  ON public.affiliates
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR 
    has_role('admin') OR
    status = 'active'
  );

CREATE POLICY "Affiliates insert policy"
  ON public.affiliates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid()) OR 
    has_role('admin')
  );

CREATE POLICY "Affiliates update policy"
  ON public.affiliates
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR 
    has_role('admin')
  );

CREATE POLICY "Public can view active affiliates"
  ON public.affiliates
  FOR SELECT
  TO anon
  USING (status = 'active');

-- Affiliate visits
CREATE POLICY "Affiliate visits select policy"
  ON public.affiliate_visits
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = (SELECT auth.uid())) OR 
    has_role('admin')
  );

CREATE POLICY "Anonymous visit tracking"
  ON public.affiliate_visits
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Affiliate referrals
CREATE POLICY "Affiliate referrals policy"
  ON public.affiliate_referrals
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = (SELECT auth.uid())) OR 
    has_role('admin')
  );

-- Affiliate withdrawals
CREATE POLICY "Affiliate withdrawals select policy"
  ON public.affiliate_withdrawals
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = (SELECT auth.uid())) OR 
    has_role('admin')
  );

CREATE POLICY "Affiliate withdrawals insert policy"
  ON public.affiliate_withdrawals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = (SELECT auth.uid())) OR 
    has_role('admin')
  );

CREATE POLICY "Affiliate withdrawals update policy"
  ON public.affiliate_withdrawals
  FOR UPDATE
  TO authenticated
  USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = (SELECT auth.uid())) OR 
    has_role('admin')
  );

CREATE POLICY "Affiliate withdrawals delete policy"
  ON public.affiliate_withdrawals
  FOR DELETE
  TO authenticated
  USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = (SELECT auth.uid())) OR 
    has_role('admin')
  );

-- Affiliate links
CREATE POLICY "Affiliate links select policy"
  ON public.affiliate_links
  FOR SELECT
  TO authenticated
  USING (
    agent_id = (SELECT auth.uid()) OR 
    has_role('admin')
  );

CREATE POLICY "Affiliate links insert policy"
  ON public.affiliate_links
  FOR INSERT
  TO authenticated
  WITH CHECK (
    agent_id = (SELECT auth.uid()) OR 
    has_role('admin')
  );

CREATE POLICY "Affiliate links update policy"
  ON public.affiliate_links
  FOR UPDATE
  TO authenticated
  USING (
    agent_id = (SELECT auth.uid()) OR 
    has_role('admin')
  );

CREATE POLICY "Affiliate links delete policy"
  ON public.affiliate_links
  FOR DELETE
  TO authenticated
  USING (
    agent_id = (SELECT auth.uid()) OR 
    has_role('admin')
  );

-- Affiliate coupons
CREATE POLICY "Affiliate coupons policy"
  ON public.affiliate_coupons
  FOR SELECT
  TO authenticated
  USING (
    agent_id = (SELECT auth.uid()) OR 
    has_role('admin')
  );

-- Step 3: Fix duplicate policies on member tables
DO $$
DECLARE
    tables text[] := ARRAY['member_profiles', 'member_dependents', 'documents', 'share_requests', 'share_request_documents', 'billing_records', 'payment_methods', 'support_tickets', 'support_messages', 'notification_preferences'];
    t text;
    r RECORD;
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        -- Get all policies for the table
        FOR r IN (
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = t
        )
        LOOP
            -- Drop all policies to avoid conflicts
            EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.%I', r.policyname, t);
        END LOOP;
    END LOOP;
END $$;

-- Step 4: Create optimized policies for member tables

-- Member profiles
CREATE POLICY "Member profiles select policy"
  ON public.member_profiles
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR 
    advisor_id = (SELECT auth.uid()) OR 
    has_role('advisor') OR
    has_role('admin')
  );

CREATE POLICY "Member profiles update policy"
  ON public.member_profiles
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR 
    has_role('admin')
  );

-- Member dependents
CREATE POLICY "Member dependents policy"
  ON public.member_dependents
  FOR ALL
  TO authenticated
  USING (
    member_profile_id IN (
      SELECT id FROM member_profiles WHERE user_id = (SELECT auth.uid())
    ) OR has_role('admin')
  );

-- Documents
CREATE POLICY "Documents policy"
  ON public.documents
  FOR SELECT
  TO authenticated
  USING (
    member_profile_id IN (
      SELECT id FROM member_profiles WHERE user_id = (SELECT auth.uid())
    ) OR has_role('admin')
  );

-- Share requests
CREATE POLICY "Share requests policy"
  ON public.share_requests
  FOR ALL
  TO authenticated
  USING (
    member_profile_id IN (
      SELECT id FROM member_profiles WHERE user_id = (SELECT auth.uid())
    ) OR has_role('admin')
  );

-- Share request documents
CREATE POLICY "Share request documents policy"
  ON public.share_request_documents
  FOR ALL
  TO authenticated
  USING (
    share_request_id IN (
      SELECT sr.id FROM share_requests sr
      JOIN member_profiles mp ON sr.member_profile_id = mp.id
      WHERE mp.user_id = (SELECT auth.uid())
    ) OR has_role('admin')
  );

-- Billing records
CREATE POLICY "Billing records policy"
  ON public.billing_records
  FOR SELECT
  TO authenticated
  USING (
    member_profile_id IN (
      SELECT id FROM member_profiles WHERE user_id = (SELECT auth.uid())
    ) OR has_role('admin')
  );

-- Payment methods
CREATE POLICY "Payment methods policy"
  ON public.payment_methods
  FOR ALL
  TO authenticated
  USING (
    member_profile_id IN (
      SELECT id FROM member_profiles WHERE user_id = (SELECT auth.uid())
    ) OR has_role('admin')
  );

-- Support tickets
CREATE POLICY "Support tickets policy"
  ON public.support_tickets
  FOR ALL
  TO authenticated
  USING (
    member_profile_id IN (
      SELECT id FROM member_profiles WHERE user_id = (SELECT auth.uid())
    ) OR has_role('admin')
  );

-- Support messages
CREATE POLICY "Support messages select policy"
  ON public.support_messages
  FOR SELECT
  TO authenticated
  USING (
    support_ticket_id IN (
      SELECT st.id FROM support_tickets st
      JOIN member_profiles mp ON st.member_profile_id = mp.id
      WHERE mp.user_id = (SELECT auth.uid())
    ) OR has_role('admin')
  );

CREATE POLICY "Support messages insert policy"
  ON public.support_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    support_ticket_id IN (
      SELECT st.id FROM support_tickets st
      JOIN member_profiles mp ON st.member_profile_id = mp.id
      WHERE mp.user_id = (SELECT auth.uid())
    ) OR has_role('admin')
  );

-- Notification preferences
CREATE POLICY "Notification preferences policy"
  ON public.notification_preferences
  FOR ALL
  TO authenticated
  USING (
    member_profile_id IN (
      SELECT id FROM member_profiles WHERE user_id = (SELECT auth.uid())
    ) OR has_role('admin')
  );

-- Step 5: Fix duplicate policies on user and role tables
DO $$
DECLARE
    tables text[] := ARRAY['users', 'roles', 'role_permissions'];
    t text;
    r RECORD;
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        -- Get all policies for the table
        FOR r IN (
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = t
        )
        LOOP
            -- Drop all policies to avoid conflicts
            EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.%I', r.policyname, t);
        END LOOP;
    END LOOP;
END $$;

-- Step 6: Create optimized policies for user and role tables

-- Users
CREATE POLICY "Users select policy"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    id = (SELECT auth.uid()) OR 
    has_role('admin')
  );

CREATE POLICY "Users update policy"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    id = (SELECT auth.uid()) OR 
    has_role('admin')
  );

-- Roles
CREATE POLICY "Roles select policy"
  ON public.roles
  FOR SELECT
  TO authenticated
  USING (
    id = (SELECT auth.uid()) OR 
    has_role('admin')
  );

CREATE POLICY "Roles update policy"
  ON public.roles
  FOR ALL
  TO authenticated
  USING (has_role('admin'));

-- Role permissions
CREATE POLICY "Role permissions select policy"
  ON public.role_permissions
  FOR SELECT
  TO authenticated
  USING (
    role IN (SELECT role FROM roles WHERE id = (SELECT auth.uid())) OR 
    has_role('admin')
  );

CREATE POLICY "Role permissions update policy"
  ON public.role_permissions
  FOR ALL
  TO authenticated
  USING (has_role('admin'));

-- Step 7: Fix duplicate policies on agent tables
DO $$
DECLARE
    tables text[] := ARRAY['agent_commissions', 'payout_requests'];
    t text;
    r RECORD;
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        -- Get all policies for the table
        FOR r IN (
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = t
        )
        LOOP
            -- Drop all policies to avoid conflicts
            EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.%I', r.policyname, t);
        END LOOP;
    END LOOP;
END $$;

-- Step 8: Create optimized policies for agent tables

-- Agent commissions
CREATE POLICY "Agent commissions policy"
  ON public.agent_commissions
  FOR SELECT
  TO authenticated
  USING (
    agent_id = (SELECT auth.uid()) OR 
    has_role('admin')
  );

-- Payout requests
CREATE POLICY "Payout requests select policy"
  ON public.payout_requests
  FOR SELECT
  TO authenticated
  USING (
    agent_id = (SELECT auth.uid()) OR 
    has_role('admin')
  );

CREATE POLICY "Payout requests insert policy"
  ON public.payout_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    agent_id = (SELECT auth.uid()) OR 
    has_role('admin')
  );

-- Step 9: Fix duplicate policies on other tables
DO $$
DECLARE
    tables text[] := ARRAY['enrollment_selections', 'migrated_members', 'audit_logs', 'system_settings', 'email_templates', 'email_logs', 'promo_assets', 'commission_rules'];
    t text;
    r RECORD;
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        -- Check if table exists
        EXECUTE format('
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = ''public'' 
            AND table_name = %L
          )', t) INTO r;
        
        IF r.exists THEN
            -- Get all policies for the table
            FOR r IN (
                SELECT policyname 
                FROM pg_policies 
                WHERE schemaname = 'public' AND tablename = t
            )
            LOOP
                -- Drop all policies to avoid conflicts
                EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.%I', r.policyname, t);
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- Step 10: Create optimized policies for other tables

-- Enrollment selections
CREATE POLICY "Enrollment selections policy"
  ON public.enrollment_selections
  FOR ALL
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR 
    has_role('admin')
  );

-- Migrated members
CREATE POLICY "Migrated members policy"
  ON public.migrated_members
  FOR ALL
  TO authenticated
  USING (has_role('admin'));

-- Audit logs
CREATE POLICY "Audit logs select policy"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR 
    has_role('admin')
  );

-- System settings
CREATE POLICY "System settings policy"
  ON public.system_settings
  FOR ALL
  TO authenticated
  USING (has_role('admin'));

-- Email templates
CREATE POLICY "Email templates select policy"
  ON public.email_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Email templates admin policy"
  ON public.email_templates
  FOR ALL
  TO authenticated
  USING (has_role('admin'));

-- Email logs
CREATE POLICY "Email logs select policy"
  ON public.email_logs
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR
    to_email IN (
      SELECT email FROM users WHERE id = (SELECT auth.uid())
    ) OR
    has_role('admin')
  );

-- Promo assets
CREATE POLICY "Promo assets select policy"
  ON public.promo_assets
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Promo assets admin policy"
  ON public.promo_assets
  FOR ALL
  TO authenticated
  USING (has_role('admin'));

-- Commission rules
CREATE POLICY "Commission rules policy"
  ON public.commission_rules
  FOR ALL
  TO authenticated
  USING (has_role('admin'));

-- Step 11: Create a function to validate the cleanup
CREATE OR REPLACE FUNCTION validate_database_cleanup()
RETURNS TABLE (
  table_name text,
  policy_count integer,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tablename::text,
    COUNT(*)::integer as policy_count,
    CASE 
      WHEN COUNT(*) > 5 THEN 'Too many policies'
      ELSE 'OK'
    END as status
  FROM pg_policies 
  WHERE schemaname = 'public'
  GROUP BY tablename
  ORDER BY policy_count DESC;
END;
$$;

-- Add helpful notice about the cleanup
DO $$
BEGIN
  RAISE NOTICE '=== DATABASE CLEANUP COMPLETED ===';
  RAISE NOTICE '';
  RAISE NOTICE 'The following operations were performed:';
  RAISE NOTICE '✅ Removed redundant policies';
  RAISE NOTICE '✅ Consolidated multiple permissive policies';
  RAISE NOTICE '✅ Fixed security issues';
  RAISE NOTICE '✅ Optimized RLS performance';
  RAISE NOTICE '';
  RAISE NOTICE 'To verify the cleanup, run:';
  RAISE NOTICE 'SELECT * FROM validate_database_cleanup();';
  RAISE NOTICE '================================================';
END $$;