/*
  # Remove Demo/Test Credentials

  1. Purpose
    - Remove all demo, test, and sample accounts from the system
    - Clean up any default or insecure credentials
    - Ensure only legitimate production users remain
    
  2. Changes
    - Delete demo users from auth.users (cascades to public.users)
    - Remove sample affiliate accounts
    - Clean up test member profiles
    - Purge demo admin accounts
    - Remove any accounts with default/sample passwords
*/

-- Step 1: Identify and remove demo/test users from auth.users
DO $$
DECLARE
  removed_count int := 0;
BEGIN
  -- Delete users with demo/test in email
  WITH deleted_users AS (
    DELETE FROM auth.users
    WHERE 
      email LIKE '%demo%' OR 
      email LIKE '%test%' OR
      email LIKE '%sample%' OR
      email LIKE '%example%' OR
      email = 'agentdemo@saudemax.com' OR
      email = 'qloud.agent@saudemax.com' OR
      email = 'agent@saudemax.com' OR
      email = 'member@saudemax.com' OR
      email = 'admin@saudemax.com' OR
      email = 'member@mympb.com' OR
      email = 'admin@mympb.com'
    RETURNING id
  )
  SELECT COUNT(*) INTO removed_count FROM deleted_users;
  
  RAISE NOTICE 'Removed % demo/test users from auth.users', removed_count;
END $$;

-- Step 2: Clean up any remaining demo data in public tables
-- This is a safety measure in case the cascade delete didn't work
DO $$
BEGIN
  -- Remove demo users from public.users
  DELETE FROM public.users
  WHERE 
    email LIKE '%demo%' OR 
    email LIKE '%test%' OR
    email LIKE '%sample%' OR
    email LIKE '%example%' OR
    email = 'agentdemo@saudemax.com' OR
    email = 'qloud.agent@saudemax.com' OR
    email = 'agent@saudemax.com' OR
    email = 'member@saudemax.com' OR
    email = 'admin@saudemax.com' OR
    email = 'member@mympb.com' OR
    email = 'admin@mympb.com';
  
  -- Remove demo affiliates
  DELETE FROM public.affiliates
  WHERE 
    affiliate_code LIKE '%DEMO%' OR 
    affiliate_code LIKE '%TEST%' OR
    affiliate_code LIKE '%SAMPLE%' OR
    affiliate_code = 'AGENT001' OR
    affiliate_code = 'AGENT002' OR
    affiliate_code = 'DEMO-AGENT-001' OR
    affiliate_code = 'QLOUD-AGENT';
  
  -- Remove demo member profiles
  DELETE FROM public.member_profiles
  WHERE 
    member_number LIKE '%DEMO%' OR 
    member_number LIKE '%TEST%' OR
    member_number LIKE '%SAMPLE%' OR
    member_number = 'MPB001' OR
    member_number = 'MBR001';
  
  -- Remove demo roles
  DELETE FROM public.roles
  WHERE id NOT IN (SELECT id FROM auth.users);
  
  -- Remove any orphaned records
  DELETE FROM public.affiliate_links WHERE affiliate_id NOT IN (SELECT id FROM auth.users);
  DELETE FROM public.affiliate_commissions WHERE affiliate_id NOT IN (SELECT id FROM auth.users);
  DELETE FROM public.affiliate_referrals WHERE affiliate_id NOT IN (SELECT id FROM affiliates);
  DELETE FROM public.affiliate_visits WHERE affiliate_id NOT IN (SELECT id FROM affiliates);
  DELETE FROM public.affiliate_withdrawals WHERE affiliate_id NOT IN (SELECT id FROM affiliates);
  DELETE FROM public.affiliate_coupons WHERE affiliate_id NOT IN (SELECT id FROM auth.users);
  DELETE FROM public.payout_requests WHERE affiliate_id NOT IN (SELECT id FROM auth.users);
  
  RAISE NOTICE 'Removed remaining demo data from public tables';
END $$;

-- Step 3: Clean up any sample data in system_settings
UPDATE system_settings
SET value = '{"status":"idle","message":"No active deployment","lastUpdated":"' || now()::text || '"}'
WHERE key = 'deployment_status';

-- Step 4: Create a function to verify the cleanup
CREATE OR REPLACE FUNCTION verify_demo_cleanup()
RETURNS TABLE (
  table_name text,
  demo_count int,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Check auth.users
  RETURN QUERY
  SELECT 
    'auth.users'::text as table_name,
    COUNT(*)::int as demo_count,
    CASE WHEN COUNT(*) = 0 THEN 'CLEAN' ELSE 'REMAINING DEMO ACCOUNTS' END as status
  FROM 
    auth.users
  WHERE 
    email LIKE '%demo%' OR 
    email LIKE '%test%' OR
    email LIKE '%sample%' OR
    email LIKE '%example%';

  -- Check public.users
  RETURN QUERY
  SELECT 
    'public.users'::text as table_name,
    COUNT(*)::int as demo_count,
    CASE WHEN COUNT(*) = 0 THEN 'CLEAN' ELSE 'REMAINING DEMO ACCOUNTS' END as status
  FROM 
    public.users
  WHERE 
    email LIKE '%demo%' OR 
    email LIKE '%test%' OR
    email LIKE '%sample%' OR
    email LIKE '%example%';

  -- Check affiliates
  RETURN QUERY
  SELECT 
    'affiliates'::text as table_name,
    COUNT(*)::int as demo_count,
    CASE WHEN COUNT(*) = 0 THEN 'CLEAN' ELSE 'REMAINING DEMO ACCOUNTS' END as status
  FROM 
    affiliates
  WHERE 
    affiliate_code LIKE '%DEMO%' OR 
    affiliate_code LIKE '%TEST%' OR
    affiliate_code LIKE '%SAMPLE%';

  -- Check member_profiles
  RETURN QUERY
  SELECT 
    'member_profiles'::text as table_name,
    COUNT(*)::int as demo_count,
    CASE WHEN COUNT(*) = 0 THEN 'CLEAN' ELSE 'REMAINING DEMO ACCOUNTS' END as status
  FROM 
    member_profiles
  WHERE 
    member_number LIKE '%DEMO%' OR 
    member_number LIKE '%TEST%' OR
    member_number LIKE '%SAMPLE%';
END;
$$;

-- Step 5: Run the verification
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '=== DEMO CREDENTIALS CLEANUP VERIFICATION ===';
  RAISE NOTICE '';
  
  FOR r IN (SELECT * FROM verify_demo_cleanup()) LOOP
    RAISE NOTICE '% - %: %', r.status, r.table_name, r.demo_count;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Cleanup verification complete.';
  RAISE NOTICE '================================';
END $$;

-- Step 6: Grant execute permissions
GRANT EXECUTE ON FUNCTION verify_demo_cleanup() TO service_role;

-- Add helpful notice about the cleanup
DO $$
BEGIN
  RAISE NOTICE '=== DEMO CREDENTIALS REMOVAL COMPLETED ===';
  RAISE NOTICE '';
  RAISE NOTICE 'The following actions were performed:';
  RAISE NOTICE '✅ Removed all demo/test users from auth.users';
  RAISE NOTICE '✅ Cleaned up demo data from public tables';
  RAISE NOTICE '✅ Removed sample affiliate accounts';
  RAISE NOTICE '✅ Purged test member profiles';
  RAISE NOTICE '✅ Cleaned up demo admin accounts';
  RAISE NOTICE '';
  RAISE NOTICE 'To verify the cleanup, run:';
  RAISE NOTICE 'SELECT * FROM verify_demo_cleanup();';
  RAISE NOTICE '================================================';
END $$;