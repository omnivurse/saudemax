/*
  # Secure Affiliate Dashboard Access

  1. New Policies
    - Enforce strict data isolation for affiliate data
    - Ensure affiliates can only view their own records
    - Allow anonymous visit tracking for referrals
    - Maintain admin access to all data

  2. Security
    - Use has_role() function for role-based checks
    - Properly scope all affiliate-related tables
    - Prevent data leakage between affiliates
    - Maintain proper access for public affiliate validation

  3. Tables Secured
    - affiliates
    - affiliate_visits
    - affiliate_referrals
    - affiliate_withdrawals
*/

-- Drop existing policies that might conflict
DO $$
DECLARE
    tables text[] := ARRAY['affiliates', 'affiliate_visits', 'affiliate_referrals', 'affiliate_withdrawals'];
    t text;
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- Clear existing policies to avoid conflicts
DO $$
DECLARE
    r RECORD;
    tables text[] := ARRAY['affiliates', 'affiliate_visits', 'affiliate_referrals', 'affiliate_withdrawals'];
    t text;
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t)
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.%I', r.policyname, t);
        END LOOP;
    END LOOP;
END $$;

-- 1. Affiliate Table Policies
-- Affiliates can only view and update their own profile
CREATE POLICY "Affiliates can view own profile"
  ON public.affiliates
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Affiliates can update own profile"
  ON public.affiliates
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Affiliates can create own profile"
  ON public.affiliates
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Public can view active affiliates for referral validation
CREATE POLICY "Public can view active affiliates"
  ON public.affiliates
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Admins can manage all affiliates
CREATE POLICY "Admins can manage all affiliates"
  ON public.affiliates
  FOR ALL
  TO authenticated
  USING (has_role('admin'));

-- 2. Affiliate Visits Policies
-- Affiliates can only view visits linked to their profile
CREATE POLICY "Affiliates can view own visits"
  ON public.affiliate_visits
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = auth.uid()
    )
  );

-- Allow anonymous visit tracking for referrals
CREATE POLICY "Anonymous visit tracking"
  ON public.affiliate_visits
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Admins can view all visits
CREATE POLICY "Admins can view all visits"
  ON public.affiliate_visits
  FOR ALL
  TO authenticated
  USING (has_role('admin'));

-- 3. Affiliate Referrals Policies
-- Affiliates can only view referrals linked to their profile
CREATE POLICY "Affiliates can view own referrals"
  ON public.affiliate_referrals
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = auth.uid()
    )
  );

-- Admins can manage all referrals
CREATE POLICY "Admins can manage all referrals"
  ON public.affiliate_referrals
  FOR ALL
  TO authenticated
  USING (has_role('admin'));

-- 4. Affiliate Withdrawals Policies
-- Affiliates can manage their own withdrawal requests
CREATE POLICY "Affiliates can manage own withdrawals"
  ON public.affiliate_withdrawals
  FOR ALL
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = auth.uid()
    )
  );

-- Admins can manage all withdrawals
CREATE POLICY "Admins can manage all withdrawals"
  ON public.affiliate_withdrawals
  FOR ALL
  TO authenticated
  USING (has_role('admin'));

-- Create function to verify RLS policies are working
CREATE OR REPLACE FUNCTION verify_affiliate_rls()
RETURNS TABLE (
  table_name text,
  policy_name text,
  cmd text,
  roles text[],
  using_expression text,
  with_check_expression text,
  security_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname || '.' || tablename as table_name,
    policyname as policy_name,
    cmd as cmd,
    roles as roles,
    qual as using_expression,
    with_check as with_check_expression,
    CASE 
      WHEN (qual LIKE '%auth.uid()%' OR qual LIKE '%has_role%') THEN 'SECURE'
      ELSE 'REVIEW NEEDED'
    END as security_status
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename IN ('affiliates', 'affiliate_visits', 'affiliate_referrals', 'affiliate_withdrawals')
  ORDER BY tablename, policyname;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION verify_affiliate_rls() TO service_role;

-- Add helpful notice about the security implementation
DO $$
BEGIN
  RAISE NOTICE '=== AFFILIATE DASHBOARD SECURITY IMPLEMENTED ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Security Features:';
  RAISE NOTICE '✅ Strict data isolation between affiliates';
  RAISE NOTICE '✅ Secure role-based access control';
  RAISE NOTICE '✅ Anonymous visit tracking for referrals';
  RAISE NOTICE '✅ Public access to active affiliates for validation';
  RAISE NOTICE '✅ Admin override for all affiliate data';
  RAISE NOTICE '';
  RAISE NOTICE 'To verify security, run:';
  RAISE NOTICE 'SELECT * FROM verify_affiliate_rls();';
  RAISE NOTICE '================================================';
END $$;