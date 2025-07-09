/*
  # Add Affiliate Performance Metrics Table

  1. New Tables
    - `affiliate_performance_metrics`
      - `id` (uuid, primary key)
      - `affiliate_id` (uuid, foreign key to affiliates)
      - `period` (text, check constraint for valid values)
      - `start_date` (date)
      - `end_date` (date)
      - `visits_count` (integer)
      - `referrals_count` (integer)
      - `conversion_rate` (numeric)
      - `earnings` (numeric)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on `affiliate_performance_metrics` table
    - Add policies for secure access control
    
  3. Functions
    - Add `calculate_affiliate_metrics` function for metrics calculation
*/

-- Create affiliate_performance_metrics table
CREATE TABLE IF NOT EXISTS affiliate_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES affiliates(id) ON DELETE CASCADE,
  period text NOT NULL CHECK (period IN ('month', 'quarter', 'year')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  visits_count integer NOT NULL DEFAULT 0,
  referrals_count integer NOT NULL DEFAULT 0,
  conversion_rate numeric(5,2) NOT NULL DEFAULT 0,
  earnings numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_affiliate_performance_metrics_affiliate_id ON affiliate_performance_metrics(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_performance_metrics_period ON affiliate_performance_metrics(period);
CREATE INDEX IF NOT EXISTS idx_affiliate_performance_metrics_dates ON affiliate_performance_metrics(start_date, end_date);

-- Enable Row Level Security
ALTER TABLE affiliate_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Affiliates can view their own metrics"
  ON affiliate_performance_metrics
  FOR SELECT
  TO authenticated
  USING ((affiliate_id = auth.uid()) OR is_affiliate(auth.uid()) OR has_role('admin'));

CREATE POLICY "Admins can manage all metrics"
  ON affiliate_performance_metrics
  FOR ALL
  TO authenticated
  USING (has_role('admin'));

-- Create function to calculate and store metrics
CREATE OR REPLACE FUNCTION calculate_affiliate_metrics(
  p_affiliate_id uuid,
  p_period text,
  p_start_date date,
  p_end_date date
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_visits_count integer;
  v_referrals_count integer;
  v_conversion_rate numeric(5,2);
  v_earnings numeric(10,2);
  v_metric_id uuid;
BEGIN
  -- Calculate visits count
  SELECT COUNT(*)
  INTO v_visits_count
  FROM affiliate_visits
  WHERE affiliate_id = p_affiliate_id
  AND created_at >= p_start_date
  AND created_at <= p_end_date;

  -- Calculate referrals count
  SELECT COUNT(*)
  INTO v_referrals_count
  FROM affiliate_referrals
  WHERE affiliate_id = p_affiliate_id
  AND created_at >= p_start_date
  AND created_at <= p_end_date;

  -- Calculate conversion rate
  IF v_visits_count > 0 THEN
    v_conversion_rate := (v_referrals_count::numeric / v_visits_count::numeric) * 100;
  ELSE
    v_conversion_rate := 0;
  END IF;

  -- Calculate earnings
  SELECT COALESCE(SUM(commission_amount), 0)
  INTO v_earnings
  FROM affiliate_commissions
  WHERE affiliate_id = p_affiliate_id
  AND created_at >= p_start_date
  AND created_at <= p_end_date;

  -- Insert or update metrics
  INSERT INTO affiliate_performance_metrics (
    affiliate_id,
    period,
    start_date,
    end_date,
    visits_count,
    referrals_count,
    conversion_rate,
    earnings
  )
  VALUES (
    p_affiliate_id,
    p_period,
    p_start_date,
    p_end_date,
    v_visits_count,
    v_referrals_count,
    v_conversion_rate,
    v_earnings
  )
  ON CONFLICT (affiliate_id, period, start_date, end_date)
  DO UPDATE SET
    visits_count = v_visits_count,
    referrals_count = v_referrals_count,
    conversion_rate = v_conversion_rate,
    earnings = v_earnings,
    created_at = now()
  RETURNING id INTO v_metric_id;

  RETURN v_metric_id;
END;
$$;

-- Add unique constraint to prevent duplicates
ALTER TABLE affiliate_performance_metrics 
ADD CONSTRAINT affiliate_performance_metrics_unique 
UNIQUE (affiliate_id, period, start_date, end_date);

-- Comment on table and columns
COMMENT ON TABLE affiliate_performance_metrics IS 'Stores historical performance metrics for affiliates';
COMMENT ON COLUMN affiliate_performance_metrics.period IS 'Time period for the metrics (month, quarter, year)';
COMMENT ON COLUMN affiliate_performance_metrics.conversion_rate IS 'Percentage of visits that converted to referrals';