/*
  # Create temp_check_references function

  1. New Functions
    - `temp_check_references()`
      - Utility function that iterates through all tables in the 'public' schema
      - Returns void
      - Can be extended to perform various checks on each table
*/

-- Create the temp_check_references function
CREATE OR REPLACE FUNCTION temp_check_references()
RETURNS void AS $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN (
    SELECT t.table_schema, t.table_name
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
  )
  LOOP
    RAISE NOTICE 'Inspecting table: %.%', rec.table_schema, rec.table_name;

    -- Example logic: You can inspect columns, foreign keys, etc. per table here
    -- Example subquery (adjust logic as needed):
    PERFORM 1 FROM information_schema.columns
    WHERE table_name = rec.table_name
      AND table_schema = rec.table_schema;

    -- Add your logic here
  END LOOP;
END;
$$ LANGUAGE plpgsql;