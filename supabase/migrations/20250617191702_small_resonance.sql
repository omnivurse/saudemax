-- Create migrated_members table
CREATE TABLE IF NOT EXISTS migrated_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wp_user_id integer,
  email text,
  full_name text,
  plan_id integer,
  subscription_start date,
  subscription_status text,
  iua_level text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE migrated_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage migrated members" ON migrated_members;

-- Create admin-only policy
CREATE POLICY "Admins can manage migrated members"
  ON migrated_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data ->> 'role') = 'admin'
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_migrated_members_wp_user_id ON migrated_members(wp_user_id);
CREATE INDEX IF NOT EXISTS idx_migrated_members_email ON migrated_members(email);

-- Add helpful notice about the new table
DO $$
BEGIN
  RAISE NOTICE '=== MIGRATED_MEMBERS TABLE CREATED ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Table created for WooCommerce member migration:';
  RAISE NOTICE '✅ Includes WooCommerce user ID and subscription details';
  RAISE NOTICE '✅ Secured with RLS - admin access only';
  RAISE NOTICE '✅ Indexed for performance';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Import WooCommerce users using the provided schema';
  RAISE NOTICE '2. Map users to Supabase auth users';
  RAISE NOTICE '3. Create member_profiles from migrated data';
  RAISE NOTICE '================================';
END $$;