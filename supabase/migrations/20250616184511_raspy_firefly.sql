/*
  # Add System Settings Table for Automation

  1. New Table
    - `system_settings` - Stores system-wide settings and timestamps
    
  2. Security
    - Enable RLS on the table
    - Only admins can access the settings
    
  3. Initial Data
    - Add initial setting for leaderboard update tracking
*/

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create admin-only policy
CREATE POLICY "Admins can manage system settings"
  ON system_settings
  FOR ALL
  TO authenticated
  USING (has_role('admin'));

-- Create RPC function to decrement values safely
CREATE OR REPLACE FUNCTION decrement(x numeric, y numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN GREATEST(0, y - x);
END;
$$;

-- Insert initial settings
INSERT INTO system_settings (key, value, description)
VALUES 
  ('last_leaderboard_update', '2000-01-01', 'Last date the affiliate leaderboard was updated'),
  ('affiliate_system_version', '1.0.0', 'Current version of the affiliate system'),
  ('min_withdrawal_amount', '50', 'Minimum amount for affiliate withdrawals')
ON CONFLICT (key) DO NOTHING;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION decrement(numeric, numeric) TO authenticated, service_role;

-- Add helpful notice about the new table
DO $$
BEGIN
  RAISE NOTICE '=== SYSTEM SETTINGS TABLE CREATED ===';
  RAISE NOTICE '';
  RAISE NOTICE 'The system_settings table has been created for tracking:';
  RAISE NOTICE '✅ Leaderboard update timestamps';
  RAISE NOTICE '✅ System version information';
  RAISE NOTICE '✅ Configuration parameters';
  RAISE NOTICE '';
  RAISE NOTICE 'This table is admin-only and secured with RLS.';
  RAISE NOTICE '================================';
END $$;