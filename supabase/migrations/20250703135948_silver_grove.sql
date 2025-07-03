/*
  # Check for advisor/agent references in database schema

  1. Purpose
    - Identify all tables and columns that reference 'advisor' or 'agent'
    - Generate a report of where these terms are used
    - Help with terminology standardization
    
  2. Output
    - Detailed report of all references
    - No changes are made to the schema
*/

-- Create a temporary function to check for references
CREATE OR REPLACE FUNCTION temp_check_references()
RETURNS TABLE (
  table_name text,
  column_name text,
  data_type text,
  reference_type text,
  reference_context text
)
LANGUAGE plpgsql
AS $$
DECLARE
  t record;
  c record;
  p record;
  f record;
  constraint_def text;
  policy_def text;
  function_def text;
BEGIN
  -- Check table and column names
  FOR t IN (
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
  )
  LOOP
    -- Check if table name contains 'advisor' or 'agent'
    IF t.table_name LIKE '%advisor%' OR t.table_name LIKE '%agent%' THEN
      table_name := t.table_name;
      column_name := NULL;
      data_type := 'TABLE';
      reference_type := 'TABLE_NAME';
      reference_context := 'Table name contains advisor/agent';
      RETURN NEXT;
    END IF;
    
    -- Check column names
    FOR c IN (
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = t.table_schema
      AND table_name = t.table_name
    )
    LOOP
      IF c.column_name LIKE '%advisor%' OR c.column_name LIKE '%agent%' THEN
        table_name := t.table_name;
        column_name := c.column_name;
        data_type := c.data_type;
        reference_type := 'COLUMN_NAME';
        reference_context := 'Column name contains advisor/agent';
        RETURN NEXT;
      END IF;
    END LOOP;
  END LOOP;
  
  -- Check constraints
  FOR c IN (
    SELECT conname, conrelid::regclass::text as table_name, pg_get_constraintdef(oid) as def
    FROM pg_constraint
    WHERE connamespace = 'public'::regnamespace
  )
  LOOP
    constraint_def := c.def;
    IF constraint_def LIKE '%advisor%' OR constraint_def LIKE '%agent%' THEN
      table_name := c.table_name;
      column_name := NULL;
      data_type := 'CONSTRAINT';
      reference_type := 'CONSTRAINT_DEF';
      reference_context := 'Constraint definition contains advisor/agent: ' || constraint_def;
      RETURN NEXT;
    END IF;
  END LOOP;
  
  -- Check policies
  FOR p IN (
    SELECT schemaname, tablename, policyname, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
  )
  LOOP
    policy_def := p.qual || ' ' || COALESCE(p.with_check, '');
    IF policy_def LIKE '%advisor%' OR policy_def LIKE '%agent%' OR
       p.policyname LIKE '%advisor%' OR p.policyname LIKE '%agent%' THEN
      table_name := p.tablename;
      column_name := NULL;
      data_type := 'POLICY';
      reference_type := 'POLICY_DEF';
      reference_context := 'Policy ' || p.policyname || ' contains advisor/agent reference';
      RETURN NEXT;
    END IF;
  END LOOP;
  
  -- Check functions
  FOR f IN (
    SELECT proname, prosrc
    FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
  )
  LOOP
    function_def := f.prosrc;
    IF function_def LIKE '%advisor%' OR function_def LIKE '%agent%' OR
       f.proname LIKE '%advisor%' OR f.proname LIKE '%agent%' THEN
      table_name := NULL;
      column_name := f.proname;
      data_type := 'FUNCTION';
      reference_type := 'FUNCTION_DEF';
      reference_context := 'Function name or body contains advisor/agent reference';
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

-- Run the function and display results
DO $$
DECLARE
  r record;
  found_references boolean := false;
BEGIN
  RAISE NOTICE '=== ADVISOR/AGENT REFERENCE CHECK ===';
  RAISE NOTICE '';
  
  FOR r IN (
    SELECT * FROM temp_check_references()
    ORDER BY table_name NULLS LAST, column_name NULLS LAST
  )
  LOOP
    found_references := true;
    RAISE NOTICE 'Found reference: % % (%) - % - %', 
      COALESCE(r.table_name, 'N/A'), 
      COALESCE(r.column_name, 'N/A'), 
      r.data_type, 
      r.reference_type, 
      r.reference_context;
  END LOOP;
  
  IF NOT found_references THEN
    RAISE NOTICE 'No references to advisor/agent found in the database schema.';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== END OF REFERENCE CHECK ===';
END $$;

-- Clean up the temporary function
DROP FUNCTION IF EXISTS temp_check_references();