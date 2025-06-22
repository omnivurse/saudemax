/*
  # Add Enrollment Selections Table

  1. New Table
    - `enrollment_selections` - Stores user plan selections during enrollment
    
  2. Security
    - Enable RLS on the table
    - Users can only access their own selections
    - Admins can access all selections
    
  3. Schema
    - id: uuid (primary key, auto-generated)
    - user_id: uuid (references auth.users)
    - plan_id: integer (the selected plan ID)
    - iua_level: text (the IUA level selected)
    - selected_at: timestamp (auto-generated)
*/

-- Create enrollment_selections table
CREATE TABLE IF NOT EXISTS enrollment_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id integer NOT NULL,
  iua_level text NOT NULL,
  selected_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE enrollment_selections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own selections"
  ON enrollment_selections
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own selections"
  ON enrollment_selections
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can access all selections"
  ON enrollment_selections
  FOR ALL
  TO authenticated
  USING (has_role('admin'));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_enrollment_selections_user_id ON enrollment_selections(user_id);

-- Add helpful notice about the new table
DO $$
BEGIN
  RAISE NOTICE '=== ENROLLMENT SELECTIONS TABLE CREATED ===';
  RAISE NOTICE '';
  RAISE NOTICE 'The enrollment_selections table has been created for tracking:';
  RAISE NOTICE '✅ User plan selections during enrollment';
  RAISE NOTICE '✅ IUA level selections';
  RAISE NOTICE '✅ Selection timestamps';
  RAISE NOTICE '';
  RAISE NOTICE 'This table is secured with RLS policies.';
  RAISE NOTICE '================================';
END $$;