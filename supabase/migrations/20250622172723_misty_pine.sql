/*
  # Fix Affiliate RLS Policies

  1. Problem
    - Missing affiliate policy for users table
    - Existing policies for "Agents" and "Advisors" but not "Affiliates"
    
  2. Solution
    - Remove problematic SELECT policies for Advisors and Agents
    - Add proper policy for Affiliates to access their own profiles
    - Ensure both 'agent' and 'affiliate' roles have proper access
*/

-- Drop the problematic SELECT policies
DROP POLICY IF EXISTS "Advisors can view assigned members" ON public.users;
DROP POLICY IF EXISTS "Agents can view referred members" ON public.users;

-- Create a proper policy for affiliates
CREATE POLICY "Affiliates can view own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    (
      has_role('affiliate') OR
      has_role('agent')
    )
  );

-- Create a policy for affiliates to view referred members
CREATE POLICY "Affiliates can view referred members"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT referred_user_id 
      FROM affiliate_referrals 
      WHERE affiliate_id IN (
        SELECT id 
        FROM affiliates 
        WHERE user_id = auth.uid()
      )
    ) AND (
      has_role('affiliate') OR
      has_role('agent')
    )
  );

-- Ensure the users_role_check constraint includes 'affiliate'
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_role_check CHECK (
  role = ANY (ARRAY['member'::text, 'advisor'::text, 'admin'::text, 'agent'::text, 'affiliate'::text])
);

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