/*
  # Fix Affiliate RLS Policies - Remove Infinite Recursion

  1. Problem
    - Current affiliate policies reference the `users` table which creates infinite recursion
    - The `users` table policies likely also reference other tables creating circular dependencies

  2. Solution
    - Simplify affiliate policies to use `auth.users` directly instead of the `users` table
    - Use `auth.uid()` and `auth.jwt()` functions which don't create recursion
    - Remove complex subqueries that reference the custom `users` table

  3. Changes
    - Drop existing problematic policies on affiliates table
    - Create new simplified policies using auth functions
    - Ensure policies are efficient and don't create circular references
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can access all affiliate data" ON public.affiliates;
DROP POLICY IF EXISTS "Affiliates can update own profile" ON public.affiliates;
DROP POLICY IF EXISTS "Affiliates can view own profile" ON public.affiliates;
DROP POLICY IF EXISTS "Anyone can view active affiliates for referral validation" ON public.affiliates;

-- Create new simplified policies that don't cause recursion
-- Policy for admins to access all affiliate data
CREATE POLICY "Admins can access all affiliate data"
  ON public.affiliates
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
    OR
    (auth.jwt() ->> 'raw_user_meta_data')::jsonb ->> 'role' = 'admin'
  );

-- Policy for affiliates to view their own profile
CREATE POLICY "Affiliates can view own profile"
  ON public.affiliates
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy for affiliates to update their own profile
CREATE POLICY "Affiliates can update own profile"
  ON public.affiliates
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy for affiliates to insert their own profile (for registration)
CREATE POLICY "Affiliates can create own profile"
  ON public.affiliates
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy for anyone to view active affiliates (for referral validation)
CREATE POLICY "Anyone can view active affiliates for referral validation"
  ON public.affiliates
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Also fix affiliate_referrals policies to prevent similar issues
DROP POLICY IF EXISTS "Admins can access all referrals" ON public.affiliate_referrals;

CREATE POLICY "Admins can access all referrals"
  ON public.affiliate_referrals
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
    OR
    (auth.jwt() ->> 'raw_user_meta_data')::jsonb ->> 'role' = 'admin'
  );

-- Fix affiliate_withdrawals policies
DROP POLICY IF EXISTS "Admins can access all withdrawals" ON public.affiliate_withdrawals;

CREATE POLICY "Admins can access all withdrawals"
  ON public.affiliate_withdrawals
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
    OR
    (auth.jwt() ->> 'raw_user_meta_data')::jsonb ->> 'role' = 'admin'
  );