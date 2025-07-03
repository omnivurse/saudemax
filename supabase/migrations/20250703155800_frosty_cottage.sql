/*
  # Fix Trigger Function Calls

  1. New Functions
    - `update_affiliate_stats_core` - Helper function that contains the core logic
    - `handle_agent_role_core` - Helper function that contains the core logic

  2. Changes
    - Update trigger functions to call the core helper functions
    - This prevents "trigger functions can only be called as triggers" errors
    - Allows the same logic to be called from both triggers and application code

  This migration fixes the "Database error creating new user" error during affiliate registration
  by ensuring trigger functions are only used as triggers, and shared logic is in helper functions.
*/

-- Step 1: Create a helper function for update_affiliate_stats
CREATE OR REPLACE FUNCTION public.update_affiliate_stats_core(affiliate_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update affiliate totals
  UPDATE affiliates SET
    total_referrals = (
      SELECT COUNT(*) FROM affiliate_referrals 
      WHERE affiliate_id = update_affiliate_stats_core.affiliate_id
    ),
    total_earnings = (
      SELECT COALESCE(SUM(commission_amount), 0) 
      FROM affiliate_referrals 
      WHERE affiliate_id = update_affiliate_stats_core.affiliate_id 
      AND status IN ('approved', 'paid')
    ),
    updated_at = now()
  WHERE id = update_affiliate_stats_core.affiliate_id;
END;
$$;

-- Step 2: Update the trigger function to call the helper
CREATE OR REPLACE FUNCTION public.update_affiliate_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Call the core function with the affiliate_id from the trigger
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM update_affiliate_stats_core(NEW.affiliate_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Step 3: Create a helper function for handle_agent_role
CREATE OR REPLACE FUNCTION public.handle_agent_role_core(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update app_metadata to include both roles
  UPDATE auth.users
  SET raw_app_metadata = 
    CASE 
      WHEN raw_app_metadata IS NULL THEN 
        jsonb_build_object('role', 'agent', 'affiliate_access', true)
      ELSE
        jsonb_set(
          jsonb_set(raw_app_metadata, '{role}', to_jsonb('agent')),
          '{affiliate_access}', 
          to_jsonb(true)
        )
    END
  WHERE id = user_id;
END;
$$;

-- Step 4: Update the trigger function to call the helper
CREATE OR REPLACE FUNCTION public.handle_agent_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If role is 'agent', treat it as 'affiliate' for permissions
  IF NEW.role = 'agent' THEN
    -- Call the core function with the user ID from the trigger
    PERFORM handle_agent_role_core(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 5: Create a helper function for sync_role_claim
CREATE OR REPLACE FUNCTION public.sync_role_claim_core(user_id uuid, user_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update app_metadata with the role
  UPDATE auth.users
  SET raw_app_metadata = 
    CASE 
      WHEN raw_app_metadata IS NULL THEN 
        jsonb_build_object('role', user_role)
      ELSE
        jsonb_set(raw_app_metadata, '{role}', to_jsonb(user_role))
    END
  WHERE id = user_id;
END;
$$;

-- Step 6: Update the trigger function to call the helper
CREATE OR REPLACE FUNCTION public.sync_role_claim()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Call the core function with the user ID and role from the trigger
  PERFORM sync_role_claim_core(NEW.id, NEW.role);
  RETURN NEW;
END;
$$;

-- Step 7: Create a helper function for handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user_core(user_id uuid, user_email text, user_metadata jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  full_name text;
  default_role text := 'member';
BEGIN
  -- Extract full_name from user_metadata
  full_name := user_metadata->>'full_name';
  
  -- Extract role from user_metadata if it exists
  IF user_metadata ? 'role' THEN
    default_role := user_metadata->>'role';
  END IF;
  
  -- Insert into public.users
  INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    role, 
    is_active
  ) VALUES (
    user_id, 
    user_email, 
    full_name, 
    default_role, 
    TRUE
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert into public.roles
  INSERT INTO public.roles (
    id, 
    role
  ) VALUES (
    user_id, 
    default_role
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Step 8: Update the trigger function to call the helper
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Call the core function with the user data from the trigger
  PERFORM handle_new_user_core(NEW.id, NEW.email, NEW.raw_user_meta_data);
  RETURN NEW;
END;
$$;

-- Step 9: Ensure the triggers are properly set up
DROP TRIGGER IF EXISTS on_agent_role_update ON public.roles;
CREATE TRIGGER on_agent_role_update
  AFTER INSERT OR UPDATE ON public.roles
  FOR EACH ROW WHEN (NEW.role = 'agent')
  EXECUTE FUNCTION handle_agent_role();

DROP TRIGGER IF EXISTS on_role_update ON public.users;
CREATE TRIGGER on_role_update
  AFTER INSERT OR UPDATE OF role ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_role_claim();

-- Note: The handle_new_user trigger should be created in auth.users table
-- This is typically done in a separate migration or through Supabase dashboard
-- as it requires access to the auth schema