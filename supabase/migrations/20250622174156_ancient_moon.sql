/*
  # Fix Affiliate Login Issues

  1. Problem
    - Users with 'agent' role can't access affiliate dashboard
    - No policy for 'affiliate' role in users table
    - Need to treat 'agent' as 'affiliate' for permissions
    
  2. Solution
    - Add 'affiliate' to users_role_check constraint
    - Create policy for affiliates to view their own profile
    - Add function to treat 'agent' as 'affiliate' for permissions
    - Update existing agent users to have affiliate_access
*/

-- Fix the users_role_check constraint to include 'affiliate'
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_role_check CHECK (
  role = ANY (ARRAY['member'::text, 'advisor'::text, 'admin'::text, 'agent'::text, 'affiliate'::text])
);

-- Create a policy for affiliates to view their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Affiliates can view own profile'
  ) THEN
    CREATE POLICY "Affiliates can view own profile"
      ON public.users
      FOR SELECT
      TO authenticated
      USING (
        id = auth.uid() OR
        (
          EXISTS (
            SELECT 1 FROM public.roles 
            WHERE id = auth.uid() 
            AND (role = 'affiliate' OR role = 'agent')
          )
        )
      );
  END IF;
END $$;

-- Create a function to treat 'agent' as 'affiliate' for permissions
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

-- Update existing agent users to have affiliate_access
DO $$
DECLARE
  agent_user record;
BEGIN
  FOR agent_user IN (
    SELECT id FROM public.users WHERE role = 'agent'
  ) LOOP
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
    WHERE id = agent_user.id;
  END LOOP;
END $$;

-- Drop the problematic SELECT policies
DROP POLICY IF EXISTS "Advisors can view assigned members" ON public.users;
DROP POLICY IF EXISTS "Agents can view referred members" ON public.users;

-- Create a combined policy for advisors and agents/affiliates
CREATE POLICY "Role-based member access policy"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    -- User can view their own profile
    id = auth.uid() OR
    -- Admin can view all profiles
    has_role('admin') OR
    -- Advisor can view assigned members
    (
      has_role('advisor') AND
      id IN (
        SELECT user_id 
        FROM member_profiles 
        WHERE advisor_id = auth.uid()
      )
    ) OR
    -- Agent/Affiliate can view referred members
    (
      (has_role('agent') OR has_role('affiliate')) AND
      id IN (
        SELECT referred_user_id 
        FROM affiliate_referrals 
        WHERE affiliate_id IN (
          SELECT id 
          FROM affiliates 
          WHERE user_id = auth.uid()
        )
      )
    )
  );