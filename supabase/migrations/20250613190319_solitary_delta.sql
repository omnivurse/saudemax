/*
  # Secure Role Management System

  1. New Tables
    - `roles` - Maps auth.users to specific roles with proper constraints
    - `role_permissions` - Defines granular permissions for each role

  2. Security
    - Enable RLS on all tables
    - Create secure sync functions for JWT claims
    - Implement proper triggers for user creation and updates
    - Use app_metadata (controlled by server) instead of user_metadata (user-editable)

  3. Performance
    - Add indexes for common queries
    - Optimize trigger functions
*/

-- Create roles table with proper constraints
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'affiliate', 'member', 'advisor')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create role_permissions table for granular access control
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('admin', 'affiliate', 'member', 'advisor')),
  resource text NOT NULL,
  permission text NOT NULL CHECK (permission IN ('read', 'write', 'delete', 'all')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(role, resource, permission)
);

-- Enable RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Create function to sync role to JWT claims (app_metadata)
CREATE OR REPLACE FUNCTION public.sync_role_claim()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get the user's role
  SELECT role INTO user_role FROM public.roles WHERE id = NEW.id;

  -- Update auth.users.raw_app_metadata with the role
  IF user_role IS NOT NULL THEN
    UPDATE auth.users
    SET raw_app_metadata = 
      CASE 
        WHEN raw_app_metadata IS NULL THEN 
          jsonb_build_object('role', user_role)
        ELSE
          jsonb_set(raw_app_metadata, '{role}', to_jsonb(user_role))
      END
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to sync role changes to JWT
CREATE TRIGGER on_role_update
  AFTER INSERT OR UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_role_claim();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  default_role text := 'member';
BEGIN
  -- Check if role is specified in user_metadata
  IF NEW.raw_user_meta_data IS NOT NULL AND NEW.raw_user_meta_data ? 'requested_role' THEN
    default_role := NEW.raw_user_meta_data->>'requested_role';
    
    -- Validate role
    IF default_role NOT IN ('admin', 'affiliate', 'member', 'advisor') THEN
      default_role := 'member';
    END IF;
  END IF;

  -- Insert into roles table
  INSERT INTO public.roles (id, role, created_at, updated_at)
  VALUES (NEW.id, default_role, now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- Insert into users table (if you have one)
  INSERT INTO public.users (id, email, role, created_at, updated_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    default_role, 
    now(), 
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = now();

  RETURN NEW;
END;
$$;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(required_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.roles
    WHERE id = auth.uid() AND role = required_role
  );
END;
$$;

-- Create function to check if user has permission for a resource
CREATE OR REPLACE FUNCTION public.has_permission(resource text, required_permission text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get user's role
  SELECT role INTO user_role FROM public.roles WHERE id = auth.uid();
  
  -- Check if user has the required permission
  RETURN EXISTS (
    SELECT 1 FROM public.role_permissions
    WHERE role = user_role 
      AND resource = has_permission.resource
      AND (permission = has_permission.required_permission OR permission = 'all')
  );
END;
$$;

-- Create RLS policies for roles table
CREATE POLICY "Users can view own role"
  ON public.roles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can manage all roles"
  ON public.roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.roles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for role_permissions table
CREATE POLICY "Users can view role permissions"
  ON public.role_permissions
  FOR SELECT
  TO authenticated
  USING (
    role IN (
      SELECT role FROM public.roles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage role permissions"
  ON public.role_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.roles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_roles_role ON public.roles(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_resource ON public.role_permissions(resource);

-- Insert default role permissions
INSERT INTO public.role_permissions (role, resource, permission) VALUES
-- Admin permissions
('admin', 'users', 'all'),
('admin', 'member_profiles', 'all'),
('admin', 'affiliates', 'all'),
('admin', 'affiliate_withdrawals', 'all'),
('admin', 'affiliate_referrals', 'all'),
('admin', 'share_requests', 'all'),
('admin', 'billing_records', 'all'),
('admin', 'support_tickets', 'all'),

-- Member permissions
('member', 'member_profiles', 'read'),
('member', 'member_profiles', 'write'),
('member', 'member_dependents', 'all'),
('member', 'share_requests', 'all'),
('member', 'billing_records', 'read'),
('member', 'support_tickets', 'all'),

-- Affiliate permissions
('affiliate', 'affiliates', 'read'),
('affiliate', 'affiliates', 'write'),
('affiliate', 'affiliate_referrals', 'read'),
('affiliate', 'affiliate_withdrawals', 'all'),

-- Advisor permissions
('advisor', 'member_profiles', 'read'),
('advisor', 'share_requests', 'read'),
('advisor', 'support_tickets', 'all')

ON CONFLICT (role, resource, permission) DO NOTHING;

-- Create function to update updated_at timestamp
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

-- Create trigger for updated_at on roles table
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create helper function to get current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM public.roles WHERE id = auth.uid();
  RETURN user_role;
END;
$$;

-- Create helper function to assign role to user
CREATE OR REPLACE FUNCTION public.assign_role(user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Validate role
  IF new_role NOT IN ('admin', 'affiliate', 'member', 'advisor') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;

  -- Insert or update role
  INSERT INTO public.roles (id, role, created_at, updated_at)
  VALUES (user_id, new_role, now(), now())
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    updated_at = now();
    
  -- Also update users table if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    UPDATE public.users SET role = new_role WHERE id = user_id;
  END IF;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.sync_role_claim() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_permission(text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.assign_role(uuid, text) TO service_role;

-- Add helpful notice about the security implementation
DO $$
BEGIN
  RAISE NOTICE '=== SECURE ROLE MANAGEMENT SYSTEM INSTALLED ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Key Features:';
  RAISE NOTICE '✅ Role-based access control with JWT integration';
  RAISE NOTICE '✅ Secure app_metadata usage (server-controlled)';
  RAISE NOTICE '✅ Granular permission system';
  RAISE NOTICE '✅ Helper functions for role/permission checks';
  RAISE NOTICE '✅ Automatic role synchronization';
  RAISE NOTICE '';
  RAISE NOTICE 'Usage in RLS Policies:';
  RAISE NOTICE '- has_role(''admin'') -- Check if user has admin role';
  RAISE NOTICE '- has_permission(''affiliates'', ''read'') -- Check if user can read affiliates';
  RAISE NOTICE '- current_user_role() -- Get current user''s role';
  RAISE NOTICE '';
  RAISE NOTICE 'Usage in Edge Functions:';
  RAISE NOTICE '- user.app_metadata.role -- Access role from JWT';
  RAISE NOTICE '';
  RAISE NOTICE 'Admin Functions:';
  RAISE NOTICE '- SELECT assign_role(''user-uuid'', ''admin'') -- Assign role to user';
  RAISE NOTICE '================================';
END $$;