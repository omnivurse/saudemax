/*
  # Enable RLS on Users Table and Add Policies

  1. Security
    - Enable Row Level Security on users table
    - Add policies for users to access their own data
    - Add policies for admins to access all user data
    - Add policies for advisors to access assigned members
*/

-- Enable Row Level Security on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own profile
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Admins can do anything with any user profile
CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (has_role('admin'));

-- Advisors can view profiles of members they are assigned to
CREATE POLICY "Advisors can view assigned members"
  ON users
  FOR SELECT
  USING (
    has_role('advisor') AND 
    id IN (
      SELECT user_id 
      FROM member_profiles 
      WHERE advisor_id = auth.uid()
    )
  );

-- Agents can view basic info of members they referred
CREATE POLICY "Agents can view referred members"
  ON users
  FOR SELECT
  USING (
    has_role('agent') AND 
    id IN (
      SELECT referred_user_id 
      FROM affiliate_referrals 
      WHERE affiliate_id IN (
        SELECT id 
        FROM affiliates 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Public can view active affiliates (limited fields)
CREATE POLICY "Public can view active affiliates"
  ON users
  FOR SELECT
  USING (
    id IN (
      SELECT user_id 
      FROM affiliates 
      WHERE status = 'active'
    )
  );