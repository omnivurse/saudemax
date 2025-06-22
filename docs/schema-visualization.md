# SaudeMAX Database Schema & RLS Visualization

## Database Schema Overview

The SaudeMAX platform uses a comprehensive Supabase PostgreSQL database with the following core tables:

### Core Member Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `member_profiles` | Core member information | `id`, `user_id`, `member_number`, `plan_id`, `plan_name`, `plan_type`, `status`, `enrollment_date`, `next_billing_date`, `monthly_contribution` |
| `member_dependents` | Family members covered under plans | `id`, `member_profile_id`, `first_name`, `last_name`, `date_of_birth`, `relationship`, `status` |
| `documents` | Member documents (ID cards, etc.) | `id`, `member_profile_id`, `name`, `type`, `file_url`, `file_size`, `is_public` |

### Healthcare Sharing Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `share_requests` | Medical expense sharing requests | `id`, `member_profile_id`, `request_number`, `type`, `description`, `provider`, `service_date`, `requested_amount`, `approved_amount`, `status` |
| `share_request_documents` | Supporting documents for share requests | `id`, `share_request_id`, `name`, `type`, `file_url`, `file_size` |

### Billing & Payment Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `billing_records` | Payment history and invoices | `id`, `member_profile_id`, `invoice_number`, `amount`, `due_date`, `paid_date`, `status`, `payment_method` |
| `payment_methods` | Stored payment methods | `id`, `member_profile_id`, `type`, `last4`, `brand`, `expiry_month`, `expiry_year`, `is_default`, `is_active` |

### Support Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `support_tickets` | Customer support tickets | `id`, `member_profile_id`, `ticket_number`, `subject`, `description`, `status`, `priority`, `category`, `assigned_to` |
| `support_messages` | Messages within support tickets | `id`, `support_ticket_id`, `sender_id`, `sender_type`, `content`, `timestamp`, `attachments` |
| `notification_preferences` | Member notification settings | `id`, `member_profile_id`, `email_notifications`, `sms_notifications`, `share_request_updates`, `billing_reminders`, `marketing_emails` |

### Affiliate System Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `affiliates` | Affiliate profiles | `id`, `user_id`, `affiliate_code`, `referral_link`, `email`, `status`, `commission_rate`, `total_earnings`, `total_referrals` |
| `affiliate_visits` | Visit tracking | `id`, `affiliate_id`, `ip_address`, `user_agent`, `referrer`, `page_url`, `country`, `device_type`, `browser`, `converted` |
| `affiliate_referrals` | Conversion tracking | `id`, `affiliate_id`, `referred_user_id`, `order_id`, `order_amount`, `commission_amount`, `commission_rate`, `status`, `conversion_type` |
| `affiliate_withdrawals` | Payout management | `id`, `affiliate_id`, `amount`, `method`, `payout_email`, `status`, `transaction_id`, `notes`, `requested_at`, `processed_at` |

### User & Role Management

| Table | Description | Key Fields |
|-------|-------------|------------|
| `users` | Extended user profiles | `id`, `email`, `full_name`, `role`, `avatar_url`, `preferred_language`, `last_login`, `is_active` |
| `roles` | User role assignments | `id`, `role`, `created_at`, `updated_at` |
| `role_permissions` | Granular permissions | `id`, `role`, `resource`, `permission`, `created_at` |

## Entity Relationship Diagram (ERD)

```
member_profiles 1──N member_dependents
member_profiles 1──N documents
member_profiles 1──N share_requests
share_requests 1──N share_request_documents
member_profiles 1──N billing_records
member_profiles 1──N payment_methods
member_profiles 1──N support_tickets
support_tickets 1──N support_messages
member_profiles 1──N notification_preferences
users 1──1 member_profiles
users 1──1 roles
roles N──N role_permissions
users 1──1 affiliates
affiliates 1──N affiliate_visits
affiliates 1──N affiliate_referrals
affiliates 1──N affiliate_withdrawals
```

## Row-Level Security (RLS) Policies

### Role-Based Access Control

The system implements a secure role-based access control system with the following roles:

| Role | Description | Access Level |
|------|-------------|--------------|
| `admin` | System administrators | Full access to all data |
| `advisor` | Healthcare advisors | Access to assigned members |
| `member` | Regular members | Access to own data only |
| `affiliate` | Marketing affiliates | Access to own affiliate data |

### RLS Policy Summary

#### Member Data Access

```sql
-- Members can only access their own data
CREATE POLICY "Members can read own profile"
  ON member_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Advisors can access assigned members
CREATE POLICY "Advisors can access assigned member profiles"
  ON member_profiles
  FOR SELECT
  TO authenticated
  USING (advisor_id = auth.uid() OR has_role('advisor'));

-- Admins can access all member data
CREATE POLICY "Admins can access all member profiles"
  ON member_profiles
  FOR ALL
  TO authenticated
  USING (has_role('admin'));
```

#### Affiliate System Security

```sql
-- Affiliates can only view their own profile
CREATE POLICY "Affiliates can view own profile"
  ON affiliates
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Affiliates can only view their own referrals
CREATE POLICY "Affiliates can view own referrals"
  ON affiliate_referrals
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );

-- Public can view active affiliates for referral validation
CREATE POLICY "Public can view active affiliates"
  ON affiliates
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Anonymous visit tracking allowed
CREATE POLICY "Anonymous visit tracking"
  ON affiliate_visits
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
```

## Security Functions

The system includes several helper functions for secure role-based access:

```sql
-- Check if user has a specific role
CREATE OR REPLACE FUNCTION has_role(required_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.roles
    WHERE id = auth.uid() AND role = required_role
  );
END;
$$;

-- Check if user has permission for a resource
CREATE OR REPLACE FUNCTION has_permission(resource text, required_permission text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get user's role
  SELECT role INTO user_role FROM public.roles WHERE id = auth.uid();
  
  -- Check if user has the required permission
  RETURN EXISTS (
    SELECT 1 FROM public.role_permissions
    WHERE role = user_role 
      AND resource = has_permission.resource
      AND (permission = has_permission.required_permission OR permission = 'all')
  );
END;
$$;
```

## Affiliate System Functions

```sql
-- Get affiliate stats
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

-- Get public affiliate leaderboard
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

-- Process affiliate withdrawal
CREATE OR REPLACE FUNCTION process_withdrawal(
  withdrawal_id uuid,
  new_status text,
  transaction_id text DEFAULT NULL,
  notes text DEFAULT NULL
)
RETURNS boolean
```

## Database Triggers

The system uses several triggers to maintain data integrity and security:

1. **Updated Timestamp Triggers**: Automatically update `updated_at` columns when records are modified
2. **Role Sync Trigger**: Syncs role changes to JWT claims in `app_metadata`
3. **New User Trigger**: Sets up default roles and profiles for new users
4. **Affiliate Stats Trigger**: Updates affiliate statistics when referrals change

## Security Best Practices

1. **No User Metadata in RLS**: Policies use `app_metadata` (server-controlled) instead of `user_metadata` (user-editable)
2. **Fixed Search Paths**: All functions use `SECURITY DEFINER` with fixed search paths
3. **Proper Data Isolation**: Users can only access their own data
4. **Role-Based Access**: Comprehensive role system with granular permissions
5. **JWT Claim Sync**: User roles are synced to JWT claims for frontend validation