/*
  # Fix RLS Infinite Recursion

  1. Problem
    - Infinite recursion detected in policy for relation "users"
    - Circular reference between users and affiliates table policies

  2. Solution
    - Fix affiliates table policies to use auth.users directly instead of public.users
    - Simplify user role checking to avoid circular references
    - Update policies to use proper auth schema references
*/

-- Drop problematic policies on affiliates table
DROP POLICY IF EXISTS "Admins can access all affiliate data" ON affiliates;
DROP POLICY IF EXISTS "Admins can access all referrals" ON affiliate_referrals;
DROP POLICY IF EXISTS "Admins can access all withdrawals" ON affiliate_withdrawals;

-- Drop problematic policies on users table that might cause recursion
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

-- Recreate affiliates policies using auth.users and raw_user_meta_data
CREATE POLICY "Admins can access all affiliate data"
  ON affiliates
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
    OR 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data ->> 'role') = 'admin'
    )
  );

-- Recreate affiliate_referrals admin policy
CREATE POLICY "Admins can access all referrals"
  ON affiliate_referrals
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
    OR 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data ->> 'role') = 'admin'
    )
  );

-- Recreate affiliate_withdrawals admin policy
CREATE POLICY "Admins can access all withdrawals"
  ON affiliate_withdrawals
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
    OR 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data ->> 'role') = 'admin'
    )
  );

-- Recreate users table admin policies with simpler logic
CREATE POLICY "Admins can view all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
    OR 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data ->> 'role') = 'admin'
    )
  );

CREATE POLICY "Admins can update all users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
    OR 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data ->> 'role') = 'admin'
    )
  );