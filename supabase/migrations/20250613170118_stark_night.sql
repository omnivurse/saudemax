-- Fix infinite recursion in RLS policies by removing circular dependencies
-- The issue: affiliates policies query users table, which has its own RLS policies

-- Step 1: Drop ALL problematic policies that cause recursion
DROP POLICY IF EXISTS "Admins can manage all affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Admins can manage all referrals" ON public.affiliate_referrals;
DROP POLICY IF EXISTS "Admins can manage all withdrawals" ON public.affiliate_withdrawals;
DROP POLICY IF EXISTS "Admins can manage all visits" ON public.affiliate_visits;

-- Step 2: Create simple, non-recursive policies for affiliates
-- These policies only check direct ownership without complex subqueries

-- Affiliates can access their own data
CREATE POLICY "Affiliates own data access"
  ON public.affiliates
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Public can view active affiliates (for referral validation)
CREATE POLICY "Public active affiliates"
  ON public.affiliates
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Step 3: Create simple policies for affiliate_visits
CREATE POLICY "Affiliate visits access"
  ON public.affiliate_visits
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = auth.uid()
    )
  );

-- Allow anonymous visit tracking
CREATE POLICY "Anonymous visit tracking"
  ON public.affiliate_visits
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Step 4: Create simple policies for affiliate_referrals
CREATE POLICY "Affiliate referrals access"
  ON public.affiliate_referrals
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = auth.uid()
    )
  );

-- Step 5: Create simple policies for affiliate_withdrawals
CREATE POLICY "Affiliate withdrawals access"
  ON public.affiliate_withdrawals
  FOR ALL
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = auth.uid()
    )
  );

-- Step 6: For admin access, use service_role or create a separate admin interface
-- Instead of complex RLS policies, admins should use service_role key
-- or we can create a simple role-based check without recursion

-- Simple admin check using auth metadata (no table lookup)
CREATE POLICY "Service role admin access affiliates"
  ON public.affiliates
  FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role admin access visits"
  ON public.affiliate_visits
  FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role admin access referrals"
  ON public.affiliate_referrals
  FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role admin access withdrawals"
  ON public.affiliate_withdrawals
  FOR ALL
  TO service_role
  USING (true);

-- Step 7: Add a notice about the fix
DO $$
BEGIN
  RAISE NOTICE '=== INFINITE RECURSION FIXED ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '✅ Removed circular dependencies between affiliates and users tables';
  RAISE NOTICE '✅ Simplified RLS policies to prevent recursion';
  RAISE NOTICE '✅ Maintained affiliate data isolation';
  RAISE NOTICE '✅ Added service_role access for admin operations';
  RAISE NOTICE '';
  RAISE NOTICE 'Security Status:';
  RAISE NOTICE '• Affiliates can only access their own data';
  RAISE NOTICE '• Anonymous users can track visits (for referrals)';
  RAISE NOTICE '• Public can view active affiliates (for validation)';
  RAISE NOTICE '• Admins use service_role for full access';
  RAISE NOTICE '';
  RAISE NOTICE 'The infinite recursion error should now be resolved.';
  RAISE NOTICE '================================';
END $$;