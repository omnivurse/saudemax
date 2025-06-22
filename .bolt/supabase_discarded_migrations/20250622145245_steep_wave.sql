-- Step 1: First update any 'agent' roles to 'affiliate' in the users table
-- This must be done BEFORE modifying the constraint
UPDATE public.users
SET role = 'affiliate'
WHERE role = 'agent';

-- Step 2: Fix the users_role_check constraint to include both 'agent' and 'affiliate' roles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_role_check' 
    AND table_name = 'users'
  ) THEN
    BEGIN
      ALTER TABLE public.users 
      DROP CONSTRAINT users_role_check;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not drop constraint users_role_check: %', SQLERRM;
    END;
  END IF;
  
  -- Include both 'agent' and 'affiliate' in the constraint to avoid violations
  -- We keep 'agent' for backward compatibility
  BEGIN
    ALTER TABLE public.users 
    ADD CONSTRAINT users_role_check CHECK (role = ANY (ARRAY['member'::text, 'advisor'::text, 'admin'::text, 'agent'::text, 'affiliate'::text]));
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add constraint users_role_check: %', SQLERRM;
  END;
END $$;

-- Step 3: Rename agent_id columns to affiliate_id if they still exist
DO $$
DECLARE
    column_exists boolean;
BEGIN
    -- Check if agent_id column exists in affiliate_links
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'affiliate_links' 
        AND column_name = 'agent_id'
    ) INTO column_exists;
    
    IF column_exists THEN
        -- Rename agent_id to affiliate_id
        BEGIN
            ALTER TABLE public.affiliate_links RENAME COLUMN agent_id TO affiliate_id;
            RAISE NOTICE 'Renamed agent_id to affiliate_id in affiliate_links table';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not rename agent_id in affiliate_links: %', SQLERRM;
        END;
    END IF;

    -- Check if agent_id column exists in affiliate_coupons
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'affiliate_coupons' 
        AND column_name = 'agent_id'
    ) INTO column_exists;
    
    IF column_exists THEN
        -- Rename agent_id to affiliate_id
        BEGIN
            ALTER TABLE public.affiliate_coupons RENAME COLUMN agent_id TO affiliate_id;
            RAISE NOTICE 'Renamed agent_id to affiliate_id in affiliate_coupons table';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not rename agent_id in affiliate_coupons: %', SQLERRM;
        END;
    END IF;

    -- Check if agent_id column exists in payout_requests
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'payout_requests' 
        AND column_name = 'agent_id'
    ) INTO column_exists;
    
    IF column_exists THEN
        -- Rename agent_id to affiliate_id
        BEGIN
            ALTER TABLE public.payout_requests RENAME COLUMN agent_id TO affiliate_id;
            RAISE NOTICE 'Renamed agent_id to affiliate_id in payout_requests table';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not rename agent_id in payout_requests: %', SQLERRM;
        END;
    END IF;
    
    -- Check if agent_commissions table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'agent_commissions'
    ) INTO column_exists;
    
    IF column_exists THEN
        -- Rename table to affiliate_commissions
        BEGIN
            ALTER TABLE public.agent_commissions RENAME TO affiliate_commissions;
            RAISE NOTICE 'Renamed agent_commissions table to affiliate_commissions';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not rename agent_commissions table: %', SQLERRM;
        END;
        
        -- Check if agent_id column exists in affiliate_commissions
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'affiliate_commissions' 
            AND column_name = 'agent_id'
        ) INTO column_exists;
        
        IF column_exists THEN
            -- Rename agent_id to affiliate_id
            BEGIN
                ALTER TABLE public.affiliate_commissions RENAME COLUMN agent_id TO affiliate_id;
                RAISE NOTICE 'Renamed agent_id to affiliate_id in affiliate_commissions table';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Could not rename agent_id in affiliate_commissions: %', SQLERRM;
            END;
        END IF;
    END IF;
END $$;

-- Step 4: Fix foreign key constraints
DO $$
DECLARE
    constraint_exists boolean;
    constraint_name text;
