/*
  # Create affiliates table

  1. New Tables
    - `affiliates`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users.id)
      - `affiliate_code` (text, unique)
      - `total_referrals` (integer, default 0)
      - `total_earnings` (numeric, default 0)
      - `status` (text, default 'active')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `affiliates` table
    - Add policies for affiliates to read/update their own data
    - Add policy for admins to read all affiliates
    - Add policy for public leaderboard access
*/

-- Create affiliates table
CREATE TABLE IF NOT EXISTS public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  affiliate_code text UNIQUE NOT NULL,
  total_referrals integer DEFAULT 0,
  total_earnings numeric(10,2) DEFAULT 0.00,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Affiliates can read own data"
  ON public.affiliates
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'advisor')
    )
  );

CREATE POLICY "Affiliates can update own data"
  ON public.affiliates
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Public leaderboard access"
  ON public.affiliates
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

CREATE POLICY "Admins can manage all affiliates"
  ON public.affiliates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create trigger to update updated_at
CREATE TRIGGER update_affiliates_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_affiliate_code ON public.affiliates(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON public.affiliates(status);
CREATE INDEX IF NOT EXISTS idx_affiliates_total_earnings ON public.affiliates(total_earnings DESC);