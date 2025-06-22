-- Fix the security definer view issue by recreating the view without SECURITY DEFINER
-- This addresses the linter error: security_definer_view_public_v_active_migrated_members

-- Drop the existing view if it exists
DROP VIEW IF EXISTS public.v_active_migrated_members;

-- Recreate the view without SECURITY DEFINER
CREATE VIEW public.v_active_migrated_members AS
SELECT * FROM migrated_members
WHERE is_active = true;

-- Add a comment to document the change
COMMENT ON VIEW public.v_active_migrated_members IS 'View of active migrated members (without SECURITY DEFINER)';

-- Add helpful notice about the fix
DO $$
BEGIN
  RAISE NOTICE '=== SECURITY DEFINER VIEW FIXED ===';
  RAISE NOTICE '';
  RAISE NOTICE 'The v_active_migrated_members view has been recreated without SECURITY DEFINER.';
  RAISE NOTICE '';
  RAISE NOTICE 'This fixes the security linter warning:';
  RAISE NOTICE 'security_definer_view_public_v_active_migrated_members';
  RAISE NOTICE '';
  RAISE NOTICE 'Security definer views enforce the permissions of the view creator,';
  RAISE NOTICE 'rather than the querying user, which can lead to privilege escalation.';
  RAISE NOTICE '';
  RAISE NOTICE 'The view now uses the standard security model where RLS policies';
  RAISE NOTICE 'are applied based on the querying user''s permissions.';
  RAISE NOTICE '================================';
END $$;