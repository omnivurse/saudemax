# SaudeMAX Affiliate System Documentation

## Overview

The SaudeMAX Affiliate System is a comprehensive marketing and referral tracking platform that allows partners to earn commissions by referring new members to SaudeMAX healthcare sharing plans. The system includes tracking, analytics, commission calculation, and payout management.

## Database Schema

### Core Tables

#### `affiliates`

Stores affiliate profiles and tracking information.

```sql
CREATE TABLE affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_code text UNIQUE NOT NULL,
  referral_link text NOT NULL,
  email text NOT NULL,
  status text CHECK (status IN ('active', 'pending', 'suspended', 'rejected')) DEFAULT 'pending',
  commission_rate numeric(5,2) DEFAULT 10.00,
  total_earnings numeric(10,2) DEFAULT 0.00,
  total_referrals integer DEFAULT 0,
  total_visits integer DEFAULT 0,
  payout_email text,
  payout_method text CHECK (payout_method IN ('paypal', 'bank_transfer', 'crypto')) DEFAULT 'paypal',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### `affiliate_visits`

Tracks visits to affiliate referral links.

```sql
CREATE TABLE affiliate_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES affiliates(id) ON DELETE CASCADE,
  ip_address inet,
  user_agent text,
  referrer text,
  page_url text,
  country text,
  device_type text,
  browser text,
  converted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

#### `affiliate_referrals`

Tracks successful conversions and commissions.

