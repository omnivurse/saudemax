/*
  # Fix Affiliate RLS Policies

  1. Security Updates
    - Remove problematic policy that queries auth.users directly
    - Update admin policy to use public.users table instead
    - Ensure proper permissions for affiliate data access

  2. Policy Changes
    - Fix admin access policy to use public.users table
    - Maintain secure access for affiliates to view own data
    - Keep public access for active affiliate validation
*/

-- Drop the problematic admin policy that queries auth.users
DROP POLICY IF EXISTS "Admins can access all affiliate data" ON affiliates;

-- Create a new admin policy that uses the public.users table instead
CREATE POLICY "Admins can access all affiliate data"
  ON affiliates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Ensure the other policies are correctly set
DROP POLICY IF EXISTS "Affiliates can view own profile" ON affiliates;
DROP POLICY IF EXISTS "Affiliates can update own profile" ON affiliates;

-- Recreate affiliate policies with proper permissions
CREATE POLICY "Affiliates can view own profile"
  ON affiliates
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Affiliates can update own profile"
  ON affiliates
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- The public access policy should remain as is for referral validation
-- "Anyone can view active affiliates for referral validation" is already correct