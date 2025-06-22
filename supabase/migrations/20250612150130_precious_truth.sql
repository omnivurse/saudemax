/*
  # Affiliate System Schema

  1. New Tables
    - `affiliates` - Affiliate profiles and tracking codes
    - `affiliate_visits` - Visit tracking and analytics
    - `affiliate_referrals` - Conversion tracking and commissions
    - `affiliate_withdrawals` - Payout management

  2. Security
    - Enable RLS on all tables
    - Add policies for affiliate, admin access
    - Allow anonymous visit tracking

  3. Performance
    - Add indexes for common queries
    - Automatic stats updates via triggers
*/

-- Affiliates table
CREATE TABLE IF NOT EXISTS affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_code text UNIQUE NOT NULL,
  referral_link text NOT NULL,
  email text NOT NULL,
  status text CHECK (status IN ('active', 'pending', 'suspended', 'rejected')) DEFAULT 'pending',
  commission_rate numeric(5,2) DEFAULT 10.00,
  total_earnings numeric(10,2) DEFAULT 0.00,
  total_referrals integer DEFAULT 0,
  total_visits integer DEFAULT 0,
  payout_email text,
  payout_method text CHECK (payout_method IN ('paypal', 'bank_transfer', 'crypto')) DEFAULT 'paypal',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Affiliate visits tracking
CREATE TABLE IF NOT EXISTS affiliate_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES affiliates(id) ON DELETE CASCADE,
  ip_address inet,
  user_agent text,
  referrer text,
  page_url text,
  country text,
  device_type text,
  browser text,
  converted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Affiliate referrals
CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES affiliates(id) ON DELETE CASCADE,
  referred_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id text,
  order_amount numeric(10,2),
  commission_amount numeric(10,2),
  commission_rate numeric(5,2),
  status text CHECK (status IN ('pending', 'approved', 'paid', 'rejected')) DEFAULT 'pending',
  conversion_type text CHECK (conversion_type IN ('signup', 'purchase', 'subscription')) DEFAULT 'signup',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Affiliate withdrawals
CREATE TABLE IF NOT EXISTS affiliate_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES affiliates(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  method text CHECK (method IN ('paypal', 'bank_transfer', 'crypto')) NOT NULL,
  payout_email text,
  status text CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  transaction_id text,
  notes text,
  requested_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_withdrawals ENABLE ROW LEVEL SECURITY;

-- Affiliate policies
CREATE POLICY "Affiliates can view own profile"
  ON affiliates
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Affiliates can update own profile"
  ON affiliates
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can view active affiliates for referral validation"
  ON affiliates
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Visit policies
CREATE POLICY "Affiliates can view own visits"
  ON affiliate_visits
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allow visit tracking"
  ON affiliate_visits
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Referral policies
CREATE POLICY "Affiliates can view own referrals"
  ON affiliate_referrals
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );

-- Withdrawal policies
CREATE POLICY "Affiliates can manage own withdrawals"
  ON affiliate_withdrawals
  FOR ALL
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );

