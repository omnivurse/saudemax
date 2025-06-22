/*
  # Enable RLS for Users Table

  1. Security Updates
    - Ensure RLS is enabled on users table
    - Verify existing policies are in place
    - Add any missing security policies

  2. Notes
    - This migration ensures the users table has proper row-level security
    - Existing policies will be preserved
    - Safe to run multiple times (uses IF NOT EXISTS patterns)
*/

-- Ensure RLS is enabled on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Verify core policies exist (these should already be in place based on schema)
-- Users can view own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON users
      FOR SELECT
      TO authenticated
      USING (id = auth.uid());
  END IF;
END $$;

-- Users can update own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON users
      FOR UPDATE
      TO authenticated
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- Admins can manage all users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Admins can manage all users'
  ) THEN
    CREATE POLICY "Admins can manage all users"
      ON users
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM roles 
          WHERE id = auth.uid() 
          AND role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM roles 
          WHERE id = auth.uid() 
          AND role = 'admin'
        )
      );
  END IF;
END $$;