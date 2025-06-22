/*
  # Member Portal Schema

  1. New Tables
    - `member_profiles` - Core member information and plan details
    - `member_dependents` - Family members covered under the plan
    - `documents` - Member documents (ID cards, guidelines, invoices)
    - `share_requests` - Medical share requests (claims equivalent)
    - `share_request_documents` - Documents attached to share requests
    - `billing_records` - Payment history and invoices
    - `payment_methods` - Stored payment methods
    - `support_tickets` - Customer support tickets
    - `support_messages` - Messages within support tickets
    - `notification_preferences` - Member notification settings

  2. Security
    - Enable RLS on all tables
    - Add policies for member data access
    - Add admin and advisor access policies
    - Add storage policies for file uploads

  3. Performance
    - Add indexes for common queries
    - Add triggers for automatic timestamp updates
*/

-- Member Profiles (extends user data with plan information)
CREATE TABLE IF NOT EXISTS member_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  member_number text UNIQUE NOT NULL,
  plan_id text NOT NULL,
  plan_name text NOT NULL,
  plan_type text CHECK (plan_type IN ('individual', 'family')) NOT NULL,
  status text CHECK (status IN ('active', 'pending', 'suspended', 'cancelled')) DEFAULT 'pending',
  enrollment_date date NOT NULL,
  next_billing_date date NOT NULL,
  monthly_contribution decimal(10,2) NOT NULL,
  advisor_id uuid,
  emergency_contact jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Member Dependents
CREATE TABLE IF NOT EXISTS member_dependents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_profile_id uuid REFERENCES member_profiles(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date NOT NULL,
  relationship text NOT NULL,
  status text CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Documents storage
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_profile_id uuid REFERENCES member_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text CHECK (type IN ('id_card', 'guidelines', 'invoice', 'enrollment', 'certificate', 'other')) NOT NULL,
  description text,
  file_url text NOT NULL,
  file_size bigint NOT NULL,
  upload_date timestamptz DEFAULT now(),
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Share Requests (equivalent to claims)
CREATE TABLE IF NOT EXISTS share_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_profile_id uuid REFERENCES member_profiles(id) ON DELETE CASCADE,
  request_number text UNIQUE NOT NULL,
  type text CHECK (type IN ('medical', 'dental', 'vision', 'emergency', 'prescription')) NOT NULL,
  description text NOT NULL,
  provider text NOT NULL,
  service_date date NOT NULL,
  requested_amount decimal(10,2) NOT NULL,
  approved_amount decimal(10,2),
  status text CHECK (status IN ('submitted', 'under_review', 'approved', 'denied', 'paid')) DEFAULT 'submitted',
  submitted_date timestamptz DEFAULT now(),
  reviewed_date timestamptz,
  paid_date timestamptz,
  notes text,
  review_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Share Request Documents
CREATE TABLE IF NOT EXISTS share_request_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_request_id uuid REFERENCES share_requests(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text CHECK (type IN ('receipt', 'eob', 'prescription', 'medical_report', 'other')) NOT NULL,
  file_url text NOT NULL,
  file_size bigint NOT NULL,
  upload_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Billing Records
CREATE TABLE IF NOT EXISTS billing_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_profile_id uuid REFERENCES member_profiles(id) ON DELETE CASCADE,
  invoice_number text UNIQUE NOT NULL,
  amount decimal(10,2) NOT NULL,
  due_date date NOT NULL,
  paid_date date,
  status text CHECK (status IN ('pending', 'paid', 'overdue', 'failed')) DEFAULT 'pending',
  payment_method text,
  description text NOT NULL,
  invoice_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payment Methods
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_profile_id uuid REFERENCES member_profiles(id) ON DELETE CASCADE,
  type text CHECK (type IN ('credit_card', 'bank_transfer', 'crypto', 'pix')) NOT NULL,
  last4 text,
  brand text,
  expiry_month integer,
  expiry_year integer,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_profile_id uuid REFERENCES member_profiles(id) ON DELETE CASCADE,
  ticket_number text UNIQUE NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  status text CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
  priority text CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  category text CHECK (category IN ('billing', 'claims', 'technical', 'general')) NOT NULL,
  assigned_to uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Support Messages
CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  support_ticket_id uuid REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_type text CHECK (sender_type IN ('member', 'advisor', 'admin', 'system')) NOT NULL,
  content text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  attachments jsonb,
  created_at timestamptz DEFAULT now()
);

-- Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_profile_id uuid REFERENCES member_profiles(id) ON DELETE CASCADE,
  email_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT true,
  share_request_updates boolean DEFAULT true,
  billing_reminders boolean DEFAULT true,
  marketing_emails boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE member_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_dependents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_request_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Members
CREATE POLICY "Members can read own profile"
  ON member_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Members can update own profile"
  ON member_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Members can read own dependents"
  ON member_dependents
  FOR ALL
  TO authenticated
  USING (
    member_profile_id IN (
      SELECT id FROM member_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can read own documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    member_profile_id IN (
      SELECT id FROM member_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can manage own share requests"
  ON share_requests
  FOR ALL
  TO authenticated
  USING (
    member_profile_id IN (
      SELECT id FROM member_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can manage own share request documents"
  ON share_request_documents
  FOR ALL
  TO authenticated
  USING (
    share_request_id IN (
      SELECT sr.id FROM share_requests sr
      JOIN member_profiles mp ON sr.member_profile_id = mp.id
      WHERE mp.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can read own billing records"
  ON billing_records
  FOR SELECT
  TO authenticated
  USING (
    member_profile_id IN (
      SELECT id FROM member_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can manage own payment methods"
  ON payment_methods
  FOR ALL
  TO authenticated
  USING (
    member_profile_id IN (
      SELECT id FROM member_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can manage own support tickets"
  ON support_tickets
  FOR ALL
  TO authenticated
  USING (
    member_profile_id IN (
      SELECT id FROM member_profiles WHERE user_id = auth.uid()
    )
  );

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

CREATE POLICY "Members can manage own notification preferences"
  ON notification_preferences
  FOR ALL
  TO authenticated
  USING (
    member_profile_id IN (
      SELECT id FROM member_profiles WHERE user_id = auth.uid()
    )
  );

-- Admin policies (can access all data)
CREATE POLICY "Admins can access all member profiles"
  ON member_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Advisor policies (can access assigned members)
CREATE POLICY "Advisors can access assigned member profiles"
  ON member_profiles
  FOR SELECT
  TO authenticated
  USING (
    advisor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'advisor'
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_member_profiles_user_id ON member_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_member_profiles_member_number ON member_profiles(member_number);
CREATE INDEX IF NOT EXISTS idx_member_dependents_member_profile_id ON member_dependents(member_profile_id);
CREATE INDEX IF NOT EXISTS idx_documents_member_profile_id ON documents(member_profile_id);
CREATE INDEX IF NOT EXISTS idx_share_requests_member_profile_id ON share_requests(member_profile_id);
CREATE INDEX IF NOT EXISTS idx_share_requests_status ON share_requests(status);
CREATE INDEX IF NOT EXISTS idx_billing_records_member_profile_id ON billing_records(member_profile_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_member_profile_id ON support_tickets(member_profile_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_messages(support_ticket_id);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_member_profiles_updated_at BEFORE UPDATE ON member_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_member_dependents_updated_at BEFORE UPDATE ON member_dependents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_share_requests_updated_at BEFORE UPDATE ON share_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_billing_records_updated_at BEFORE UPDATE ON billing_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();