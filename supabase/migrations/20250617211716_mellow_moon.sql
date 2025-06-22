-- Create affiliate_visits table if it doesn't exist
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

-- Enable RLS
ALTER TABLE affiliate_visits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Affiliates can view own visits" ON affiliate_visits;
DROP POLICY IF EXISTS "Anonymous visit tracking" ON affiliate_visits;
DROP POLICY IF EXISTS "Admins can view all visits" ON affiliate_visits;

-- Create policies
CREATE POLICY "Affiliates can view own visits"
  ON affiliate_visits
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );

-- Allow anonymous visit tracking
CREATE POLICY "Anonymous visit tracking"
  ON affiliate_visits
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Admin policy
CREATE POLICY "Admins can view all visits"
  ON affiliate_visits
  FOR ALL
  TO authenticated
  USING (has_role('admin'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_affiliate_visits_affiliate_id ON affiliate_visits(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_visits_created_at ON affiliate_visits(created_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_visits_converted ON affiliate_visits(converted);

-- Add helpful notice about the new table
DO $$
BEGIN
  RAISE NOTICE '=== AFFILIATE VISITS TABLE CREATED ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Table created for tracking affiliate link visits:';
  RAISE NOTICE '✅ Tracks visits to affiliate links';
  RAISE NOTICE '✅ Records conversion status';
  RAISE NOTICE '✅ Secured with RLS policies';
  RAISE NOTICE '✅ Indexed for performance';
  RAISE NOTICE '';
  RAISE NOTICE 'This table will be used for conversion funnel tracking.';
  RAISE NOTICE '================================';
END $$;