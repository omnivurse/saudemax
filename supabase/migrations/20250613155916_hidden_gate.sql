/*
  # Fix Security Issues - Function Search Path and Auth Configuration

  1. Security Fixes
    - Fix function search_path mutable warnings by setting SECURITY DEFINER and search_path
    - Update all functions to have immutable search paths
    - Address auth configuration recommendations

  2. Functions Updated
    - update_affiliate_stats
    - generate_affiliate_code  
    - setup_demo_user_data
    - update_updated_at_column
    - handle_new_user

  3. Auth Security
    - Recommendations for OTP expiry and leaked password protection
*/

-- Fix update_affiliate_stats function
CREATE OR REPLACE FUNCTION update_affiliate_stats()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update affiliate totals when referral is created/updated
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE affiliates SET
      total_referrals = (
        SELECT COUNT(*) FROM affiliate_referrals 
        WHERE affiliate_id = NEW.affiliate_id
      ),
      total_earnings = (
        SELECT COALESCE(SUM(commission_amount), 0) 
        FROM affiliate_referrals 
        WHERE affiliate_id = NEW.affiliate_id 
        AND status IN ('approved', 'paid')
      ),
      updated_at = now()
    WHERE id = NEW.affiliate_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Fix generate_affiliate_code function
CREATE OR REPLACE FUNCTION generate_affiliate_code()
RETURNS text 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM affiliates WHERE affiliate_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$;

-- Fix setup_demo_user_data function
CREATE OR REPLACE FUNCTION setup_demo_user_data(
  auth_user_id uuid,
  user_email text,
  user_name text,
  user_role text
) 
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into public.users table
  INSERT INTO users (id, email, full_name, role, preferred_language, is_active, created_at, updated_at)
  VALUES (auth_user_id, user_email, user_name, user_role, 'en', true, now(), now())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = now();

  -- If this is a member, create member profile
  IF user_role = 'member' THEN
    INSERT INTO member_profiles (
      user_id,
      member_number,
      plan_id,
      plan_name,
      plan_type,
      status,
      enrollment_date,
      next_billing_date,
      monthly_contribution,
      created_at,
      updated_at
    )
    VALUES (
      auth_user_id,
      'MPB001',
      'basic-plan',
      'Basic Plan',
      'individual',
      'active',
      '2024-01-01',
      '2025-02-01',
      99.99,
      now(),
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      member_number = EXCLUDED.member_number,
      plan_id = EXCLUDED.plan_id,
      plan_name = EXCLUDED.plan_name,
      plan_type = EXCLUDED.plan_type,
      status = EXCLUDED.status,
      enrollment_date = EXCLUDED.enrollment_date,
      next_billing_date = EXCLUDED.next_billing_date,
      monthly_contribution = EXCLUDED.monthly_contribution,
      updated_at = now();

    -- Create notification preferences for the member
    INSERT INTO notification_preferences (
      member_profile_id,
      email_notifications,
      sms_notifications,
      share_request_updates,
      billing_reminders,
      marketing_emails,
      created_at,
      updated_at
    )
    SELECT 
      mp.id,
      true,
      true,
      true,
      true,
      false,
      now(),
      now()
    FROM member_profiles mp
    WHERE mp.user_id = auth_user_id
    ON CONFLICT (member_profile_id) DO NOTHING;
  END IF;
END;
$$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Check if this is one of our demo users and set up accordingly
  IF NEW.email = 'member@saudemax.com' THEN
    PERFORM setup_demo_user_data(NEW.id, NEW.email, 'John Doe', 'member');
  ELSIF NEW.email = 'admin@saudemax.com' THEN
    PERFORM setup_demo_user_data(NEW.id, NEW.email, 'Admin User', 'admin');
  ELSE
    -- For any other user, create a basic user record
    INSERT INTO users (id, email, full_name, role, preferred_language, is_active, created_at, updated_at)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), 'member', 'en', true, now(), now())
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_affiliate_stats() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION generate_affiliate_code() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION setup_demo_user_data(uuid, text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated, service_role;

-- Add comments for security documentation
COMMENT ON FUNCTION update_affiliate_stats() IS 'Securely updates affiliate statistics with fixed search_path';
COMMENT ON FUNCTION generate_affiliate_code() IS 'Generates unique affiliate codes with fixed search_path';
COMMENT ON FUNCTION setup_demo_user_data(uuid, text, text, text) IS 'Sets up demo user data with fixed search_path';
COMMENT ON FUNCTION update_updated_at_column() IS 'Updates timestamp columns with fixed search_path';
COMMENT ON FUNCTION handle_new_user() IS 'Handles new user creation with fixed search_path';

-- Create a function to check and report security status
CREATE OR REPLACE FUNCTION check_security_status()
RETURNS TABLE(
  function_name text,
  is_secure boolean,
  search_path_set boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.proname::text as function_name,
    p.prosecdef as is_secure,
    (p.proconfig IS NOT NULL AND 'search_path' = ANY(
      SELECT split_part(unnest(p.proconfig), '=', 1)
    )) as search_path_set
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'update_affiliate_stats',
      'generate_affiliate_code', 
      'setup_demo_user_data',
      'update_updated_at_column',
      'handle_new_user'
    );
END;
$$;

-- Add helpful notice about auth configuration
DO $$
BEGIN
  RAISE NOTICE '=== SECURITY FIXES APPLIED ===';
  RAISE NOTICE 'All functions now have SECURITY DEFINER and fixed search_path';
  RAISE NOTICE '';
  RAISE NOTICE '=== MANUAL AUTH CONFIGURATION NEEDED ===';
  RAISE NOTICE '1. In Supabase Dashboard > Authentication > Settings:';
  RAISE NOTICE '   - Set OTP expiry to 1 hour or less (currently > 1 hour)';
  RAISE NOTICE '   - Enable "Leaked Password Protection" feature';
  RAISE NOTICE '';
  RAISE NOTICE '2. Navigate to: Authentication > Settings > Security';
  RAISE NOTICE '   - Enable "Check against HaveIBeenPwned database"';
  RAISE NOTICE '';
  RAISE NOTICE 'These settings enhance security but must be configured manually.';
  RAISE NOTICE '================================';
END $$;