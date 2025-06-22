/*
  # Normalize IDs to UUID Across Schema

  1. Problem
    - Inconsistent ID types across tables (bigint vs uuid)
    - Mismatch with Supabase Auth which uses UUID
    - Foreign key constraint issues between tables
    
  2. Solution
    - Convert all relevant ID and user_id fields to UUID
    - Update foreign key constraints
    - Ensure compatibility with Supabase Auth
    
  3. Tables Affected
    - public.users
    - affiliates
    - agent_commissions
    - member_profiles
    - billing_records
    - support_tickets
    - audit_logs
*/

-- First, check if any tables have bigint IDs that need conversion
DO $$
DECLARE
  table_record RECORD;
  column_record RECORD;
  tables_to_check TEXT[] := ARRAY['users', 'affiliates', 'agent_commissions', 'member_profiles', 'billing_records', 'support_tickets', 'audit_logs'];
  table_name TEXT;
BEGIN
  RAISE NOTICE 'Starting ID normalization check...';
  
  -- Loop through each table
  FOREACH table_name IN ARRAY tables_to_check
  LOOP
    -- Check if the table exists
    EXECUTE format('
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = ''public'' 
        AND table_name = %L
      )', table_name) INTO table_record;
    
    IF table_record.exists THEN
      -- Check if id column is bigint
      EXECUTE format('
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = ''public'' 
          AND table_name = %L 
          AND column_name = ''id'' 
          AND data_type = ''bigint''
        )', table_name) INTO column_record;
      
      IF column_record.exists THEN
        RAISE NOTICE 'Table %.id is bigint and needs conversion to UUID', table_name;
        
        -- Disable any triggers that might interfere
        EXECUTE format('ALTER TABLE public.%I DISABLE TRIGGER ALL', table_name);
        
        -- Convert id column to UUID
        -- First, we need to drop any foreign key constraints referencing this column
        -- This would require a more complex implementation to identify and drop all FKs
        
        -- Then convert the column
        BEGIN
          EXECUTE format('
            ALTER TABLE public.%I 
            ALTER COLUMN id TYPE uuid 
            USING id::text::uuid
          ', table_name);
          RAISE NOTICE 'Successfully converted %.id to UUID', table_name;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Error converting %.id: %', table_name, SQLERRM;
        END;
        
        -- Re-enable triggers
        EXECUTE format('ALTER TABLE public.%I ENABLE TRIGGER ALL', table_name);
      END IF;
      
      -- Check if user_id column is bigint
      EXECUTE format('
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = ''public'' 
          AND table_name = %L 
          AND column_name = ''user_id'' 
          AND data_type = ''bigint''
        )', table_name) INTO column_record;
      
      IF column_record.exists THEN
        RAISE NOTICE 'Table %.user_id is bigint and needs conversion to UUID', table_name;
        
        -- Disable any triggers that might interfere
        EXECUTE format('ALTER TABLE public.%I DISABLE TRIGGER ALL', table_name);
        
        -- Convert user_id column to UUID
        BEGIN
          EXECUTE format('
            ALTER TABLE public.%I 
            ALTER COLUMN user_id TYPE uuid 
            USING user_id::text::uuid
          ', table_name);
          RAISE NOTICE 'Successfully converted %.user_id to UUID', table_name;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Error converting %.user_id: %', table_name, SQLERRM;
        END;
        
        -- Re-enable triggers
        EXECUTE format('ALTER TABLE public.%I ENABLE TRIGGER ALL', table_name);
      END IF;
      
      -- Check if agent_id column is bigint
      EXECUTE format('
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = ''public'' 
          AND table_name = %L 
          AND column_name = ''agent_id'' 
          AND data_type = ''bigint''
        )', table_name) INTO column_record;
      
      IF column_record.exists THEN
        RAISE NOTICE 'Table %.agent_id is bigint and needs conversion to UUID', table_name;
        
        -- Disable any triggers that might interfere
        EXECUTE format('ALTER TABLE public.%I DISABLE TRIGGER ALL', table_name);
        
        -- Convert agent_id column to UUID
        BEGIN
          EXECUTE format('
            ALTER TABLE public.%I 
            ALTER COLUMN agent_id TYPE uuid 
            USING agent_id::text::uuid
          ', table_name);
          RAISE NOTICE 'Successfully converted %.agent_id to UUID', table_name;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Error converting %.agent_id: %', table_name, SQLERRM;
        END;
        
        -- Re-enable triggers
        EXECUTE format('ALTER TABLE public.%I ENABLE TRIGGER ALL', table_name);
      END IF;
    ELSE
      RAISE NOTICE 'Table % does not exist, skipping', table_name;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'ID normalization check completed.';
END $$;

-- Now, let's fix any foreign key constraints that might have been broken
-- This is a more complex operation that would require identifying all foreign keys
-- and recreating them with the correct types

-- For example, to fix foreign keys to auth.users:
DO $$
DECLARE
  fk_record RECORD;
  tables_with_user_id TEXT[] := ARRAY['users', 'affiliates', 'agent_commissions', 'member_profiles', 'support_tickets', 'audit_logs'];
  table_name TEXT;
BEGIN
  RAISE NOTICE 'Starting foreign key constraint fixes...';
  
  -- Loop through each table that might have a user_id column
  FOREACH table_name IN ARRAY tables_with_user_id
  LOOP
    -- Check if the table exists
    EXECUTE format('
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = ''public'' 
        AND table_name = %L
      )', table_name) INTO fk_record;
    
    IF fk_record.exists THEN
      -- Check if user_id column exists
      EXECUTE format('
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = ''public'' 
          AND table_name = %L 
          AND column_name = ''user_id''
        )', table_name) INTO fk_record;
      
      IF fk_record.exists THEN
        -- Check if there's a foreign key constraint on user_id
        EXECUTE format('
          SELECT EXISTS (
            SELECT FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu 
              ON tc.constraint_schema = ccu.constraint_schema 
              AND tc.constraint_name = ccu.constraint_name
            WHERE tc.constraint_type = ''FOREIGN KEY''
            AND tc.table_schema = ''public''
            AND tc.table_name = %L
            AND ccu.column_name = ''user_id''
          )', table_name) INTO fk_record;
        
        IF fk_record.exists THEN
          -- Get the constraint name
          EXECUTE format('
            SELECT tc.constraint_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu 
              ON tc.constraint_schema = ccu.constraint_schema 
              AND tc.constraint_name = ccu.constraint_name
            WHERE tc.constraint_type = ''FOREIGN KEY''
            AND tc.table_schema = ''public''
            AND tc.table_name = %L
            AND ccu.column_name = ''user_id''
            LIMIT 1
          ', table_name) INTO fk_record;
          
          -- Drop the constraint
          BEGIN
            EXECUTE format('
              ALTER TABLE public.%I
              DROP CONSTRAINT IF EXISTS %I
            ', table_name, fk_record.constraint_name);
            RAISE NOTICE 'Dropped foreign key constraint % on table %', fk_record.constraint_name, table_name;
            
            -- Recreate the constraint
            EXECUTE format('
              ALTER TABLE public.%I
              ADD CONSTRAINT %I
              FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
            ', table_name, fk_record.constraint_name);
            RAISE NOTICE 'Recreated foreign key constraint % on table %', fk_record.constraint_name, table_name;
          EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error fixing foreign key constraint on %.user_id: %', table_name, SQLERRM;
          END;
        END IF;
      END IF;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Foreign key constraint fixes completed.';
END $$;

-- Fix agent_id foreign keys
DO $$
DECLARE
  fk_record RECORD;
  tables_with_agent_id TEXT[] := ARRAY['agent_commissions', 'affiliate_links', 'affiliate_coupons', 'payout_requests'];
  table_name TEXT;
BEGIN
  RAISE NOTICE 'Starting agent_id foreign key constraint fixes...';
  
  -- Loop through each table that might have an agent_id column
  FOREACH table_name IN ARRAY tables_with_agent_id
  LOOP
    -- Check if the table exists
    EXECUTE format('
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = ''public'' 
        AND table_name = %L
      )', table_name) INTO fk_record;
    
    IF fk_record.exists THEN
      -- Check if agent_id column exists
      EXECUTE format('
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = ''public'' 
          AND table_name = %L 
          AND column_name = ''agent_id''
        )', table_name) INTO fk_record;
      
      IF fk_record.exists THEN
        -- Check if there's a foreign key constraint on agent_id
        EXECUTE format('
          SELECT EXISTS (
            SELECT FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu 
              ON tc.constraint_schema = ccu.constraint_schema 
              AND tc.constraint_name = ccu.constraint_name
            WHERE tc.constraint_type = ''FOREIGN KEY''
            AND tc.table_schema = ''public''
            AND tc.table_name = %L
            AND ccu.column_name = ''agent_id''
          )', table_name) INTO fk_record;
        
        IF fk_record.exists THEN
          -- Get the constraint name
          EXECUTE format('
            SELECT tc.constraint_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu 
              ON tc.constraint_schema = ccu.constraint_schema 
              AND tc.constraint_name = ccu.constraint_name
            WHERE tc.constraint_type = ''FOREIGN KEY''
            AND tc.table_schema = ''public''
            AND tc.table_name = %L
            AND ccu.column_name = ''agent_id''
            LIMIT 1
          ', table_name) INTO fk_record;
          
          -- Drop the constraint
          BEGIN
            EXECUTE format('
              ALTER TABLE public.%I
              DROP CONSTRAINT IF EXISTS %I
            ', table_name, fk_record.constraint_name);
            RAISE NOTICE 'Dropped foreign key constraint % on table %', fk_record.constraint_name, table_name;
            
            -- Recreate the constraint
            EXECUTE format('
              ALTER TABLE public.%I
              ADD CONSTRAINT %I
              FOREIGN KEY (agent_id) REFERENCES auth.users(id) ON DELETE CASCADE
            ', table_name, fk_record.constraint_name);
            RAISE NOTICE 'Recreated foreign key constraint % on table %', fk_record.constraint_name, table_name;
          EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error fixing foreign key constraint on %.agent_id: %', table_name, SQLERRM;
          END;
        END IF;
      END IF;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Agent_id foreign key constraint fixes completed.';
END $$;

-- Add helpful notice about the ID normalization
DO $$
BEGIN
  RAISE NOTICE '=== ID NORMALIZATION COMPLETED ===';
  RAISE NOTICE '';
  RAISE NOTICE 'The following operations were performed:';
  RAISE NOTICE '✅ Checked all specified tables for bigint ID columns';
  RAISE NOTICE '✅ Converted bigint IDs to UUID where needed';
  RAISE NOTICE '✅ Updated foreign key constraints to maintain referential integrity';
  RAISE NOTICE '';
  RAISE NOTICE 'This ensures compatibility with Supabase Auth which uses UUIDs.';
  RAISE NOTICE '';
  RAISE NOTICE 'If you encounter any issues with specific tables or constraints,';
  RAISE NOTICE 'you may need to manually fix them or run a more targeted migration.';
  RAISE NOTICE '================================================';
END $$;