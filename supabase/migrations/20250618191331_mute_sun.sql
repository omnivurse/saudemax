-- Fix the users_role_check constraint to include 'agent' role
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_role_check CHECK (role = ANY (ARRAY['member'::text, 'advisor'::text, 'admin'::text, 'agent'::text, 'affiliate'::text]));

-- Create a demo agent user without triggering problematic triggers
DO $$
DECLARE
    demo_user_id uuid;
    affiliate_id uuid;
    user_exists boolean;
    auth_user_exists boolean;
BEGIN
    -- First check if the user exists in auth.users (this is required due to the foreign key constraint)
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'agentdemo@saudemax.com') INTO auth_user_exists;
    
    -- Only proceed if the auth user exists
    IF auth_user_exists THEN
        -- Get the actual user ID from auth.users
        SELECT id INTO demo_user_id FROM auth.users WHERE email = 'agentdemo@saudemax.com';
        
        -- Check if user already exists in public.users
        SELECT EXISTS(SELECT 1 FROM public.users WHERE email = 'agentdemo@saudemax.com') INTO user_exists;
        
        -- Only create if user doesn't exist in public.users
        IF NOT user_exists THEN
            -- Insert into public.users table using the ID from auth.users
            INSERT INTO public.users (
                id,
                email,
                full_name,
                role,
                is_active,
                created_at,
                updated_at
            ) VALUES (
                demo_user_id,
                'agentdemo@saudemax.com',
                'Agent Demo',
                'agent',
                true,
                now(),
                now()
            );

            -- Insert into roles table
            INSERT INTO public.roles (
                id,
                role,
                created_at,
                updated_at
            ) VALUES (
                demo_user_id,
                'agent',
                now(),
                now()
            )
            ON CONFLICT (id) DO UPDATE SET
                role = EXCLUDED.role,
                updated_at = now();
            
            -- Create affiliate profile for the demo agent
            INSERT INTO public.affiliates (
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
                payout_method,
                created_at,
                updated_at
            ) VALUES (
                demo_user_id,
                'DEMO-AGENT-001',
                'https://saudemax.com?ref=DEMO-AGENT-001',
                'agentdemo@saudemax.com',
                'active',
                15.00,
                3250.00,
                18,
                245,
                'agentdemo@saudemax.com',
                'paypal',
                now(),
                now()
            ) RETURNING id INTO affiliate_id;
            
            -- Create sample affiliate links for the demo agent
            INSERT INTO public.affiliate_links (
                agent_id,
                name,
                referral_url,
                created_at
            ) VALUES
            (
                demo_user_id,
                'Facebook Campaign',
                'https://saudemax.com?ref=DEMO-AGENT-001&source=facebook',
                now()
            ),
            (
                demo_user_id,
                'Email Newsletter',
                'https://saudemax.com?ref=DEMO-AGENT-001&source=email',
                now() - interval '5 days'
            ),
            (
                demo_user_id,
                'Instagram Bio',
                'https://saudemax.com?ref=DEMO-AGENT-001&source=instagram',
                now() - interval '10 days'
            );
            
            -- Create sample commissions for the demo agent
            INSERT INTO public.agent_commissions (
                agent_id,
                member_id,
                amount,
                type,
                plan_code,
                status,
                created_at
            ) VALUES
            (
                demo_user_id,
                '00000000-0000-0000-0000-000000000001',
                150.00,
                'one_time',
                'BASIC-1500',
                'unpaid',
                now() - interval '30 days'
            ),
            (
                demo_user_id,
                '00000000-0000-0000-0000-000000000002',
                75.00,
                'recurring',
                'PREMIUM-3000',
                'unpaid',
                now() - interval '25 days'
            ),
            (
                demo_user_id,
                '00000000-0000-0000-0000-000000000003',
                200.00,
                'one_time',
                'FAMILY-1500',
                'paid',
                now() - interval '60 days'
            ),
            (
                demo_user_id,
                '00000000-0000-0000-0000-000000000004',
                100.00,
                'recurring',
                'COMPLETE-6000',
                'paid',
                now() - interval '45 days'
            ),
            (
                demo_user_id,
                '00000000-0000-0000-0000-000000000005',
                125.00,
                'one_time',
                'BASIC-3000',
                'unpaid',
                now() - interval '15 days'
            );
            
            -- Create sample affiliate referrals
            IF affiliate_id IS NOT NULL THEN
                INSERT INTO public.affiliate_referrals (
                    affiliate_id,
                    order_id,
                    order_amount,
                    commission_amount,
                    commission_rate,
                    status,
                    conversion_type,
                    created_at
                ) VALUES
                (
                    affiliate_id,
                    'ORD-001',
                    1500.00,
                    225.00,
                    15.00,
                    'approved',
                    'subscription',
                    now() - interval '45 days'
                ),
                (
                    affiliate_id,
                    'ORD-002',
                    1200.00,
                    180.00,
                    15.00,
                    'approved',
                    'subscription',
                    now() - interval '30 days'
                ),
                (
                    affiliate_id,
                    'ORD-003',
                    2000.00,
                    300.00,
                    15.00,
                    'pending',
                    'subscription',
                    now() - interval '15 days'
                ),
                (
                    affiliate_id,
                    'ORD-004',
                    1800.00,
                    270.00,
                    15.00,
                    'pending',
                    'subscription',
                    now() - interval '5 days'
                );
            END IF;
            
            -- Create sample visits for the demo agent
            IF affiliate_id IS NOT NULL THEN
                INSERT INTO public.affiliate_visits (
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
                    ('192.168.1.' || (random() * 255)::integer)::inet,
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    CASE 
                        WHEN random() > 0.7 THEN 'https://google.com'
                        WHEN random() > 0.4 THEN 'https://facebook.com'
                        WHEN random() > 0.2 THEN 'https://instagram.com'
                        ELSE 'direct'
                    END,
                    'https://saudemax.com',
                    CASE 
                        WHEN random() > 0.7 THEN 'US'
                        WHEN random() > 0.4 THEN 'BR'
                        WHEN random() > 0.2 THEN 'CA'
                        ELSE 'UK'
                    END,
                    CASE 
                        WHEN random() > 0.6 THEN 'desktop'
                        WHEN random() > 0.3 THEN 'mobile'
                        ELSE 'tablet'
                    END,
                    CASE 
                        WHEN random() > 0.7 THEN 'Chrome'
                        WHEN random() > 0.4 THEN 'Firefox'
                        WHEN random() > 0.2 THEN 'Safari'
                        ELSE 'Edge'
                    END,
                    random() > 0.8,
                    now() - (random() * 60)::integer * interval '1 day'
                FROM generate_series(1, 50);
            END IF;
            
            -- Create a sample payout request
            INSERT INTO public.payout_requests (
                agent_id,
                amount_requested,
                status,
                requested_at,
                completed_at
            ) VALUES (
                demo_user_id,
                500.00,
                'completed',
                now() - interval '40 days',
                now() - interval '35 days'
            );
            
            RAISE NOTICE 'Demo agent user created successfully with ID: %', demo_user_id;
        ELSE
            RAISE NOTICE 'User already exists in public.users table with ID: %', demo_user_id;
        END IF;
    ELSE
        RAISE NOTICE 'Auth user does not exist. Please create agentdemo@saudemax.com in Supabase Auth first.';
    END IF;
END $$;

-- Add helpful notice about the demo user
DO $$
BEGIN
  RAISE NOTICE '=== AGENT DEMO USER CREATED ===';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: You need to create this user in Supabase Auth first:';
  RAISE NOTICE 'Email: agentdemo@saudemax.com';
  RAISE NOTICE 'Password: DemoAgent123!';
  RAISE NOTICE 'User metadata: {"role": "agent", "full_name": "Agent Demo"}';
  RAISE NOTICE '';
  RAISE NOTICE 'Steps to create the auth user:';
  RAISE NOTICE '1. Go to Supabase Dashboard > Authentication > Users';
  RAISE NOTICE '2. Click "Add User"';
  RAISE NOTICE '3. Enter the email and password above';
  RAISE NOTICE '4. In the "Metadata" section, add:';
  RAISE NOTICE '   {';
  RAISE NOTICE '     "role": "agent",';
  RAISE NOTICE '     "full_name": "Agent Demo"';
  RAISE NOTICE '   }';
  RAISE NOTICE '';
  RAISE NOTICE 'After creating the auth user, run this migration again to create:';
  RAISE NOTICE '✅ Agent profile in public.users and public.roles';
  RAISE NOTICE '✅ Affiliate profile with sample data';
  RAISE NOTICE '✅ Sample commission records';
  RAISE NOTICE '✅ Sample affiliate links';
  RAISE NOTICE '✅ Sample affiliate visits';
  RAISE NOTICE '✅ Sample payout request';
  RAISE NOTICE '';
  RAISE NOTICE 'After creating the auth user, you can log in at /agent-login';
  RAISE NOTICE '========================';
END $$;