```sql
CREATE TABLE affiliate_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES affiliates(id) ON DELETE CASCADE,
  referred_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id text,
  order_amount numeric(10,2),
  commission_amount numeric(10,2),
  commission_rate numeric(5,2),
  status text CHECK (status IN ('pending', 'approved', 'paid', 'rejected')) DEFAULT 'pending',
  conversion_type text CHECK (conversion_type IN ('signup', 'purchase', 'subscription')) DEFAULT 'signup',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### `affiliate_withdrawals`

Manages payout requests and processing.

```sql
CREATE TABLE affiliate_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES affiliates(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  method text CHECK (method IN ('paypal', 'bank_transfer', 'crypto')) NOT NULL,
  payout_email text,
  status text CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  transaction_id text,
  notes text,
  requested_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

## Security Model

### Row-Level Security (RLS)

The affiliate system implements strict row-level security to ensure data isolation:

```sql
-- Affiliates can only view and update their own profile
CREATE POLICY "Affiliates can view own profile"
  ON affiliates
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Affiliates can update own profile"
  ON affiliates
  FOR UPDATE
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

-- Affiliates can manage their own withdrawal requests
CREATE POLICY "Affiliates can manage own withdrawals"
  ON affiliate_withdrawals
  FOR ALL
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

-- Allow anonymous visit tracking
CREATE POLICY "Anonymous visit tracking"
  ON affiliate_visits
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Admins can access all affiliate data
CREATE POLICY "Admins can manage all affiliates"
  ON affiliates
  FOR ALL
  TO authenticated
  USING (has_role('admin'));
```

## Helper Functions

### `get_affiliate_stats`

Returns performance metrics for an affiliate.

```sql
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
```

### `get_public_leaderboard`

Returns a public leaderboard of top affiliates.

```sql
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
```

### `process_withdrawal`

Processes an affiliate withdrawal request.

```sql
CREATE OR REPLACE FUNCTION process_withdrawal(
  withdrawal_id uuid,
  new_status text,
  transaction_id text DEFAULT NULL,
  notes text DEFAULT NULL
)
RETURNS boolean
```

## Automatic Updates

The system includes triggers to automatically update affiliate statistics:

```sql
CREATE OR REPLACE FUNCTION update_affiliate_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update affiliate totals when referral is created/updated
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE affiliates SET
      total_referrals = (
        SELECT COUNT(*) FROM affiliate_referrals 
        WHERE affiliate_id = NEW.affiliate_id
      ),
      total_earnings = (
        SELECT COALESCE(SUM(commission_amount), 0) 
        FROM affiliate_referrals 
        WHERE affiliate_id = NEW.affiliate_id 
        AND status IN ('approved', 'paid')
      ),
      updated_at = now()
    WHERE id = NEW.affiliate_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_affiliate_stats_trigger
  AFTER INSERT OR UPDATE ON affiliate_referrals
  FOR EACH ROW EXECUTE FUNCTION update_affiliate_stats();
```

## Frontend Implementation

### Components

1. **AffiliateTracker**: Tracks visits and stores referral codes
2. **AffiliateSecurityProvider**: Manages affiliate permissions
3. **SecureAffiliateWrapper**: Ensures proper access control
4. **AffiliateLeaderboardWidget**: Displays top affiliates

### Hooks

The `useAffiliate` hook provides a comprehensive API for affiliate operations:

```typescript
export const useAffiliate = () => {
  // State
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [metrics, setMetrics] = useState<AffiliateMetrics | null>(null);
  const [referrals, setReferrals] = useState<AffiliateReferral[]>([]);
  const [visits, setVisits] = useState<AffiliateVisit[]>([]);
  const [withdrawals, setWithdrawals] = useState<AffiliateWithdrawal[]>([]);
  
  // Methods
  const registerAffiliate = async (data) => {...}
  const updateAffiliate = async (updates) => {...}
  const requestWithdrawal = async (amount, method, payoutEmail) => {...}
  const trackVisit = async (affiliateCode, visitData) => {...}
  const trackReferral = async (affiliateCode, referralData) => {...}
  
  return {
    affiliate,
    metrics,
    referrals,
    visits,
    withdrawals,
    loading,
    error,
    registerAffiliate,
    updateAffiliate,
    requestWithdrawal,
    trackVisit,
    trackReferral,
    refetch
  };
};
```

## Referral Tracking Process

1. **Visit Tracking**:
   - User clicks affiliate link with `?ref=AFFILIATE_CODE`
   - `AffiliateTracker` component detects referral code
   - Code is stored in localStorage and cookies
   - Visit is recorded in `affiliate_visits` table

2. **Conversion Tracking**:
   - User completes enrollment and payment
   - System checks for stored affiliate code
   - If found, creates record in `affiliate_referrals`
   - Updates affiliate statistics

3. **Commission Processing**:
   - Admin reviews and approves referrals
   - Commission is calculated based on plan value and rate
   - Affiliate earnings are updated

4. **Withdrawal Process**:
   - Affiliate requests withdrawal
   - Admin reviews and processes request
   - Payment is sent via selected method
   - Transaction is recorded

## Edge Functions

The system includes Supabase Edge Functions for secure server-side operations:

### `send-withdrawal-notification`

Sends email notifications when withdrawal status changes.

```typescript
// Example usage
const { data, error } = await supabase.functions.invoke('send-withdrawal-notification', {
  body: {
    email: affiliate.email,
    status: 'completed',
    amount: withdrawal.amount,
    affiliateCode: affiliate.affiliate_code
  }
});
```

### `get-affiliate-leaderboard`

Returns a secure, filtered leaderboard for public display.

```typescript
// Example usage
const { data, error } = await supabase.functions.invoke('get-affiliate-leaderboard', {
  body: {
    timeFrame: 'month',
    limit: 10,
    showEarnings: true
  }
});
```

## Admin Dashboard Features

1. **Leaderboard Management**:
   - View top-performing affiliates
   - Filter by time period and metrics
   - Export data to CSV

2. **Withdrawal Queue**:
   - Review pending withdrawal requests
   - Process payments
   - Track transaction history

3. **Affiliate Management**:
   - Approve/reject affiliate applications
   - Adjust commission rates
   - Suspend/reactivate affiliates

## Best Practices

1. **Security**:
   - All sensitive operations require admin role
   - Strict RLS policies prevent data leakage
   - Server-side validation of all transactions

2. **Performance**:
   - Indexed tables for fast queries
   - Efficient triggers for stat updates
   - Pagination for large data sets

3. **Compliance**:
   - Proper tracking consent
   - Clear commission terms
   - Transparent withdrawal process