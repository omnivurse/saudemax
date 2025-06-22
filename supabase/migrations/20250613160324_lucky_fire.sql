/*
  # Fix RLS Policies for Users and Affiliates Access

  1. Security Updates
    - Ensure proper RLS policies for users table access
    - Fix affiliate data access policies
    - Add missing policies for authenticated user access

  2. Changes
    - Add policy for users to read their own profile data
    - Ensure affiliate policies work correctly with user authentication
    - Add policy for reading user profiles when needed for affiliate operations
*/

-- Ensure RLS is enabled on users table (should already be enabled based on schema)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Allow users to read own user record" ON public.users;
DROP POLICY IF EXISTS "Allow logged-in users to read own user record" ON public.users;

-- Create a comprehensive policy for users to read their own data
CREATE POLICY "Users can read own profile data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Ensure affiliates can be properly accessed
-- The existing policies should work, but let's make sure they're comprehensive
DROP POLICY IF EXISTS "Affiliates can view own profile enhanced" ON public.affiliates;

CREATE POLICY "Affiliates can view own profile enhanced"
  ON public.affiliates
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Add policy to allow affiliates to insert their own profile
DROP POLICY IF EXISTS "Affiliates can create own profile enhanced" ON public.affiliates;

CREATE POLICY "Affiliates can create own profile enhanced"
  ON public.affiliates
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Add policy to allow affiliates to update their own profile
DROP POLICY IF EXISTS "Affiliates can update own profile enhanced" ON public.affiliates;

CREATE POLICY "Affiliates can update own profile enhanced"
  ON public.affiliates
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());