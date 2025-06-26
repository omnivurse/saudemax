-- supabase/migrations/YYYYMMDDHHmmss_fix_users_role_constraint.sql

-- This migration fixes the "users_role_check" constraint violation by updating invalid role values
-- and then re-applying the constraint.

-- Step 1: Drop the existing users_role_check constraint
-- This allows us to modify rows that currently violate the constraint.
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 2: Update any invalid or NULL role values to a default valid role ('member')
-- This ensures all existing rows conform to the allowed values before re-adding the constraint.
UPDATE public.users
SET role = 'member'
WHERE role NOT IN ('member', 'advisor', 'admin', 'agent', 'affiliate') OR role IS NULL;

-- Step 3: Re-add the users_role_check constraint with the correct definition
-- This enforces that all future and existing role values must be one of the specified types.
ALTER TABLE public.users
ADD CONSTRAINT users_role_check CHECK (
  role = ANY (ARRAY['member'::text, 'advisor'::text, 'admin'::text, 'agent'::text, 'affiliate'::text])
);

-- Add a notice to confirm the migration's completion
DO $$
BEGIN
  RAISE NOTICE '=== USERS_ROLE_CHECK CONSTRAINT FIXED ===';
  RAISE NOTICE 'Invalid role values in public.users have been updated to ''member''.';
  RAISE NOTICE 'The users_role_check constraint has been successfully re-applied.';
  RAISE NOTICE '========================================';
END $$;
