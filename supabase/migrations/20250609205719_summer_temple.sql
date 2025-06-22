/*
  # Setup Demo User Functions and Triggers

  1. Functions
    - Creates function to set up demo user data after auth user creation
    - Creates trigger function to handle new user creation
  
  2. Triggers
    - Sets up trigger on auth.users to automatically create supporting data
  
  3. Notes
    - No direct user insertions to avoid foreign key constraint errors
    - Users must be created through Supabase Auth (dashboard or API)
    - Supporting data will be automatically created via triggers
*/

-- Create a function to set up demo user data after auth user creation
CREATE OR REPLACE FUNCTION setup_demo_user_data(
  auth_user_id uuid,
  user_email text,
  user_name text,
  user_role text
) RETURNS void AS $$
BEGIN
  -- Insert into public.users table
  INSERT INTO public.users (id, email, full_name, role, preferred_language, is_active, created_at, updated_at)
  VALUES (auth_user_id, user_email, user_name, user_role, 'en', true, now(), now())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = now();

  -- If this is a member, create member profile
  IF user_role = 'member' THEN
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
    SELECT 
      mp.id,
      true,
      true,
      true,
      true,
      false,
      now(),
      now()
    FROM public.member_profiles mp
    WHERE mp.user_id = auth_user_id
    ON CONFLICT (member_profile_id) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger function to automatically set up user data when auth users are created
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS trigger AS $$
BEGIN
  -- Check if this is one of our demo users and set up accordingly
  IF NEW.email = 'member@saudemax.com' THEN
    PERFORM setup_demo_user_data(NEW.id, NEW.email, 'John Doe', 'member');
  ELSIF NEW.email = 'admin@saudemax.com' THEN
    PERFORM setup_demo_user_data(NEW.id, NEW.email, 'Admin User', 'admin');
  ELSE
    -- For any other user, create a basic user record
    INSERT INTO public.users (id, email, full_name, role, preferred_language, is_active, created_at, updated_at)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), 'member', 'en', true, now(), now())
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users (if it doesn't exist)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();