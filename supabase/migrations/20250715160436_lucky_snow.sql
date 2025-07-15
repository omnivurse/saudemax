/*
  # Fix ambiguous column reference in PL/pgSQL function
  
  1. Changes
     - Fixes "column reference 'table_name' is ambiguous" error
     - Adds table alias to qualify column references
     - Renames loop variable to avoid conflict with column names
*/

-- Drop the function if it exists (replace function_name and parameter types with your actual function)
DROP FUNCTION IF EXISTS your_function_name();

-- Create the fixed function
CREATE OR REPLACE FUNCTION your_function_name() 
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec record;
  -- Define other variables here
BEGIN
  -- Replace this loop with your actual function body
  FOR rec IN (
    SELECT t.table_schema, t.table_name
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
  )
  LOOP
    -- Access columns using rec.table_name, rec.table_schema
    RAISE NOTICE 'Table: %', rec.table_name;
  END LOOP;
  
  -- Rest of your function...
END;
$$;