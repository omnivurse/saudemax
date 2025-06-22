/*
  # Add Foreign Key to affiliate_links Table

  1. Purpose
    - Add a foreign key constraint from affiliate_links.affiliate_id to profiles.id
    - Ensure the constraint is only created if it doesn't already exist
    
  2. Safety Features
    - Checks if constraint already exists before attempting to create it
    - Uses a DO block for safe execution
    - Proper error handling with notices
*/

DO $$ 
BEGIN
  -- Check if a constraint with affiliate_id already exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints tc
    WHERE tc.table_name = 'affiliate_links'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND tc.constraint_name LIKE '%affiliate_id%'
  ) THEN
    -- Add the foreign key constraint
    BEGIN
      ALTER TABLE public.affiliate_links
      ADD CONSTRAINT affiliate_links_affiliate_id_fkey
      FOREIGN KEY (affiliate_id) 
      REFERENCES profiles(id)
      ON DELETE CASCADE;
      
      RAISE NOTICE 'Foreign key constraint added successfully';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error adding foreign key constraint: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists';
  END IF;
END $$;