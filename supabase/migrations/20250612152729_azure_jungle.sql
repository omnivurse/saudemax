/*
  # Create demo users for testing - Safe Version

  1. New Users
    - Only creates demo data if corresponding auth.users exist
    - Uses conditional logic to avoid foreign key constraint errors
    - Creates corresponding profiles in public.users table
    - Creates member profile for the demo member user

  2. Security
    - Uses proper foreign key relationships
    - Sets up correct user roles
    - Links auth users to profile tables only when they exist

  3. Demo Credentials
    - Member: member@saudemax.com / password123
    - Admin: admin@saudemax.com / password123
    
  Note: Auth users must be created manually in Supabase dashboard first
*/

-- Function to safely create demo user data only if auth user exists
CREATE OR REPLACE FUNCTION create_demo_user_if_exists(
  user_email text,
  user_name text,
  user_role text,
  member_number text DEFAULT NULL
) RETURNS void AS $$
DECLARE
  auth_user_id uuid;
  member_profile_id uuid;
BEGIN
  -- Check if auth user exists
  SELECT id INTO auth_user_id 
  FROM auth.users 
  WHERE email = user_email 
  LIMIT 1;
  
  -- Only proceed if auth user exists
  IF auth_user_id IS NOT NULL THEN
    -- Insert or update public.users record
    INSERT INTO public.users (id, email, full_name, role, is_active, created_at, updated_at)
    VALUES (auth_user_id, user_email, user_name, user_role, true, now(), now())
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      updated_at = now();
    
    -- If this is a member, create member profile
    IF user_role = 'member' AND member_number IS NOT NULL THEN
      INSERT INTO public.member_profiles (
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
        member_number,
        'basic-plan',
        'Basic Plan',
        'individual',
        'active',
        '2024-01-01',
        '2024-02-01',
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

      -- Get the member profile ID for notification preferences
      SELECT id INTO member_profile_id 
      FROM public.member_profiles 
      WHERE user_id = auth_user_id;

      -- Create notification preferences for the member
      IF member_profile_id IS NOT NULL THEN
        INSERT INTO public.notification_preferences (
          member_profile_id,
          email_notifications,
          sms_notifications,
          share_request_updates,
          billing_reminders,
          marketing_emails,
          created_at,
          updated_at
        )
        VALUES (
          member_profile_id,
          true,
          true,
          true,
          true,
          false,
          now(),
          now()
        )
        ON CONFLICT (member_profile_id) DO UPDATE SET
          updated_at = now();
      END IF;
    END IF;
    
    RAISE NOTICE 'Demo user created/updated: %', user_email;
  ELSE
    RAISE NOTICE 'Auth user not found, skipping demo data creation for: %', user_email;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Attempt to create demo users (will only work if auth users exist)
SELECT create_demo_user_if_exists('member@saudemax.com', 'John Doe', 'member', 'MBR001');
SELECT create_demo_user_if_exists('admin@saudemax.com', 'Admin User', 'admin');

-- Clean up the function
DROP FUNCTION IF EXISTS create_demo_user_if_exists(text, text, text, text);

-- Add some helpful comments about manual user creation
DO $$
BEGIN
  RAISE NOTICE '=== DEMO USER SETUP ===';
  RAISE NOTICE 'To complete demo setup, create these users in Supabase Dashboard:';
  RAISE NOTICE '1. Email: member@saudemax.com, Password: password123';
  RAISE NOTICE '2. Email: admin@saudemax.com, Password: password123';
  RAISE NOTICE 'Then re-run this migration to create the profile data.';
  RAISE NOTICE '========================';
END $$;