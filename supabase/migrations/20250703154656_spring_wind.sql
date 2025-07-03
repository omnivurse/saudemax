/*
  # Add is_active default to users table

  1. Changes
    - Add DEFAULT TRUE constraint to is_active column in users table
    - Ensure all existing NULL values are set to TRUE
  
  This fixes the "Database error creating new user" error during affiliate registration
  by ensuring the is_active column always has a value when new users are created.
*/

-- First, update any existing NULL values to TRUE
UPDATE public.users
SET is_active = TRUE
WHERE is_active IS NULL;

-- Then add the DEFAULT constraint to the column
ALTER TABLE public.users
ALTER COLUMN is_active SET DEFAULT TRUE;

-- Verify the change was applied
DO $$
DECLARE
  column_default text;
BEGIN
  SELECT column_default INTO column_default
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'is_active';
  
  IF column_default = 'true' THEN
    RAISE NOTICE 'Successfully added DEFAULT TRUE to is_active column';
  ELSE
    RAISE WARNING 'Failed to add DEFAULT TRUE to is_active column';
  END IF;
END $$;