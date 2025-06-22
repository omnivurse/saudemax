/*
  # Promo Tools Schema

  1. New Tables
    - `affiliate_links` - Stores custom referral links for agents
    - `promo_assets` - Stores marketing materials like banners and PDFs
    - `affiliate_coupons` - Stores custom discount codes for agents
    
  2. Security
    - Enable RLS on all tables
    - Create policies for agent access
    - Ensure proper data isolation
    
  3. Indexes
    - Add indexes for performance optimization
*/

-- Create affiliate_links table
CREATE TABLE IF NOT EXISTS affiliate_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  referral_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create promo_assets table
CREATE TABLE IF NOT EXISTS promo_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text CHECK (type IN ('banner', 'logo', 'pdf')) NOT NULL,
  file_url text NOT NULL,
  width integer,
  height integer,
  created_at timestamptz DEFAULT now()
);

-- Create affiliate_coupons table
CREATE TABLE IF NOT EXISTS affiliate_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  discount_percent numeric(5,2) NOT NULL,
  status text CHECK (status IN ('active', 'expired')) DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_coupons ENABLE ROW LEVEL SECURITY;

-- Create policies for affiliate_links
CREATE POLICY "Agents can view own links"
  ON affiliate_links
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "Agents can create own links"
  ON affiliate_links
  FOR INSERT
  TO authenticated
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can update own links"
  ON affiliate_links
  FOR UPDATE
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "Agents can delete own links"
  ON affiliate_links
  FOR DELETE
  TO authenticated
  USING (agent_id = auth.uid());

-- Create policies for promo_assets (all agents can view)
CREATE POLICY "All users can view promo assets"
  ON promo_assets
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for affiliate_coupons
CREATE POLICY "Agents can view own coupons"
  ON affiliate_coupons
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

-- Admin policies
CREATE POLICY "Admins can manage all affiliate links"
  ON affiliate_links
  FOR ALL
  TO authenticated
  USING (has_role('admin'));

CREATE POLICY "Admins can manage all promo assets"
  ON promo_assets
  FOR ALL
  TO authenticated
  USING (has_role('admin'));

CREATE POLICY "Admins can manage all affiliate coupons"
  ON affiliate_coupons
  FOR ALL
  TO authenticated
  USING (has_role('admin'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_affiliate_links_agent_id ON affiliate_links(agent_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_coupons_agent_id ON affiliate_coupons(agent_id);
CREATE INDEX IF NOT EXISTS idx_promo_assets_type ON promo_assets(type);

-- Insert sample promo assets
INSERT INTO promo_assets (name, type, file_url, width, height)
VALUES 
  ('SaudeMAX Banner - Blue', 'banner', 'https://images.pexels.com/photos/7579831/pexels-photo-7579831.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 1200, 628),
  ('SaudeMAX Banner - Green', 'banner', 'https://images.pexels.com/photos/7088530/pexels-photo-7088530.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 1200, 628),
  ('SaudeMAX Logo', 'logo', 'https://images.pexels.com/photos/7579501/pexels-photo-7579501.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 500, 500),
  ('SaudeMAX Brochure', 'pdf', 'https://example.com/brochure.pdf', null, null);

-- Add helpful notice about the new tables
DO $$
BEGIN
  RAISE NOTICE '=== PROMO TOOLS TABLES CREATED ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables created for agent promo tools:';
  RAISE NOTICE '✅ affiliate_links - For tracking custom referral links';
  RAISE NOTICE '✅ promo_assets - For storing marketing materials';
  RAISE NOTICE '✅ affiliate_coupons - For managing discount codes';
  RAISE NOTICE '✅ Secured with RLS policies';
  RAISE NOTICE '✅ Sample promo assets inserted';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Create UI for agents to manage their promo tools';
  RAISE NOTICE '2. Implement tracking for referral links';
  RAISE NOTICE '3. Add coupon code redemption functionality';
  RAISE NOTICE '================================';
END $$;