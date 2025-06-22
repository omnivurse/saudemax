# SaudeMAX Member Portal Documentation

## Overview

The SaudeMAX Member Portal is a comprehensive platform that allows members to manage their healthcare sharing plans, submit share requests (claims), view documents, manage billing, and communicate with support. The portal is designed to provide a seamless and secure experience for members.

## Core Features

### Member Dashboard

The dashboard provides an overview of the member's plan, recent activity, and quick access to key features:

- Plan details and status
- Recent share requests
- Upcoming payments
- Important documents
- Support access

### Share Request Center

Members can submit and track medical expense sharing requests:

- Submit new share requests
- Upload supporting documentation
- Track request status
- View approved amounts
- Receive notifications on status changes

### Documents Center

Centralized repository for all member documents:

- Member ID cards
- Plan guidelines
- Invoices and receipts
- Share request documentation
- Certificates and enrollment forms

### Billing History

Complete view of billing records and payment management:

- View payment history
- Manage payment methods
- Download invoices
- Make payments
- Set up automatic payments

### Support System

Integrated support system for member assistance:

- Create support tickets
- Live chat with advisors
- View ticket history
- Receive notifications on responses

## Database Schema

### Core Member Tables

```sql
-- Member Profiles
CREATE TABLE member_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  member_number text UNIQUE NOT NULL,
  plan_id text NOT NULL,
  plan_name text NOT NULL,
  plan_type text CHECK (plan_type IN ('individual', 'family')) NOT NULL,
  status text CHECK (status IN ('active', 'pending', 'suspended', 'cancelled')) DEFAULT 'pending',
  enrollment_date date NOT NULL,
  next_billing_date date NOT NULL,
  monthly_contribution numeric(10,2) NOT NULL,
  advisor_id uuid,
  emergency_contact jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Member Dependents
CREATE TABLE member_dependents (
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
```

### Share Request Tables

```sql
-- Share Requests
CREATE TABLE share_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_profile_id uuid REFERENCES member_profiles(id) ON DELETE CASCADE,
  request_number text UNIQUE NOT NULL,
  type text CHECK (type IN ('medical', 'dental', 'vision', 'emergency', 'prescription')) NOT NULL,
  description text NOT NULL,
  provider text NOT NULL,
  service_date date NOT NULL,
  requested_amount numeric(10,2) NOT NULL,
  approved_amount numeric(10,2),
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
CREATE TABLE share_request_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_request_id uuid REFERENCES share_requests(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text CHECK (type IN ('receipt', 'eob', 'prescription', 'medical_report', 'other')) NOT NULL,
  file_url text NOT NULL,
  file_size bigint NOT NULL,
  upload_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
```

### Document Management

```sql
-- Documents
CREATE TABLE documents (
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
```

### Billing System

```sql
-- Billing Records
CREATE TABLE billing_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_profile_id uuid REFERENCES member_profiles(id) ON DELETE CASCADE,
  invoice_number text UNIQUE NOT NULL,
  amount numeric(10,2) NOT NULL,
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
CREATE TABLE payment_methods (
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
```

### Support System

```sql
-- Support Tickets
CREATE TABLE support_tickets (
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
CREATE TABLE support_messages (
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
CREATE TABLE notification_preferences (
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
```

## Security Model

### Row-Level Security (RLS)

The member portal implements strict row-level security to ensure data privacy:

```sql
-- Members can only access their own profile
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

-- Members can only access their own dependents
CREATE POLICY "Members can read own dependents"
  ON member_dependents
  FOR ALL
  TO authenticated
  USING (
    member_profile_id IN (
      SELECT id FROM member_profiles WHERE user_id = auth.uid()
    )
  );

-- Members can only access their own share requests
CREATE POLICY "Members can manage own share requests"
  ON share_requests
  FOR ALL
  TO authenticated
  USING (
    member_profile_id IN (
      SELECT id FROM member_profiles WHERE user_id = auth.uid()
    )
  );
```

### Role-Based Access

The system uses a role-based access control system with the following roles:

- **Member**: Access to own data only
- **Advisor**: Access to assigned members' data
- **Admin**: Full access to all data

```sql
-- Advisors can access assigned members
CREATE POLICY "Advisors can access assigned member profiles"
  ON member_profiles
  FOR SELECT
  TO authenticated
  USING (
    advisor_id = auth.uid() OR has_role('advisor')
  );

-- Admins can access all data
CREATE POLICY "Admins can access all member profiles"
  ON member_profiles
  FOR ALL
  TO authenticated
  USING (has_role('admin'));
```