-- Admin policies
CREATE POLICY "Admins can access all affiliate data"
  ON affiliates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can access all referrals"
  ON affiliate_referrals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can access all withdrawals"
  ON affiliate_withdrawals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_visits_affiliate_id ON affiliate_visits(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_visits_created_at ON affiliate_visits(created_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate_id ON affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_status ON affiliate_referrals(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_affiliate_id ON affiliate_withdrawals(affiliate_id);

-- Functions for affiliate stats
CREATE OR REPLACE FUNCTION update_affiliate_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update affiliate totals when referral is created/updated
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE affiliates SET
      total_referrals = (
        SELECT COUNT(*) FROM affiliate_referrals 
        WHERE affiliate_id = NEW.affiliate_id
      ),
      total_earnings = (
        SELECT COALESCE(SUM(commission_amount), 0) 
        FROM affiliate_referrals 
        WHERE affiliate_id = NEW.affiliate_id 
        AND status IN ('approved', 'paid')
      ),
      updated_at = now()
    WHERE id = NEW.affiliate_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update affiliate stats
CREATE TRIGGER update_affiliate_stats_trigger
  AFTER INSERT OR UPDATE ON affiliate_referrals
  FOR EACH ROW EXECUTE FUNCTION update_affiliate_stats();

-- Function to generate unique affiliate code
CREATE OR REPLACE FUNCTION generate_affiliate_code()
RETURNS text AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM affiliates WHERE affiliate_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_affiliates_updated_at 
  BEFORE UPDATE ON affiliates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_referrals_updated_at 
  BEFORE UPDATE ON affiliate_referrals 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert demo data only if users exist
DO $$
DECLARE
  member_user_id uuid;
  admin_user_id uuid;
  affiliate1_id uuid;
  affiliate2_id uuid;
BEGIN
  -- Get existing user IDs
  SELECT id INTO member_user_id FROM auth.users WHERE email = 'member@saudemax.com' LIMIT 1;
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@saudemax.com' LIMIT 1;
  
  -- Insert demo affiliates if users exist
  IF member_user_id IS NOT NULL THEN
    INSERT INTO affiliates (user_id, affiliate_code, referral_link, email, status, commission_rate, total_earnings, total_referrals, total_visits, payout_email, payout_method) 
    VALUES (
      member_user_id,
      'AGENT001',
      'https://saudemax.com?ref=AGENT001',
      'agent1@saudemax.com',
      'active',
      15.00,
      2450.00,
      12,
      156,
      'agent1@paypal.com',
      'paypal'
    ) RETURNING id INTO affiliate1_id;
  END IF;
  
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO affiliates (user_id, affiliate_code, referral_link, email, status, commission_rate, total_earnings, total_referrals, total_visits, payout_email, payout_method) 
    VALUES (
      admin_user_id,
      'AGENT002',
      'https://saudemax.com?ref=AGENT002',
      'agent2@saudemax.com',
      'active',
      12.50,
      1890.00,
      8,
      98,
      'agent2@paypal.com',
      'paypal'
    ) RETURNING id INTO affiliate2_id;
  END IF;
  
  -- Insert demo referrals for each affiliate
  IF affiliate1_id IS NOT NULL THEN
    INSERT INTO affiliate_referrals (affiliate_id, order_id, order_amount, commission_amount, commission_rate, status, conversion_type) 
    SELECT 
      affiliate1_id,
      'ORD-' || gen_random_uuid()::text,
      (random() * 500 + 100)::numeric(10,2),
      ((random() * 500 + 100) * 15.00 / 100)::numeric(10,2),
      15.00,
      (ARRAY['pending', 'approved', 'paid'])[floor(random() * 3 + 1)],
      (ARRAY['signup', 'purchase', 'subscription'])[floor(random() * 3 + 1)]
    FROM generate_series(1, 5);
    
    -- Insert demo visits for affiliate 1
    INSERT INTO affiliate_visits (affiliate_id, ip_address, user_agent, referrer, page_url, country, device_type, browser, converted)
    SELECT 
      affiliate1_id,
      ('192.168.1.' || floor(random() * 255))::inet,
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'https://google.com',
      'https://saudemax.com',
      (ARRAY['US', 'BR', 'CA', 'UK'])[floor(random() * 4 + 1)],
      (ARRAY['desktop', 'mobile', 'tablet'])[floor(random() * 3 + 1)],
      (ARRAY['Chrome', 'Firefox', 'Safari', 'Edge'])[floor(random() * 4 + 1)],
      random() > 0.8
    FROM generate_series(1, 20);
  END IF;
  
  IF affiliate2_id IS NOT NULL THEN
    INSERT INTO affiliate_referrals (affiliate_id, order_id, order_amount, commission_amount, commission_rate, status, conversion_type) 
    SELECT 
      affiliate2_id,
      'ORD-' || gen_random_uuid()::text,
      (random() * 500 + 100)::numeric(10,2),
      ((random() * 500 + 100) * 12.50 / 100)::numeric(10,2),
      12.50,
      (ARRAY['pending', 'approved', 'paid'])[floor(random() * 3 + 1)],
      (ARRAY['signup', 'purchase', 'subscription'])[floor(random() * 3 + 1)]
    FROM generate_series(1, 5);
    
    -- Insert demo visits for affiliate 2
    INSERT INTO affiliate_visits (affiliate_id, ip_address, user_agent, referrer, page_url, country, device_type, browser, converted)
    SELECT 
      affiliate2_id,
      ('192.168.1.' || floor(random() * 255))::inet,
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'https://google.com',
      'https://saudemax.com',
      (ARRAY['US', 'BR', 'CA', 'UK'])[floor(random() * 4 + 1)],
      (ARRAY['desktop', 'mobile', 'tablet'])[floor(random() * 3 + 1)],
      (ARRAY['Chrome', 'Firefox', 'Safari', 'Edge'])[floor(random() * 4 + 1)],
      random() > 0.8
    FROM generate_series(1, 20);
  END IF;
END $$;