-- This migration adds demo user roles and profiles without violating foreign key constraints
-- It only creates entries in the roles table if the corresponding auth.users entries exist

DO $$
DECLARE
  member_user_id uuid := '550e8400-e29b-41d4-a716-446655440001';
  admin_user_id uuid := '550e8400-e29b-41d4-a716-446655440002';
  member_exists boolean;
  admin_exists boolean;
  auth_member_exists boolean;
  auth_admin_exists boolean;
BEGIN
  -- Check if users already exist in auth.users (this is the foreign key constraint)
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = member_user_id) INTO auth_member_exists;
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = admin_user_id) INTO auth_admin_exists;
  
  -- Check if users already exist in public.users
  SELECT EXISTS(SELECT 1 FROM public.users WHERE email = 'member@mympb.com') INTO member_exists;
  SELECT EXISTS(SELECT 1 FROM public.users WHERE email = 'admin@mympb.com') INTO admin_exists;
  
  -- Only insert into public.users if they don't exist AND the auth user exists
  IF NOT member_exists AND auth_member_exists THEN
    INSERT INTO public.users (id, email, full_name, role, is_active, created_at, updated_at)
    VALUES (member_user_id, 'member@mympb.com', 'Demo Member', 'member', true, now(), now());
    
    -- Only insert into roles if the auth user exists
    INSERT INTO public.roles (id, role, created_at, updated_at)
    VALUES (member_user_id, 'member', now(), now())
    ON CONFLICT (id) DO UPDATE SET
      role = EXCLUDED.role,
      updated_at = now();
    
    -- Create a member profile for the demo member if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM public.member_profiles WHERE user_id = member_user_id) THEN
      INSERT INTO public.member_profiles (
        id,
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
        gen_random_uuid(),
        member_user_id,
        'MPB001',
        'basic',
        'Basic Plan',
        'individual',
        'active',
        CURRENT_DATE - INTERVAL '30 days',
        CURRENT_DATE + INTERVAL '30 days',
        99.99,
        now(),
        now()
      );
    END IF;
  END IF;
  
  IF NOT admin_exists AND auth_admin_exists THEN
    INSERT INTO public.users (id, email, full_name, role, is_active, created_at, updated_at)
    VALUES (admin_user_id, 'admin@mympb.com', 'Demo Admin', 'admin', true, now(), now());
    
    -- Only insert into roles if the auth user exists
    INSERT INTO public.roles (id, role, created_at, updated_at)
    VALUES (admin_user_id, 'admin', now(), now())
    ON CONFLICT (id) DO UPDATE SET
      role = EXCLUDED.role,
      updated_at = now();
  END IF;
  
  -- Create a view to show active migrated members
  CREATE OR REPLACE VIEW v_active_migrated_members AS
  SELECT * FROM migrated_members
  WHERE is_active = true;
END $$;

-- Create a function to help with user creation (for reference)
CREATE OR REPLACE FUNCTION create_demo_auth_user(
  user_email text,
  user_password text,
  user_id uuid,
  user_role text DEFAULT 'member'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- This function would need to be called with admin privileges
  -- It's provided as a reference for manual user creation
  
  -- In practice, you would:
  -- 1. Go to Supabase Dashboard > Authentication > Users
  -- 2. Click "Add user"
  -- 3. Enter email: member@mympb.com, password: password123
  -- 4. Set user ID to: 550e8400-e29b-41d4-a716-446655440001
  -- 5. Repeat for admin user with ID: 550e8400-e29b-41d4-a716-446655440002
  
  RETURN json_build_object(
    'message', 'Please create users manually in Supabase Dashboard',
    'email', user_email,
    'id', user_id,
    'role', user_role
  );
END;
$$;

-- Add helpful notice about the demo users
DO $$
BEGIN
  RAISE NOTICE '=== DEMO USERS SETUP ===';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: You must first create these users in Supabase Dashboard:';
  RAISE NOTICE '1. Email: member@mympb.com, Password: password123, ID: 550e8400-e29b-41d4-a716-446655440001';
  RAISE NOTICE '2. Email: admin@mympb.com, Password: password123, ID: 550e8400-e29b-41d4-a716-446655440002';
  RAISE NOTICE '';
  RAISE NOTICE 'This migration will only create profiles and roles if the auth users already exist.';
  RAISE NOTICE 'After creating the auth users, re-run this migration to complete the setup.';
  RAISE NOTICE '========================';
END $$;