## Frontend Components

### Dashboard Layout

```jsx
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const memberNavigation = [
    { name: 'Home', href: '/member/dashboard', icon: Home },
    { name: 'Members', href: '/member/members', icon: Users },
    { name: 'Claims', href: '/member/claims', icon: Activity },
    { name: 'Support', href: '/member/support', icon: MessageCircle },
  ];

  // ... rest of component
};
```

### Member Dashboard

```jsx
export const MemberDashboard: React.FC = () => {
  const { user } = useAuth();
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        // Replace with actual API call
        setTimeout(() => {
          setMemberData(mockMemberData);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to fetch member data:', error);
        setLoading(false);
      }
    };

    fetchMemberData();
  }, []);

  // ... rest of component
};
```

### Share Request Center

```jsx
export const ClaimsCenter: React.FC = () => {
  const [shareRequests, setShareRequests] = useState<ShareRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);

  useEffect(() => {
    const fetchShareRequests = async () => {
      try {
        // Replace with actual API call
        setTimeout(() => {
          setShareRequests(mockShareRequests);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to fetch share requests:', error);
        setLoading(false);
      }
    };

    fetchShareRequests();
  }, []);

  // ... rest of component
};
```

### Documents Center

```jsx
export const DocumentsCenter: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // ... rest of component
};
```

### Billing History

```jsx
export const BillingHistory: React.FC = () => {
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<BillingRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // ... rest of component
};
```

### Support Chat

```jsx
export const SupportChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeView, setActiveView] = useState<'chat' | 'tickets'>('chat');
  const [tickets, setTickets] = useState<SupportTicket[]>(mockTickets);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ... rest of component
};
```

## User Flows

### Share Request Submission

1. Member navigates to Claims Center
2. Clicks "New Request" button
3. Fills out request form with:
   - Request type (medical, dental, vision, etc.)
   - Provider information
   - Service date
   - Requested amount
   - Description
4. Uploads supporting documents
5. Submits request
6. System generates unique request number
7. Request status is set to "submitted"
8. Member receives confirmation
9. Advisor is notified of new request

### Document Access

1. Member navigates to Documents Center
2. Views list of available documents
3. Can filter by document type
4. Can search for specific documents
5. Downloads or views documents
6. System tracks document access

### Billing Management

1. Member navigates to Billing History
2. Views list of invoices and payment history
3. Can filter by status (paid, pending, overdue)
4. Can download invoices
5. Can make payments for pending invoices
6. Can manage payment methods
7. Can set up automatic payments

## API Integration

### Supabase Queries

```typescript
// Fetch member profile
const { data: profile, error } = await supabase
  .from('member_profiles')
  .select('*')
  .eq('user_id', user.id)
  .single();

// Fetch share requests
const { data: shareRequests, error } = await supabase
  .from('share_requests')
  .select(`
    *,
    share_request_documents(*)
  `)
  .eq('member_profile_id', profile.id)
  .order('submitted_date', { ascending: false });

// Submit new share request
const { data, error } = await supabase
  .from('share_requests')
  .insert({
    member_profile_id: profile.id,
    request_number: `SR-${Date.now()}`,
    type: formData.type,
    description: formData.description,
    provider: formData.provider,
    service_date: formData.serviceDate,
    requested_amount: formData.amount
  });
```

### File Storage

```typescript
// Upload document
const { data, error } = await supabase.storage
  .from('share-request-documents')
  .upload(`${shareRequestId}/${file.name}`, file);

// Get document URL
const { data: { publicUrl } } = supabase.storage
  .from('documents')
  .getPublicUrl(`${memberId}/id-card.pdf`);
```

## Mobile Responsiveness

The member portal is fully responsive and optimized for mobile devices:

- Responsive layout using Tailwind CSS
- Mobile-friendly navigation
- Touch-optimized UI components
- Adaptive content display
- Optimized form inputs for mobile

## Internationalization

The portal supports multiple languages using i18next:

```typescript
// i18n configuration
const resources = {
  en: {
    translation: {
      // English translations
    }
  },
  pt: {
    translation: {
      // Portuguese translations
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });
```

## Performance Optimizations

- Lazy loading of components
- Pagination for large data sets
- Efficient state management
- Optimized database queries
- Caching of frequently accessed data
- Debounced search inputs
- Virtualized lists for large collections