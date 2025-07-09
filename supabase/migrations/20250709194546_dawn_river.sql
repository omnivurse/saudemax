/*
  # Fix RLS Policy Infinite Recursion

  This migration fixes the infinite recursion issues in RLS policies by:
  1. Updating users table policies to use direct JWT claim checks instead of has_role()
  2. Updating roles table policies to break the circular dependency
  3. Ensuring proper read access for the has_role() function to work

  ## Changes Made
  - Drop and recreate problematic policies on users table
  - Drop and recreate problematic policies on roles table
  - Use direct JWT app_metadata checks for admin access
  - Allow authenticated users to read roles table (required for has_role function)
*/

-- First, drop the problematic policies on the users table
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Users select policy" ON public.users;
DROP POLICY IF EXISTS "Users update policy" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Affiliates can view own profile" ON public.users;
DROP POLICY IF EXISTS "Affiliates can view referred members" ON public.users;
DROP POLICY IF EXISTS "Affiliates can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Affiliates can view their referred members" ON public.users;
DROP POLICY IF EXISTS "Public can view active affiliates" ON public.users;

-- Drop problematic policies on the roles table
DROP POLICY IF EXISTS "Roles select policy" ON public.roles;
DROP POLICY IF EXISTS "Roles update policy" ON public.roles;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.roles;

-- Create new policies for the roles table that break the recursion
-- Allow authenticated users to read roles (necessary for has_role function to work without recursion)
CREATE POLICY "Enable read access for all authenticated users"
  ON public.roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to manage roles using direct JWT claim check
CREATE POLICY "Admins can manage all roles"
  ON public.roles
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'app_metadata' IS NOT NULL 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    auth.jwt() ->> 'app_metadata' IS NOT NULL 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Create new policies for the users table using direct JWT checks for admin access
CREATE POLICY "Admins can manage all users"
  ON public.users
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'app_metadata' IS NOT NULL 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    auth.jwt() ->> 'app_metadata' IS NOT NULL 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Users can view and update their own profile
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Public can view active affiliates (for referral links)
CREATE POLICY "Public can view active affiliates"
  ON public.users
  FOR SELECT
  TO anon, authenticated
  USING (
    id IN (
      SELECT user_id FROM public.affiliates 
      WHERE status = 'active'
    )
  );

-- Now fix any problematic policies on the affiliates table
DROP POLICY IF EXISTS "Affiliates select policy" ON public.affiliates;
DROP POLICY IF EXISTS "Affiliates insert policy" ON public.affiliates;
DROP POLICY IF EXISTS "Affiliates update policy" ON public.affiliates;
DROP POLICY IF EXISTS "Agents can access affiliate dashboard" ON public.affiliates;
DROP POLICY IF EXISTS "Agents with affiliate_access can access affiliate dashboard" ON public.affiliates;
DROP POLICY IF EXISTS "Public can view active affiliates" ON public.affiliates;

-- Recreate affiliates policies without circular dependencies
CREATE POLICY "Affiliates can manage own profile"
  ON public.affiliates
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can manage all affiliates using direct JWT check
CREATE POLICY "Admins can manage all affiliates"
  ON public.affiliates
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'app_metadata' IS NOT NULL 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    auth.jwt() ->> 'app_metadata' IS NOT NULL 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Public can view active affiliates (for referral validation)
CREATE POLICY "Public can view active affiliates"
  ON public.affiliates
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Users with affiliate role can view affiliate data (using has_role function should work now)
CREATE POLICY "Affiliate role can view affiliate data"
  ON public.affiliates
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR has_role('affiliate'::text)
    OR (
      auth.jwt() ->> 'app_metadata' IS NOT NULL 
      AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    )
  );