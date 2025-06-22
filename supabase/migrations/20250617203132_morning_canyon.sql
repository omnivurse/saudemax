/*
  # Commission Rules Schema

  1. New Table
    - `commission_rules` - Defines how affiliate agents earn commissions
    
  2. Security
    - Enable RLS on the table
    - Only admins can manage commission rules
    
  3. Features
    - Support for flat, percentage, and tiered commission structures
    - Flexible application to different enrollment types
    - Active/inactive status tracking
*/

-- Create commission_rules table
CREATE TABLE IF NOT EXISTS commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text CHECK (type IN ('flat', 'percent', 'tiered')) NOT NULL,
  amount numeric(10,2),
  tiers jsonb,
  applies_to text CHECK (applies_to IN ('enrollment', 'renewal', 'both')) NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;

-- Create admin-only policy
CREATE POLICY "Admins can manage commission rules"
  ON commission_rules
  FOR ALL
  TO authenticated
  USING (has_role('admin'));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_commission_rules_active ON commission_rules(active);

-- Create trigger for updated_at
CREATE TRIGGER update_commission_rules_updated_at
  BEFORE UPDATE ON commission_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample commission rules
INSERT INTO commission_rules (name, type, amount, tiers, applies_to, active)
VALUES 
  ('Standard Percentage', 'percent', 10.00, NULL, 'enrollment', true),
  ('Renewal Commission', 'percent', 5.00, NULL, 'renewal', true),
  ('Flat Referral Bonus', 'flat', 50.00, NULL, 'enrollment', true),
  ('Tiered Performance', 'tiered', NULL, 
   '[
     {"min": 1, "max": 5, "rate": 5},
     {"min": 6, "max": 10, "rate": 7.5},
     {"min": 11, "max": null, "rate": 10}
   ]', 
   'both', true);

-- Add helpful notice about the new table
DO $$
BEGIN
  RAISE NOTICE '=== COMMISSION RULES TABLE CREATED ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Table created for managing affiliate commission rules:';
  RAISE NOTICE '✅ Supports flat, percentage, and tiered commission structures';
  RAISE NOTICE '✅ Secured with RLS - admin access only';
  RAISE NOTICE '✅ Sample rules inserted for testing';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Create UI for managing commission rules';
  RAISE NOTICE '2. Implement commission calculation logic';
  RAISE NOTICE '3. Connect to affiliate dashboard';
  RAISE NOTICE '================================';
END $$;