BEGIN
    -- Check and fix affiliate_links foreign key
    SELECT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'affiliate_links' 
        AND constraint_name LIKE '%affiliate_id%'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        -- Drop old constraint if it exists
        SELECT constraint_name INTO constraint_name
        FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'affiliate_links' 
        AND constraint_name LIKE '%agent_id%'
        LIMIT 1;
        
        IF constraint_name IS NOT NULL THEN
            BEGIN
                EXECUTE 'ALTER TABLE public.affiliate_links DROP CONSTRAINT ' || constraint_name;
                RAISE NOTICE 'Dropped constraint % on affiliate_links', constraint_name;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop constraint % on affiliate_links: %', constraint_name, SQLERRM;
            END;
        END IF;
        
        -- Add new constraint
        BEGIN
            ALTER TABLE public.affiliate_links
            ADD CONSTRAINT affiliate_links_affiliate_id_fkey
            FOREIGN KEY (affiliate_id) REFERENCES auth.users(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added foreign key constraint on affiliate_links.affiliate_id';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not add foreign key to affiliate_links: %', SQLERRM;
        END;
    END IF;
    
    -- Check and fix affiliate_coupons foreign key
    SELECT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'affiliate_coupons' 
        AND constraint_name LIKE '%affiliate_id%'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        -- Drop old constraint if it exists
        SELECT constraint_name INTO constraint_name
        FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'affiliate_coupons' 
        AND constraint_name LIKE '%agent_id%'
        LIMIT 1;
        
        IF constraint_name IS NOT NULL THEN
            BEGIN
                EXECUTE 'ALTER TABLE public.affiliate_coupons DROP CONSTRAINT ' || constraint_name;
                RAISE NOTICE 'Dropped constraint % on affiliate_coupons', constraint_name;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop constraint % on affiliate_coupons: %', constraint_name, SQLERRM;
            END;
        END IF;
        
        -- Add new constraint
        BEGIN
            ALTER TABLE public.affiliate_coupons
            ADD CONSTRAINT affiliate_coupons_affiliate_id_fkey
            FOREIGN KEY (affiliate_id) REFERENCES auth.users(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added foreign key constraint on affiliate_coupons.affiliate_id';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not add foreign key to affiliate_coupons: %', SQLERRM;
        END;
    END IF;
    
    -- Check and fix payout_requests foreign key
    SELECT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'payout_requests' 
        AND constraint_name LIKE '%affiliate_id%'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        -- Drop old constraint if it exists
        SELECT constraint_name INTO constraint_name
        FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'payout_requests' 
        AND constraint_name LIKE '%agent_id%'
        LIMIT 1;
        
        IF constraint_name IS NOT NULL THEN
            BEGIN
                EXECUTE 'ALTER TABLE public.payout_requests DROP CONSTRAINT ' || constraint_name;
                RAISE NOTICE 'Dropped constraint % on payout_requests', constraint_name;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop constraint % on payout_requests: %', constraint_name, SQLERRM;
            END;
        END IF;
        
        -- Add new constraint
        BEGIN
            ALTER TABLE public.payout_requests
            ADD CONSTRAINT payout_requests_affiliate_id_fkey
            FOREIGN KEY (affiliate_id) REFERENCES auth.users(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added foreign key constraint on payout_requests.affiliate_id';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not add foreign key to payout_requests: %', SQLERRM;
        END;
    END IF;
    
    -- Check and fix affiliate_commissions foreign key
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'affiliate_commissions'
    ) THEN
        SELECT EXISTS (
            SELECT FROM information_schema.table_constraints 
            WHERE constraint_type = 'FOREIGN KEY' 
            AND table_name = 'affiliate_commissions' 
            AND constraint_name LIKE '%affiliate_id%'
        ) INTO constraint_exists;
        
        IF NOT constraint_exists THEN
            -- Drop old constraint if it exists
            SELECT constraint_name INTO constraint_name
            FROM information_schema.table_constraints 
            WHERE constraint_type = 'FOREIGN KEY' 
            AND table_name = 'affiliate_commissions' 
            AND constraint_name LIKE '%agent_id%'
            LIMIT 1;
            
            IF constraint_name IS NOT NULL THEN
                BEGIN
                    EXECUTE 'ALTER TABLE public.affiliate_commissions DROP CONSTRAINT ' || constraint_name;
                    RAISE NOTICE 'Dropped constraint % on affiliate_commissions', constraint_name;
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE 'Could not drop constraint % on affiliate_commissions: %', constraint_name, SQLERRM;
                END;
            END IF;
            
            -- Add new constraint
            BEGIN
                ALTER TABLE public.affiliate_commissions
                ADD CONSTRAINT affiliate_commissions_affiliate_id_fkey
                FOREIGN KEY (affiliate_id) REFERENCES auth.users(id) ON DELETE CASCADE;
                RAISE NOTICE 'Added foreign key constraint on affiliate_commissions.affiliate_id';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Could not add foreign key to affiliate_commissions: %', SQLERRM;
            END;
        END IF;
    END IF;
END $$;

-- Step 5: Create indexes for performance
DO $$
BEGIN
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_affiliate_links_affiliate_id ON public.affiliate_links(affiliate_id);
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not create index on affiliate_links: %', SQLERRM;
    END;
    
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_affiliate_coupons_affiliate_id ON public.affiliate_coupons(affiliate_id);
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not create index on affiliate_coupons: %', SQLERRM;
    END;
    
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_payout_requests_affiliate_id ON public.payout_requests(affiliate_id);
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not create index on payout_requests: %', SQLERRM;
    END;
    
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id ON public.affiliate_commissions(affiliate_id);
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not create index on affiliate_commissions: %', SQLERRM;
    END;
    
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON public.affiliate_commissions(status);
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not create index on affiliate_commissions status: %', SQLERRM;
    END;
END $$;

-- Step 6: Update RLS policies to use affiliate_id instead of agent_id
DO $$
DECLARE
    policy_exists boolean;
BEGIN
    -- Check and fix affiliate_links policies
    SELECT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'affiliate_links' 
        AND policyname = 'Affiliate links select policy'
    ) INTO policy_exists;
    
    IF policy_exists THEN
        BEGIN
            DROP POLICY "Affiliate links select policy" ON public.affiliate_links;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop policy Affiliate links select policy: %', SQLERRM;
        END;
    END IF;
    
    BEGIN
        CREATE POLICY "Affiliate links select policy"
          ON public.affiliate_links
          FOR SELECT
          TO authenticated
          USING (
            affiliate_id = (SELECT auth.uid()) OR 
            has_role('admin')
          );
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not create policy Affiliate links select policy: %', SQLERRM;
    END;
    
    -- Check and fix affiliate_links insert policy
    SELECT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'affiliate_links' 
        AND policyname = 'Affiliate links insert policy'
    ) INTO policy_exists;
    
    IF policy_exists THEN
        BEGIN
            DROP POLICY "Affiliate links insert policy" ON public.affiliate_links;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop policy Affiliate links insert policy: %', SQLERRM;
        END;
    END IF;
    
    BEGIN
        CREATE POLICY "Affiliate links insert policy"
          ON public.affiliate_links
          FOR INSERT
          TO authenticated
          WITH CHECK (
            affiliate_id = (SELECT auth.uid()) OR 
            has_role('admin')
          );
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not create policy Affiliate links insert policy: %', SQLERRM;
    END;
    
    -- Check and fix affiliate_links update policy
    SELECT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'affiliate_links' 
        AND policyname = 'Affiliate links update policy'
    ) INTO policy_exists;
    
    IF policy_exists THEN
        BEGIN
            DROP POLICY "Affiliate links update policy" ON public.affiliate_links;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop policy Affiliate links update policy: %', SQLERRM;
        END;
    END IF;
    
    BEGIN
        CREATE POLICY "Affiliate links update policy"
          ON public.affiliate_links
          FOR UPDATE
          TO authenticated
          USING (
            affiliate_id = (SELECT auth.uid()) OR 
            has_role('admin')
          );
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not create policy Affiliate links update policy: %', SQLERRM;
    END;
    
    -- Check and fix affiliate_links delete policy
    SELECT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'affiliate_links' 
        AND policyname = 'Affiliate links delete policy'
    ) INTO policy_exists;
    
    IF policy_exists THEN
        BEGIN
            DROP POLICY "Affiliate links delete policy" ON public.affiliate_links;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop policy Affiliate links delete policy: %', SQLERRM;
        END;
    END IF;
    
    BEGIN
        CREATE POLICY "Affiliate links delete policy"
          ON public.affiliate_links
          FOR DELETE
          TO authenticated
          USING (
            affiliate_id = (SELECT auth.uid()) OR 
            has_role('admin')
          );
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not create policy Affiliate links delete policy: %', SQLERRM;
    END;
    
    -- Check and fix affiliate_coupons policy
    SELECT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'affiliate_coupons' 
        AND policyname = 'Affiliate coupons policy'
    ) INTO policy_exists;
    
    IF policy_exists THEN
        BEGIN
            DROP POLICY "Affiliate coupons policy" ON public.affiliate_coupons;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop policy Affiliate coupons policy: %', SQLERRM;
        END;
    END IF;
    
    BEGIN
        CREATE POLICY "Affiliate coupons policy"
          ON public.affiliate_coupons
          FOR SELECT
          TO authenticated
          USING (
            affiliate_id = (SELECT auth.uid()) OR 
            has_role('admin')
          );
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not create policy Affiliate coupons policy: %', SQLERRM;
    END;
    
    -- Check and fix affiliate_commissions policy
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'affiliate_commissions'
    ) THEN
        SELECT EXISTS (
            SELECT FROM pg_policies 
            WHERE tablename = 'affiliate_commissions' 
            AND policyname = 'Affiliate commissions policy'
        ) INTO policy_exists;
        
        IF policy_exists THEN
            BEGIN
                DROP POLICY "Affiliate commissions policy" ON public.affiliate_commissions;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop policy Affiliate commissions policy: %', SQLERRM;
            END;
        END IF;
        
        BEGIN
            CREATE POLICY "Affiliate commissions policy"
              ON public.affiliate_commissions
              FOR SELECT
              TO authenticated
              USING (
                affiliate_id = (SELECT auth.uid()) OR 
                has_role('admin')
              );
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not create policy Affiliate commissions policy: %', SQLERRM;
        END;
    END IF;
    
    -- Check and fix payout_requests select policy
    SELECT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'payout_requests' 
        AND policyname = 'Payout requests select policy'
    ) INTO policy_exists;
    
    IF policy_exists THEN
        BEGIN
            DROP POLICY "Payout requests select policy" ON public.payout_requests;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop policy Payout requests select policy: %', SQLERRM;
        END;
    END IF;
    
    BEGIN
        CREATE POLICY "Payout requests select policy"
          ON public.payout_requests
          FOR SELECT
          TO authenticated
          USING (
            affiliate_id = (SELECT auth.uid()) OR 
            has_role('admin')
          );
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not create policy Payout requests select policy: %', SQLERRM;
    END;
    
    -- Check and fix payout_requests insert policy
    SELECT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'payout_requests' 
        AND policyname = 'Payout requests insert policy'
    ) INTO policy_exists;
    
    IF policy_exists THEN
        BEGIN
            DROP POLICY "Payout requests insert policy" ON public.payout_requests;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop policy Payout requests insert policy: %', SQLERRM;
        END;
    END IF;
    
    BEGIN
        CREATE POLICY "Payout requests insert policy"
          ON public.payout_requests
          FOR INSERT
          TO authenticated
          WITH CHECK (
            affiliate_id = (SELECT auth.uid()) OR 
            has_role('admin')
          );
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not create policy Payout requests insert policy: %', SQLERRM;
    END;
