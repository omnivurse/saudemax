/*
  # Fix Affiliate Terminology and Login Issues

  1. Problem
    - Inconsistent terminology: "agent" vs "affiliate"
    - Login issues with role-based redirects
    - Missing policies for affiliate access
    
  2. Solution
    - Standardize on "affiliate" terminology
    - Update role constraints to include both terms
    - Fix policies for proper access control
    - Update existing users with proper metadata
*/

-- Fix the users_role_check constraint to include 'affiliate'
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_role_check CHECK (
  role = ANY (ARRAY['member'::text, 'advisor'::text, 'admin'::text, 'affiliate'::text])
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
            AND role = 'affiliate'
          )
        )
      );
  END IF;
END $$;

-- Create a function to handle affiliate role
CREATE OR REPLACE FUNCTION public.handle_affiliate_role()
RETURNS TRIGGER
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
        jsonb_build_object('role', NEW.role)
      ELSE
        jsonb_set(raw_app_metadata, '{role}', to_jsonb(NEW.role))
    END
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS on_role_update ON public.roles;
CREATE TRIGGER on_role_update
  AFTER INSERT OR UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_affiliate_role();

-- Update existing users with proper metadata
DO $$
DECLARE
  affiliate_user record;
BEGIN
  FOR affiliate_user IN (
    SELECT id FROM public.users WHERE role = 'affiliate'
  ) LOOP
    UPDATE auth.users
    SET raw_app_metadata = 
      CASE 
        WHEN raw_app_metadata IS NULL THEN 
          jsonb_build_object('role', 'affiliate')
        ELSE
          jsonb_set(raw_app_metadata, '{role}', to_jsonb('affiliate'))
      END
    WHERE id = affiliate_user.id;
  END LOOP;
END $$;

-- Create a demo affiliate user if it doesn't exist
DO $$
DECLARE
    demo_user_id uuid;
    affiliate_id uuid;
    user_exists boolean;
    auth_user_exists boolean;
BEGIN
    -- First check if the user exists in auth.users
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'affiliatedemo@saudemax.com') INTO auth_user_exists;
    
    -- Only proceed if the auth user exists
    IF auth_user_exists THEN
        -- Get the actual user ID from auth.users
        SELECT id INTO demo_user_id FROM auth.users WHERE email = 'affiliatedemo@saudemax.com';
        
        -- Check if user already exists in public.users
        SELECT EXISTS(SELECT 1 FROM public.users WHERE email = 'affiliatedemo@saudemax.com') INTO user_exists;
        
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
                'affiliatedemo@saudemax.com',
                'Affiliate Demo',
                'affiliate',
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
                'affiliate',
                now(),
                now()
            )
            ON CONFLICT (id) DO UPDATE SET
                role = EXCLUDED.role,
                updated_at = now();
            
            -- Create affiliate profile for the demo affiliate
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
                'DEMO-AFFILIATE',
                'https://saudemax.com?ref=DEMO-AFFILIATE',
                'affiliatedemo@saudemax.com',
                'active',
                15.00,
                3250.00,
                18,
                245,
                'affiliatedemo@saudemax.com',
                'paypal',
                now(),
                now()
            ) RETURNING id INTO affiliate_id;
            
            -- Create sample affiliate links for the demo affiliate
            INSERT INTO public.affiliate_links (
                affiliate_id,
                name,
                referral_url,
                created_at
            ) VALUES
            (
                demo_user_id,
                'Facebook Campaign',
                'https://saudemax.com?ref=DEMO-AFFILIATE&source=facebook',
                now()
            ),
            (
                demo_user_id,
                'Email Newsletter',
                'https://saudemax.com?ref=DEMO-AFFILIATE&source=email',
                now() - interval '5 days'
            ),
            (
                demo_user_id,
                'Instagram Bio',
                'https://saudemax.com?ref=DEMO-AFFILIATE&source=instagram',
                now() - interval '10 days'
            );
            
            -- Create sample commissions for the demo affiliate
            INSERT INTO public.affiliate_commissions (
                affiliate_id,
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
                );
            END IF;
            
            -- Create sample visits for the demo affiliate
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
                FROM generate_series(1, 30);
            END IF;
            
            -- Create a sample payout request
            INSERT INTO public.payout_requests (
                affiliate_id,
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
            
            RAISE NOTICE 'Demo affiliate user created successfully with ID: %', demo_user_id;
        ELSE
            RAISE NOTICE 'User already exists in public.users table with ID: %', demo_user_id;
        END IF;
    ELSE
        RAISE NOTICE 'Auth user does not exist. Please create affiliatedemo@saudemax.com in Supabase Auth first.';
    END IF;
END $$;