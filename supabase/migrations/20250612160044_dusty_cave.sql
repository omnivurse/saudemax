/*
  # Fix Infinite Recursion in Affiliate RLS Policies

  1. Problem
    - RLS policies on affiliates table were causing infinite recursion
    - Policies were referencing users table which created circular dependencies

  2. Solution
    - Drop all existing affiliate-related policies
    - Recreate them with non-recursive logic using auth.users directly
    - Use raw_user_meta_data for role checking to avoid circular references

  3. Security
    - Maintains same access control levels
    - Eliminates infinite recursion issues
    - Uses direct auth.users references instead of public.users joins
*/

-- Drop ALL existing policies on affiliate tables to avoid conflicts
DROP POLICY IF EXISTS "Affiliates can view own profile" ON affiliates;
DROP POLICY IF EXISTS "Affiliates can update own profile" ON affiliates;
DROP POLICY IF EXISTS "Anyone can view active affiliates for referral validation" ON affiliates;
DROP POLICY IF EXISTS "Admins can access all affiliate data" ON affiliates;

DROP POLICY IF EXISTS "Affiliates can view own visits" ON affiliate_visits;
DROP POLICY IF EXISTS "Allow visit tracking" ON affiliate_visits;

DROP POLICY IF EXISTS "Affiliates can view own referrals" ON affiliate_referrals;
DROP POLICY IF EXISTS "Admins can access all referrals" ON affiliate_referrals;

DROP POLICY IF EXISTS "Affiliates can manage own withdrawals" ON affiliate_withdrawals;
DROP POLICY IF EXISTS "Admins can access all withdrawals" ON affiliate_withdrawals;

-- Create new non-recursive policies for affiliates table
CREATE POLICY "Affiliates can view own profile"
  ON affiliates
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Affiliates can update own profile"
  ON affiliates
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can view active affiliates for referral validation"
  ON affiliates
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

CREATE POLICY "Admins can access all affiliate data"
  ON affiliates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data ->> 'role') = 'admin'
    )
  );

-- Create new non-recursive policies for affiliate_visits table
CREATE POLICY "Affiliates can view own visits"
  ON affiliate_visits
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allow visit tracking"
  ON affiliate_visits
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create new non-recursive policies for affiliate_referrals table
CREATE POLICY "Affiliates can view own referrals"
  ON affiliate_referrals
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can access all referrals"
  ON affiliate_referrals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data ->> 'role') = 'admin'
    )
  );

-- Create new non-recursive policies for affiliate_withdrawals table
CREATE POLICY "Affiliates can manage own withdrawals"
  ON affiliate_withdrawals
  FOR ALL
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can access all withdrawals"
  ON affiliate_withdrawals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data ->> 'role') = 'admin'
    )
  );