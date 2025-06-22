/*
  # Agent Commission and Payout Tables

  1. New Tables
    - `agent_commissions` - Tracks commission earnings for agents
    - `payout_requests` - Manages withdrawal requests from agents
    
  2. Security
    - Enable RLS on all tables
    - Agents can only access their own data
    - Admins can access all data
    
  3. Features
    - Track different commission types (one-time, recurring)
    - Support multiple payout statuses
    - Maintain audit trail with timestamps
*/

-- Create agent_commissions table
CREATE TABLE IF NOT EXISTS agent_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id uuid,
  amount numeric(10,2) NOT NULL,
  type text CHECK (type IN ('one_time', 'recurring')) NOT NULL,
  plan_code text NOT NULL,
  status text CHECK (status IN ('unpaid', 'pending', 'paid', 'failed')) DEFAULT 'unpaid',
  payout_date timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create payout_requests table
CREATE TABLE IF NOT EXISTS payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_requested numeric(10,2) NOT NULL,
  status text CHECK (status IN ('processing', 'completed', 'failed')) DEFAULT 'processing',
  requested_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Enable RLS
ALTER TABLE agent_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for agent_commissions
CREATE POLICY "Agents can view own commissions"
  ON agent_commissions
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

-- Create policies for payout_requests
CREATE POLICY "Agents can view own payout requests"
  ON payout_requests
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "Agents can create own payout requests"
  ON payout_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (agent_id = auth.uid());

-- Admin policies
CREATE POLICY "Admins can manage all commissions"
  ON agent_commissions
  FOR ALL
  TO authenticated
  USING (has_role('admin'));

CREATE POLICY "Admins can manage all payout requests"
  ON payout_requests
  FOR ALL
  TO authenticated
  USING (has_role('admin'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_commissions_agent_id ON agent_commissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_commissions_status ON agent_commissions(status);
CREATE INDEX IF NOT EXISTS idx_payout_requests_agent_id ON payout_requests(agent_id);

-- Insert sample data for testing
DO $$
DECLARE
  test_agent_id uuid;
BEGIN
  -- Try to get a user with agent role
  SELECT id INTO test_agent_id FROM auth.users 
  WHERE raw_user_meta_data->>'role' = 'agent' 
  LIMIT 1;
  
  -- If we found an agent, insert sample data
  IF test_agent_id IS NOT NULL THEN
    -- Insert sample commissions
    INSERT INTO agent_commissions (agent_id, member_id, amount, type, plan_code, status, created_at)
    VALUES
      (test_agent_id, '3fa85f64-5717-4562-b3fc-2c963f66afa6', 150.00, 'one_time', 'BASIC-1500', 'unpaid', now() - interval '30 days'),
      (test_agent_id, '3fa85f64-5717-4562-b3fc-2c963f66afa7', 75.00, 'recurring', 'PREMIUM-3000', 'unpaid', now() - interval '25 days'),
      (test_agent_id, '3fa85f64-5717-4562-b3fc-2c963f66afa8', 200.00, 'one_time', 'FAMILY-1500', 'paid', now() - interval '60 days'),
      (test_agent_id, '3fa85f64-5717-4562-b3fc-2c963f66afa9', 100.00, 'recurring', 'COMPLETE-6000', 'paid', now() - interval '45 days'),
      (test_agent_id, '3fa85f64-5717-4562-b3fc-2c963f66afa0', 125.00, 'one_time', 'BASIC-3000', 'unpaid', now() - interval '15 days');
      
    -- Insert sample payout request
    INSERT INTO payout_requests (agent_id, amount_requested, status, requested_at, completed_at)
    VALUES
      (test_agent_id, 300.00, 'completed', now() - interval '40 days', now() - interval '35 days');
  END IF;
END $$;

-- Add helpful notice about the new tables
DO $$
BEGIN
  RAISE NOTICE '=== AGENT COMMISSION TABLES CREATED ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables created for agent commission tracking:';
  RAISE NOTICE '✅ agent_commissions - For tracking commission earnings';
  RAISE NOTICE '✅ payout_requests - For managing withdrawal requests';
  RAISE NOTICE '✅ Secured with RLS policies';
  RAISE NOTICE '✅ Sample data inserted (if agent users exist)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Create UI for agents to view commissions and request payouts';
  RAISE NOTICE '2. Implement admin interface for managing payouts';
  RAISE NOTICE '3. Set up automated commission calculations';
  RAISE NOTICE '================================';
END $$;