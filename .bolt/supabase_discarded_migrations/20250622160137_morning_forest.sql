/*
  # Add RLS Policy for affiliate_links Table

  1. Purpose
    - Enable Row Level Security on the affiliate_links table
    - Create a policy allowing users to only see their own affiliate links
    
  2. Security Features
    - Restricts access to only the affiliate who owns the link
    - Uses auth.uid() to securely identify the current user
*/

-- Enable Row Level Security on the affiliate_links table
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to only see their own affiliate links
CREATE POLICY "Affiliate self access"
  ON public.affiliate_links
  FOR SELECT
  TO authenticated
  USING (auth.uid() = affiliate_id);

-- Add helpful notice about the security implementation
DO $$
BEGIN
  RAISE NOTICE '=== RLS POLICY ADDED TO AFFILIATE_LINKS ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Security features implemented:';
  RAISE NOTICE '✅ Row Level Security enabled on affiliate_links table';
  RAISE NOTICE '✅ Policy created to restrict access to own affiliate links only';
  RAISE NOTICE '✅ Uses auth.uid() for secure user identification';
  RAISE NOTICE '';
  RAISE NOTICE 'This ensures affiliates can only view their own links.';
  RAISE NOTICE '================================================';
END $$;