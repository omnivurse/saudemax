-- This migration renames all "agent" references to "affiliate" in the database schema
-- to maintain consistent terminology throughout the application.

-- Step 1: Rename agent_commissions table to affiliate_commissions
ALTER TABLE IF EXISTS agent_commissions RENAME TO affiliate_commissions;

-- Step 2: Rename agent_id column to affiliate_id in affiliate_commissions
ALTER TABLE affiliate_commissions RENAME COLUMN agent_id TO affiliate_id;

-- Step 3: Rename agent_id column to affiliate_id in affiliate_links
ALTER TABLE IF EXISTS affiliate_links RENAME COLUMN agent_id TO affiliate_id;

-- Step 4: Rename agent_id column to affiliate_id in affiliate_coupons
ALTER TABLE IF EXISTS affiliate_coupons RENAME COLUMN agent_id TO affiliate_id;

-- Step 5: Rename agent_id column to affiliate_id in payout_requests
ALTER TABLE IF EXISTS payout_requests RENAME COLUMN agent_id TO affiliate_id;

-- Step 6: Update foreign key constraints
-- For affiliate_commissions
ALTER TABLE IF EXISTS affiliate_commissions 
DROP CONSTRAINT IF EXISTS agent_commissions_agent_id_fkey,
ADD CONSTRAINT affiliate_commissions_affiliate_id_fkey 
  FOREIGN KEY (affiliate_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- For affiliate_links
ALTER TABLE IF EXISTS affiliate_links 
DROP CONSTRAINT IF EXISTS affiliate_links_agent_id_fkey,
ADD CONSTRAINT affiliate_links_affiliate_id_fkey 
  FOREIGN KEY (affiliate_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- For affiliate_coupons
ALTER TABLE IF EXISTS affiliate_coupons 
DROP CONSTRAINT IF EXISTS affiliate_coupons_agent_id_fkey,
ADD CONSTRAINT affiliate_coupons_affiliate_id_fkey 
  FOREIGN KEY (affiliate_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- For payout_requests
ALTER TABLE IF EXISTS payout_requests 
DROP CONSTRAINT IF EXISTS payout_requests_agent_id_fkey,
ADD CONSTRAINT payout_requests_affiliate_id_fkey 
  FOREIGN KEY (affiliate_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 7: Update RLS policies to use affiliate_id instead of agent_id
-- For affiliate_links
DROP POLICY IF EXISTS "Affiliate links delete policy" ON affiliate_links;
DROP POLICY IF EXISTS "Affiliate links insert policy" ON affiliate_links;
DROP POLICY IF EXISTS "Affiliate links select policy" ON affiliate_links;
DROP POLICY IF EXISTS "Affiliate links update policy" ON affiliate_links;

CREATE POLICY "Affiliate links delete policy"
  ON affiliate_links
  FOR DELETE
  TO authenticated
  USING ((affiliate_id = auth.uid()) OR has_role('admin'));

CREATE POLICY "Affiliate links insert policy"
  ON affiliate_links
  FOR INSERT
  TO authenticated
  WITH CHECK ((affiliate_id = auth.uid()) OR has_role('admin'));

CREATE POLICY "Affiliate links select policy"
  ON affiliate_links
  FOR SELECT
  TO authenticated
  USING ((affiliate_id = auth.uid()) OR has_role('admin'));

CREATE POLICY "Affiliate links update policy"
  ON affiliate_links
  FOR UPDATE
  TO authenticated
  USING ((affiliate_id = auth.uid()) OR has_role('admin'));

-- For affiliate_coupons
DROP POLICY IF EXISTS "Affiliate coupons policy" ON affiliate_coupons;

CREATE POLICY "Affiliate coupons policy"
  ON affiliate_coupons
  FOR SELECT
  TO authenticated
  USING ((affiliate_id = auth.uid()) OR has_role('admin'));

-- For affiliate_commissions (formerly agent_commissions)
DROP POLICY IF EXISTS "Agent commissions policy" ON affiliate_commissions;

CREATE POLICY "Affiliate commissions policy"
  ON affiliate_commissions
  FOR SELECT
  TO authenticated
  USING ((affiliate_id = auth.uid()) OR has_role('admin'));

-- For payout_requests
DROP POLICY IF EXISTS "Payout requests insert policy" ON payout_requests;
DROP POLICY IF EXISTS "Payout requests select policy" ON payout_requests;

CREATE POLICY "Payout requests insert policy"
  ON payout_requests
  FOR INSERT
  TO authenticated
  WITH CHECK ((affiliate_id = auth.uid()) OR has_role('admin'));

CREATE POLICY "Payout requests select policy"
  ON payout_requests
  FOR SELECT
  TO authenticated
  USING ((affiliate_id = auth.uid()) OR has_role('admin'));

-- Step 8: Update any indexes that reference agent_id
DROP INDEX IF EXISTS idx_agent_commissions_agent_id;
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id ON affiliate_commissions(affiliate_id);

DROP INDEX IF EXISTS idx_payout_requests_agent_id;
CREATE INDEX IF NOT EXISTS idx_payout_requests_affiliate_id ON payout_requests(affiliate_id);

DROP INDEX IF EXISTS idx_affiliate_links_agent_id;
CREATE INDEX IF NOT EXISTS idx_affiliate_links_affiliate_id ON affiliate_links(affiliate_id);

DROP INDEX IF EXISTS idx_affiliate_coupons_agent_id;
CREATE INDEX IF NOT EXISTS idx_affiliate_coupons_affiliate_id ON affiliate_coupons(affiliate_id);

-- Step 9: Update any views that reference agent_id
-- This would depend on your specific views, but here's an example:
-- CREATE OR REPLACE VIEW v_affiliate_earnings AS
--   SELECT affiliate_id, SUM(amount) as total_earnings
--   FROM affiliate_commissions
--   WHERE status = 'paid'
--   GROUP BY affiliate_id;

-- Step 10: Update any functions that reference agent_id
-- This would depend on your specific functions, but here's an example:
-- CREATE OR REPLACE FUNCTION get_affiliate_earnings(p_affiliate_id uuid)
-- RETURNS numeric AS $$
-- BEGIN
--   RETURN (SELECT SUM(amount) FROM affiliate_commissions WHERE affiliate_id = p_affiliate_id AND status = 'paid');
-- END;
-- $$ LANGUAGE plpgsql;

-- Step 11: Drop the Agent table if it exists and is no longer needed
DROP TABLE IF EXISTS "Agent";
DROP TABLE IF EXISTS "agent";

-- Step 12: Update any remaining references to "agent" in the database
-- This might include comments, descriptions, or other metadata
COMMENT ON TABLE affiliate_commissions IS 'Commissions earned by affiliates for referrals';
COMMENT ON TABLE affiliate_links IS 'Tracking links created by affiliates';
COMMENT ON TABLE affiliate_coupons IS 'Discount coupons created for affiliates';
COMMENT ON TABLE payout_requests IS 'Withdrawal requests from affiliates';