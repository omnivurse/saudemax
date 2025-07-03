/*
  # Add is_active default to users table

  1. Changes
    - Add DEFAULT TRUE constraint to is_active column in users table
    - Ensure all existing NULL values are set to TRUE
    - (Optional) Enforce NOT NULL on is_active column

  This fixes the "Database error creating new user" error during affiliate registration
  by ensuring the is_active column always has a value when new users are created.
*/

-- 1. Update any existing NULL values to TRUE
UPDATE public.users
SET is_active = TRUE
WHERE is_active IS NULL;

-- 2. Add DEFAULT constraint to the column
ALTER TABLE public.users
ALTER COLUMN is_active SET DEFAULT TRUE;

-- 3. (Optional, but recommended) Enforce NOT NULL constraint
ALTER TABLE public.users
ALTER COLUMN is_active SET NOT NULL;

-- 4. Verify the change was applied (for migration logs)
DO $$
DECLARE
  column_default text;
  is_nullable text;
BEGIN
  SELECT column_default, is_nullable INTO column_default, is_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'is_active';

  IF column_default LIKE '%true%' AND is_nullable = 'NO' THEN
    RAISE NOTICE 'Successfully added DEFAULT TRUE and NOT NULL to is_active column';
  ELSE
    RAISE WARNING 'Failed to fully apply DEFAULT TRUE or NOT NULL to is_active column';
  END IF;
END $$;