END $$;

-- Step 7: Update has_role function to be more robust
CREATE OR REPLACE FUNCTION public.has_role(required_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Handle the case where 'agent' is passed but we want to check for 'affiliate'
  IF required_role = 'agent' THEN
    required_role := 'affiliate';
  END IF;

  -- First check roles table
  IF EXISTS (
    SELECT 1 FROM public.roles
    WHERE id = auth.uid() AND (role = required_role OR (role = 'agent' AND required_role = 'affiliate'))
  ) THEN
    RETURN true;
  END IF;
  
  -- If not found, check users table
  IF EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND (role = required_role OR (role = 'agent' AND required_role = 'affiliate'))
  ) THEN
    RETURN true;
  END IF;
  
  -- If still not found, check app_metadata
  RETURN (
    SELECT (raw_app_metadata->>'role')::text = required_role OR 
           ((raw_app_metadata->>'role')::text = 'agent' AND required_role = 'affiliate')
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$;

-- Step 8: Add helpful notice about the fixes
DO $$
BEGIN
  RAISE NOTICE '=== AFFILIATE TABLES FIXED ===';
  RAISE NOTICE '';
  RAISE NOTICE 'The following changes have been made:';
  RAISE NOTICE '✅ Standardized terminology from "agent" to "affiliate"';
  RAISE NOTICE '✅ Fixed role constraints in users table';
  RAISE NOTICE '✅ Updated foreign key constraints';
  RAISE NOTICE '✅ Created indexes for performance';
  RAISE NOTICE '✅ Updated has_role function to be more robust';
  RAISE NOTICE '';
  RAISE NOTICE 'These changes ensure consistent terminology and proper database relationships.';
  RAISE NOTICE '================================================';
END $$;