/*
  # Fix RLS User Metadata Security Issues

  1. Problem
    - RLS policies on affiliate tables reference auth.user_metadata
    - user_metadata is editable by end users and creates security vulnerabilities
    - Should never be used in security contexts

  2. Solution
    - Drop all problematic policies that reference user_metadata
    - Create new secure policies using the public.users table for role checking
    - Use proper foreign key relationships for admin access control

  3. Security Enhancement
    - Use public.users.role instead of auth metadata for role checking
    - Maintain proper access control without security vulnerabilities
    - Ensure only verified admin users can access sensitive data
*/

-- Drop all problematic policies that reference user_metadata
DROP POLICY IF EXISTS "Admins can access all affiliate data" ON public.affiliates;
DROP POLICY IF EXISTS "Admins can access all referrals" ON public.affiliate_referrals;
DROP POLICY IF EXISTS "Admins can access all withdrawals" ON public.affiliate_withdrawals;

-- Create secure admin policies using public.users table instead of user_metadata
-- This is secure because public.users.role is controlled by the application, not user-editable

-- Secure admin policy for affiliates table
CREATE POLICY "Admins can access all affiliate data"
  ON public.affiliates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE public.users.id = auth.uid() 
      AND public.users.role = 'admin'
    )
  );

-- Secure admin policy for affiliate_referrals table
CREATE POLICY "Admins can access all referrals"
  ON public.affiliate_referrals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE public.users.id = auth.uid() 
      AND public.users.role = 'admin'
    )
  );

-- Secure admin policy for affiliate_withdrawals table
CREATE POLICY "Admins can access all withdrawals"
  ON public.affiliate_withdrawals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE public.users.id = auth.uid() 
      AND public.users.role = 'admin'
    )
  );

-- Create a function to validate RLS security
CREATE OR REPLACE FUNCTION validate_rls_security()
RETURNS TABLE(
  table_name text,
  policy_name text,
  uses_user_metadata boolean,
  is_secure boolean
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
    (qual LIKE '%user_metadata%' OR qual LIKE '%raw_user_meta_data%') as uses_user_metadata,
    NOT (qual LIKE '%user_metadata%' OR qual LIKE '%raw_user_meta_data%') as is_secure
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename IN ('affiliates', 'affiliate_referrals', 'affiliate_withdrawals')
    AND policyname LIKE '%Admin%';
END;
$$;

-- Add security documentation
COMMENT ON POLICY "Admins can access all affiliate data" ON public.affiliates IS 
'Secure admin policy using public.users.role instead of user_metadata';

COMMENT ON POLICY "Admins can access all referrals" ON public.affiliate_referrals IS 
'Secure admin policy using public.users.role instead of user_metadata';

COMMENT ON POLICY "Admins can access all withdrawals" ON public.affiliate_withdrawals IS 
'Secure admin policy using public.users.role instead of user_metadata';

-- Add helpful notice about the security fix
DO $$
BEGIN
  RAISE NOTICE '=== RLS SECURITY ISSUES FIXED ===';
  RAISE NOTICE 'Fixed 3 critical security vulnerabilities:';
  RAISE NOTICE '1. affiliates table - Admin policy now uses public.users.role';
  RAISE NOTICE '2. affiliate_referrals table - Admin policy now uses public.users.role';
  RAISE NOTICE '3. affiliate_withdrawals table - Admin policy now uses public.users.role';
  RAISE NOTICE '';
  RAISE NOTICE 'Security Enhancement:';
  RAISE NOTICE '- Removed user_metadata references (user-editable)';
  RAISE NOTICE '- Now using public.users.role (application-controlled)';
  RAISE NOTICE '- Maintains proper admin access control';
  RAISE NOTICE '';
  RAISE NOTICE 'Run: SELECT * FROM validate_rls_security();';
  RAISE NOTICE 'To verify all policies are now secure.';
  RAISE NOTICE '================================';
END $$;