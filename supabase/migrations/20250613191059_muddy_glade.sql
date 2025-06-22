/*
  # Affiliate System Helper Functions

  1. New Functions
    - get_affiliate_stats: Get performance metrics for an affiliate
    - get_public_leaderboard: Get public affiliate leaderboard
    - get_admin_leaderboard: Get detailed leaderboard for admins
    - process_withdrawal: Process affiliate withdrawal requests

  2. Security
    - All functions use SECURITY DEFINER with fixed search_path
    - Role-based access control using has_role()
    - Proper error handling and validation
    - Secure parameter handling

  3. Features
    - Performance metrics calculation
    - Leaderboard generation with rankings
    - Secure withdrawal processing
    - Data aggregation for analytics
*/

-- Function to get affiliate stats for a specific affiliate
CREATE OR REPLACE FUNCTION get_affiliate_stats(affiliate_id uuid DEFAULT NULL)
RETURNS TABLE (
  total_earnings numeric,
  total_referrals bigint,
  total_visits bigint,
  conversion_rate numeric,
  pending_commissions numeric,
  this_month_earnings numeric,
  this_month_referrals bigint,
  this_month_visits bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_affiliate_id uuid;
BEGIN
  -- If no affiliate_id provided, get the current user's affiliate_id
  IF affiliate_id IS NULL THEN
    SELECT a.id INTO user_affiliate_id
    FROM affiliates a
    WHERE a.user_id = auth.uid();
    
    -- If user is not an affiliate, return empty result
    IF user_affiliate_id IS NULL THEN
      RETURN;
    END IF;
    
    affiliate_id := user_affiliate_id;
  ELSE
    -- If affiliate_id is provided, check if user has permission to view it
    IF NOT (has_role('admin') OR EXISTS (
      SELECT 1 FROM affiliates a WHERE a.id = affiliate_id AND a.user_id = auth.uid()
    )) THEN
      RAISE EXCEPTION 'Permission denied';
    END IF;
  END IF;

  -- Calculate this month's date range
  DECLARE
    first_day_of_month timestamp := date_trunc('month', current_date);
  BEGIN
    RETURN QUERY
    SELECT
      COALESCE(SUM(ar.commission_amount) FILTER (WHERE ar.status IN ('approved', 'paid')), 0) AS total_earnings,
      COUNT(ar.id)::bigint AS total_referrals,
      COALESCE((SELECT COUNT(av.id) FROM affiliate_visits av WHERE av.affiliate_id = get_affiliate_stats.affiliate_id), 0)::bigint AS total_visits,
      CASE
        WHEN COALESCE((SELECT COUNT(av.id) FROM affiliate_visits av WHERE av.affiliate_id = get_affiliate_stats.affiliate_id), 0) > 0
        THEN (COUNT(ar.id)::numeric / (SELECT COUNT(av.id) FROM affiliate_visits av WHERE av.affiliate_id = get_affiliate_stats.affiliate_id)) * 100
        ELSE 0
      END AS conversion_rate,
      COALESCE(SUM(ar.commission_amount) FILTER (WHERE ar.status = 'pending'), 0) AS pending_commissions,
      COALESCE(SUM(ar.commission_amount) FILTER (WHERE ar.status IN ('approved', 'paid') AND ar.created_at >= first_day_of_month), 0) AS this_month_earnings,
      COUNT(ar.id) FILTER (WHERE ar.created_at >= first_day_of_month)::bigint AS this_month_referrals,
      COALESCE((SELECT COUNT(av.id) FROM affiliate_visits av WHERE av.affiliate_id = get_affiliate_stats.affiliate_id AND av.created_at >= first_day_of_month), 0)::bigint AS this_month_visits
    FROM
      affiliate_referrals ar
    WHERE
      ar.affiliate_id = get_affiliate_stats.affiliate_id;
  END;
END;
$$;

-- Function to get public affiliate leaderboard
CREATE OR REPLACE FUNCTION get_public_leaderboard(
  limit_count integer DEFAULT 10,
  show_earnings boolean DEFAULT false
)
RETURNS TABLE (
  rank integer,
  affiliate_code text,
  total_referrals integer,
  total_earnings numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    row_number() OVER (ORDER BY a.total_earnings DESC)::integer as rank,
    a.affiliate_code,
    a.total_referrals::integer,
    CASE WHEN show_earnings THEN a.total_earnings ELSE NULL END
  FROM
    affiliates a
  WHERE
    a.status = 'active'
  ORDER BY
    a.total_earnings DESC
  LIMIT
    limit_count;
END;
$$;

-- Function to get detailed admin leaderboard
CREATE OR REPLACE FUNCTION get_admin_leaderboard(
  time_period text DEFAULT 'all',
  sort_by text DEFAULT 'earnings'
)
RETURNS TABLE (
  rank integer,
  id uuid,
  affiliate_code text,
  email text,
  total_earnings numeric,
  total_referrals integer,
  total_visits integer,
  conversion_rate numeric,
  monthly_earnings numeric,
  monthly_referrals integer,
  commission_rate numeric,
  status text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Permission denied: Admin role required';
  END IF;

  -- Calculate this month's date range
  DECLARE
    filter_date timestamp;
  BEGIN
    IF time_period = 'month' THEN
      filter_date := (current_date - interval '30 days')::timestamp;
    ELSIF time_period = 'quarter' THEN
      filter_date := (current_date - interval '90 days')::timestamp;
    ELSE
      filter_date := '1970-01-01'::timestamp;
    END IF;

    -- Get base affiliate data
    CREATE TEMP TABLE temp_affiliates AS
    SELECT
      a.id,
      a.affiliate_code,
      a.email,
      a.total_earnings,
      a.total_referrals,
      a.total_visits,
      a.commission_rate,
      a.status,
      a.created_at
    FROM
      affiliates a
    WHERE
      a.status = 'active';

    -- Calculate monthly metrics
    CREATE TEMP TABLE temp_monthly AS
    SELECT
      ar.affiliate_id,
      COALESCE(SUM(ar.commission_amount) FILTER (WHERE ar.status IN ('approved', 'paid') AND ar.created_at >= filter_date), 0) AS monthly_earnings,
      COUNT(ar.id) FILTER (WHERE ar.created_at >= filter_date)::integer AS monthly_referrals
    FROM
      affiliate_referrals ar
    GROUP BY
      ar.affiliate_id;

    -- Return final result with ranking
    RETURN QUERY
    SELECT
      row_number() OVER (
        ORDER BY
          CASE WHEN sort_by = 'earnings' THEN a.total_earnings END DESC,
          CASE WHEN sort_by = 'referrals' THEN a.total_referrals END DESC,
          CASE WHEN sort_by = 'conversion' THEN 
            CASE WHEN a.total_visits > 0 THEN (a.total_referrals::numeric / a.total_visits) * 100 ELSE 0 END
          END DESC
      )::integer as rank,
      a.id,
      a.affiliate_code,
      a.email,
      a.total_earnings,
      a.total_referrals::integer,
      a.total_visits::integer,
      CASE WHEN a.total_visits > 0 THEN (a.total_referrals::numeric / a.total_visits) * 100 ELSE 0 END as conversion_rate,
      COALESCE(m.monthly_earnings, 0) as monthly_earnings,
      COALESCE(m.monthly_referrals, 0) as monthly_referrals,
      a.commission_rate,
      a.status,
      a.created_at
    FROM
      temp_affiliates a
    LEFT JOIN
      temp_monthly m ON a.id = m.affiliate_id
    ORDER BY
      CASE WHEN sort_by = 'earnings' THEN a.total_earnings END DESC,
      CASE WHEN sort_by = 'referrals' THEN a.total_referrals END DESC,
      CASE WHEN sort_by = 'conversion' THEN 
        CASE WHEN a.total_visits > 0 THEN (a.total_referrals::numeric / a.total_visits) * 100 ELSE 0 END
      END DESC;

    -- Clean up temp tables
    DROP TABLE temp_affiliates;
    DROP TABLE temp_monthly;
  END;
END;
$$;

-- Function to process affiliate withdrawal
CREATE OR REPLACE FUNCTION process_withdrawal(
  withdrawal_id uuid,
  new_status text,
  transaction_id text DEFAULT NULL,
  notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  withdrawal_record record;
BEGIN
  -- Check if user is admin
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Permission denied: Admin role required';
  END IF;

  -- Validate status
  IF new_status NOT IN ('processing', 'completed', 'failed') THEN
    RAISE EXCEPTION 'Invalid status: %', new_status;
  END IF;

  -- Get withdrawal record
  SELECT * INTO withdrawal_record
  FROM affiliate_withdrawals
  WHERE id = withdrawal_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found';
  END IF;

  -- Only allow processing of pending withdrawals
  IF withdrawal_record.status != 'pending' AND new_status != 'completed' THEN
    RAISE EXCEPTION 'Can only process pending withdrawals';
  END IF;

  -- Only allow completion of processing withdrawals
  IF withdrawal_record.status != 'processing' AND new_status = 'completed' THEN
    RAISE EXCEPTION 'Can only complete processing withdrawals';
  END IF;

  -- Update withdrawal status
  UPDATE affiliate_withdrawals
  SET 
    status = new_status,
    processed_at = now(),
    transaction_id = COALESCE(process_withdrawal.transaction_id, transaction_id),
    notes = COALESCE(process_withdrawal.notes, notes)
  WHERE id = withdrawal_id;

  -- If completed, update affiliate total_earnings
  IF new_status = 'completed' THEN
    UPDATE affiliates
    SET total_earnings = total_earnings - withdrawal_record.amount
    WHERE id = withdrawal_record.affiliate_id;
  END IF;

  RETURN true;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_affiliate_stats(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_public_leaderboard(integer, boolean) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_admin_leaderboard(text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION process_withdrawal(uuid, text, text, text) TO authenticated, service_role;

-- Add helpful notice about the functions
DO $$
BEGIN
  RAISE NOTICE '=== AFFILIATE SYSTEM FUNCTIONS CREATED ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Available Functions:';
  RAISE NOTICE '1. get_affiliate_stats(affiliate_id uuid) - Get performance metrics for an affiliate';
  RAISE NOTICE '2. get_public_leaderboard(limit_count int, show_earnings bool) - Get public affiliate leaderboard';
  RAISE NOTICE '3. get_admin_leaderboard(time_period text, sort_by text) - Get detailed admin leaderboard';
  RAISE NOTICE '4. process_withdrawal(withdrawal_id uuid, new_status text, transaction_id text, notes text) - Process affiliate withdrawal';
  RAISE NOTICE '';
  RAISE NOTICE 'Usage Examples:';
  RAISE NOTICE 'SELECT * FROM get_affiliate_stats();';
  RAISE NOTICE 'SELECT * FROM get_public_leaderboard(5, true);';
  RAISE NOTICE 'SELECT * FROM get_admin_leaderboard(''month'', ''earnings'');';
  RAISE NOTICE 'SELECT process_withdrawal(''uuid-here'', ''completed'', ''TXN123'', ''Payment sent'');';
  RAISE NOTICE '================================================';
END $$;