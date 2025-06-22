-- Ensure support_tickets table exists with proper structure
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_profile_id uuid REFERENCES member_profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  status text CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  ticket_number text UNIQUE NOT NULL
);

-- Ensure support_messages table exists with proper structure
CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  support_ticket_id uuid REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_role text CHECK (sender_role IN ('member', 'staff')) NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Members can manage own support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Members can read own support messages" ON support_messages;
DROP POLICY IF EXISTS "Members can create support messages" ON support_messages;

-- Create policies for support_tickets
CREATE POLICY "Members can manage own support tickets"
  ON support_tickets
  FOR ALL
  TO authenticated
  USING (
    member_profile_id IN (
      SELECT id FROM member_profiles WHERE user_id = auth.uid()
    )
  );

-- Create policies for support_messages
CREATE POLICY "Members can read own support messages"
  ON support_messages
  FOR SELECT
  TO authenticated
  USING (
    support_ticket_id IN (
      SELECT st.id FROM support_tickets st
      JOIN member_profiles mp ON st.member_profile_id = mp.id
      WHERE mp.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create support messages"
  ON support_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    support_ticket_id IN (
      SELECT st.id FROM support_tickets st
      JOIN member_profiles mp ON st.member_profile_id = mp.id
      WHERE mp.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_member_profile_id ON support_tickets(member_profile_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_messages(support_ticket_id);

-- Add helpful notice about the tables
DO $$
BEGIN
  RAISE NOTICE '=== SUPPORT TICKETS AND MESSAGES TABLES CREATED/UPDATED ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables created/updated for support system:';
  RAISE NOTICE '✅ support_tickets - For tracking member support requests';
  RAISE NOTICE '✅ support_messages - For storing conversation history';
  RAISE NOTICE '✅ Secured with RLS policies';
  RAISE NOTICE '✅ Indexed for performance';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Create UI components for ticket management';
  RAISE NOTICE '2. Implement message threading';
  RAISE NOTICE '3. Add staff notification system';
  RAISE NOTICE '================================';
END $$;