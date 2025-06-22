/*
  # Fix Users Role Constraint

  1. Problem
    - The users table has a CHECK constraint that only allows 'member', 'admin', and 'advisor' roles
    - We need to add 'agent' as a valid role
    
  2. Solution
    - Drop the existing constraint
    - Create a new constraint that includes 'agent'
*/

-- Drop the existing constraint
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_role_check;

-- Create a new constraint that includes 'agent'
ALTER TABLE public.users 
ADD CONSTRAINT users_role_check CHECK (
  role = ANY (ARRAY['member'::text, 'advisor'::text, 'admin'::text, 'agent'::text])
);

-- Add helpful notice about the constraint fix
DO $$
BEGIN
  RAISE NOTICE '=== USERS ROLE CONSTRAINT FIXED ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed users_role_check constraint:';
  RAISE NOTICE '✅ Added ''agent'' as a valid role';
  RAISE NOTICE '✅ Constraint now allows: member, advisor, admin, agent';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now insert users with role = ''agent''';
  RAISE NOTICE '================================================';
END $$;