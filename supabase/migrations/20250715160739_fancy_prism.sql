/*
  # Create temp_check_references function
  
  1. New Functions
     - `temp_check_references()`: A utility function to iterate through all public tables
     
  2. Purpose
     - Provides a template for inspecting database tables
     - Demonstrates proper handling of column name ambiguity in PL/pgSQL
*/

CREATE OR REPLACE FUNCTION temp_check_references()
RETURNS void AS $$
DECLARE
  tbl RECORD;  -- Renamed from table_name to avoid collision
BEGIN
  FOR tbl IN (
    SELECT t.table_schema, t.table_name
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
  )
  LOOP
    -- Example: log table being inspected
    RAISE NOTICE 'Inspecting table: %.%', tbl.table_schema, tbl.table_name;

    -- Example: Check if table has columns
    PERFORM 1
    FROM information_schema.columns
    WHERE table_name = tbl.table_name
      AND table_schema = tbl.table_schema;

    -- Add your logic here
  END LOOP;
END;
$$ LANGUAGE plpgsql;