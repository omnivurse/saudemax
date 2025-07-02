/*
  # Fix User Creation Issues

  1. Changes
     - Modify the users table role constraint to accept 'agent' role
     - Add 'agent' to the roles table role constraint
     - Create a trigger to handle agent role properly

  2. Security
     - Maintains existing RLS policies
     - Ensures proper role assignment
*/

-- Fix the users table role constraint to include 'agent'
ALTER TABLE IF EXISTS public.users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role = ANY (ARRAY['member'::text, 'advisor'::text, 'admin'::text, 'agent'::text, 'affiliate'::text]));

-- Fix the roles table role constraint to include 'agent'
ALTER TABLE IF EXISTS public.roles 
DROP CONSTRAINT IF EXISTS roles_role_check;

ALTER TABLE public.roles 
ADD CONSTRAINT roles_role_check 
CHECK (role = ANY (ARRAY['admin'::text, 'affiliate'::text, 'member'::text, 'advisor'::text, 'agent'::text]));

-- Create or replace the function to handle agent role
CREATE OR REPLACE FUNCTION public.handle_agent_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If role is 'agent', treat it as 'affiliate' for permissions
  IF NEW.role = 'agent' THEN
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
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS on_agent_role_update ON public.roles;
CREATE TRIGGER on_agent_role_update
  AFTER INSERT OR UPDATE ON public.roles
  FOR EACH ROW
  WHEN (NEW.role = 'agent')
  EXECUTE FUNCTION public.handle_agent_role();

-- Create a helper function to check if a user has affiliate access
CREATE OR REPLACE FUNCTION public.has_affiliate_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _user_id uuid;
  _user_role text;
  _app_metadata jsonb;
BEGIN
  -- Get the current user ID
  _user_id := auth.uid();
  
  -- Get user role from roles table
  SELECT role INTO _user_role FROM public.roles WHERE id = _user_id;
  
  -- Check if user has affiliate role or agent role
  IF _user_role IN ('affiliate', 'agent') THEN
    RETURN true;
  END IF;
  
  -- Check app_metadata for affiliate_access flag
  SELECT raw_app_metadata INTO _app_metadata FROM auth.users WHERE id = _user_id;
  
  IF _app_metadata->>'affiliate_access' = 'true' THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Create a function to assign a role to a user
CREATE OR REPLACE FUNCTION public.assign_role(user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Validate role
  IF new_role NOT IN ('admin', 'affiliate', 'member', 'advisor', 'agent') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;

  -- Update roles table
  INSERT INTO public.roles (id, role)
  VALUES (user_id, new_role)
  ON CONFLICT (id) 
  DO UPDATE SET 
    role = new_role,
    updated_at = now();
    
  -- Update users table
  UPDATE public.users
  SET role = new_role,
      updated_at = now()
  WHERE id = user_id;
  
  -- Update auth.users app_metadata
  UPDATE auth.users
  SET raw_app_metadata = 
    CASE 
      WHEN raw_app_metadata IS NULL THEN 
        jsonb_build_object('role', new_role)
      ELSE
        jsonb_set(raw_app_metadata, '{role}', to_jsonb(new_role))
    END
  WHERE id = user_id;
  
  -- If role is agent, also set affiliate_access
  IF new_role = 'agent' THEN
    UPDATE auth.users
    SET raw_app_metadata = 
      jsonb_set(
        COALESCE(raw_app_metadata, '{}'::jsonb),
        '{affiliate_access}',
        'true'::jsonb
      )
    WHERE id = user_id;
  END IF;
END;
$$;