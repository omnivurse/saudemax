/*
  # Create Agent Demo User

  1. New User
    - Creates a demo agent user with proper role assignments
    - Sets up affiliate profile and sample data
    
  2. Security
    - Uses proper role assignments
    - Creates necessary records in all related tables
*/

-- Create a function to set up the agent demo user
CREATE OR REPLACE FUNCTION setup_agent_demo_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  agent_user_id uuid := '550e8400-e29b-41d4-a716-446655440003';
  agent_exists boolean;
  auth_agent_exists boolean;
  affiliate_id uuid;
BEGIN
  -- Check if user already exists in auth.users
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'agent@saudemax.com') INTO auth_agent_exists;
  
  -- Check if user already exists in public.users
  SELECT EXISTS(SELECT 1 FROM public.users WHERE email = 'agent@saudemax.com') INTO agent_exists;
  
  -- Only proceed if the auth user exists but our records don't
  IF auth_agent_exists AND NOT agent_exists THEN
    -- Get the actual user ID from auth.users
    SELECT id INTO agent_user_id FROM auth.users WHERE email = 'agent@saudemax.com' LIMIT 1;
    
    -- Insert into public.users
    INSERT INTO public.users (id, email, full_name, role, is_active, created_at, updated_at)
    VALUES (agent_user_id, 'agent@saudemax.com', 'Demo Agent', 'agent', true, now(), now());
    
    -- Insert into roles table
    INSERT INTO public.roles (id, role, created_at, updated_at)
    VALUES (agent_user_id, 'agent', now(), now())
    ON CONFLICT (id) DO UPDATE SET
      role = EXCLUDED.role,
      updated_at = now();
    
    -- Create affiliate profile
    INSERT INTO affiliates (
      user_id,
      affiliate_code,
      referral_link,
      email,
      status,
      commission_rate,
      total_earnings,
      total_referrals,
      total_visits,
      payout_email,
      payout_method
    )
    VALUES (
      agent_user_id,
      'DEMOAGENT',
      'https://saudemax.com?ref=DEMOAGENT',
      'agent@saudemax.com',
      'active',
      15.00,
      3250.00,
      18,
      245,
      'agent@saudemax.com',
      'paypal'
    )
    RETURNING id INTO affiliate_id;
    
    -- Create sample affiliate links
    INSERT INTO affiliate_links (agent_id, name, referral_url)
    VALUES
      (agent_user_id, 'Facebook Campaign', 'https://saudemax.com?ref=DEMOAGENT&src=fb'),
      (agent_user_id, 'Email Newsletter', 'https://saudemax.com?ref=DEMOAGENT&src=email'),
      (agent_user_id, 'Instagram Bio', 'https://saudemax.com?ref=DEMOAGENT&src=ig');
    
    -- Create sample commissions
    INSERT INTO agent_commissions (agent_id, member_id, amount, type, plan_code, status, created_at)
    VALUES
      (agent_user_id, '3fa85f64-5717-4562-b3fc-2c963f66afa6', 250.00, 'one_time', 'PREMIUM-1500', 'unpaid', now() - interval '15 days'),
      (agent_user_id, '3fa85f64-5717-4562-b3fc-2c963f66afa7', 125.00, 'recurring', 'BASIC-3000', 'unpaid', now() - interval '10 days'),
      (agent_user_id, '3fa85f64-5717-4562-b3fc-2c963f66afa8', 350.00, 'one_time', 'FAMILY-1500', 'paid', now() - interval '45 days'),
      (agent_user_id, '3fa85f64-5717-4562-b3fc-2c963f66afa9', 175.00, 'recurring', 'COMPLETE-6000', 'paid', now() - interval '30 days');
    
    -- Create sample referrals
    IF affiliate_id IS NOT NULL THEN
      INSERT INTO affiliate_referrals (
        affiliate_id,
        order_id,
        order_amount,
        commission_amount,
        commission_rate,
        status,
        conversion_type,
        created_at
      )
      VALUES
        (affiliate_id, 'ORD-001', 1500.00, 225.00, 15.00, 'approved', 'subscription', now() - interval '45 days'),
        (affiliate_id, 'ORD-002', 1200.00, 180.00, 15.00, 'approved', 'subscription', now() - interval '30 days'),
        (affiliate_id, 'ORD-003', 2000.00, 300.00, 15.00, 'pending', 'subscription', now() - interval '15 days'),
        (affiliate_id, 'ORD-004', 1800.00, 270.00, 15.00, 'pending', 'subscription', now() - interval '5 days');
      
      -- Create sample visits
      INSERT INTO affiliate_visits (
        affiliate_id,
        ip_address,
        user_agent,
        referrer,
        page_url,
        country,
        device_type,
        browser,
        converted,
        created_at
      )
      SELECT
        affiliate_id,
        ('192.168.1.' || floor(random() * 255))::inet,
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        (ARRAY['https://google.com', 'https://facebook.com', 'https://instagram.com', 'direct'])[floor(random() * 4 + 1)],
        'https://saudemax.com',
        (ARRAY['US', 'BR', 'CA', 'UK'])[floor(random() * 4 + 1)],
        (ARRAY['desktop', 'mobile', 'tablet'])[floor(random() * 3 + 1)],
        (ARRAY['Chrome', 'Firefox', 'Safari', 'Edge'])[floor(random() * 4 + 1)],
        random() > 0.8,
        now() - (interval '1 day' * floor(random() * 60))
      FROM generate_series(1, 50);
    END IF;
    
    RAISE NOTICE 'Agent demo user created successfully with ID: %', agent_user_id;
  ELSE
    IF auth_agent_exists THEN
      RAISE NOTICE 'Agent user already exists in public.users table';
    ELSE
      RAISE NOTICE 'Auth user does not exist. Please create agent@saudemax.com in Supabase Auth first';
    END IF;
  END IF;
END;
$$;

-- Run the setup function
SELECT setup_agent_demo_user();

-- Add helpful notice about the demo user
DO $$
BEGIN
  RAISE NOTICE '=== AGENT DEMO USER SETUP ===';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: You must first create this user in Supabase Dashboard:';
  RAISE NOTICE 'Email: agent@saudemax.com, Password: password123';
  RAISE NOTICE '';
  RAISE NOTICE 'After creating the auth user, this migration will:';
  RAISE NOTICE '1. Create a public.users record with agent role';
  RAISE NOTICE '2. Create an affiliate profile with sample data';
  RAISE NOTICE '3. Create sample affiliate links, commissions, and referrals';
  RAISE NOTICE '';
  RAISE NOTICE 'Login credentials:';
  RAISE NOTICE 'Email: agent@saudemax.com';
  RAISE NOTICE 'Password: password123';
  RAISE NOTICE '';
  RAISE NOTICE 'After logging in, navigate to /agent to access the agent dashboard';
  RAISE NOTICE '========================';
END $$;

-- Clean up
DROP FUNCTION IF EXISTS setup_agent_demo_user();