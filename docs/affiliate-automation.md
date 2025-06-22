# SaudeMAX Affiliate Automation System

## Overview

The SaudeMAX Affiliate Automation System provides a comprehensive workflow for managing affiliate referrals, conversions, commissions, and payouts. The system is designed to automate key processes in the affiliate lifecycle, reducing manual work and ensuring consistent handling of affiliate data.

## Automation Workflow

| Trigger | Automation |
|---------|------------|
| ✅ Affiliate makes referral | n8n creates record in `affiliate_referrals` |
| 💰 Referral converts | Add `commission_earned` to affiliate |
| 🧾 New withdrawal request | Email sent via `send-withdrawal-notification` |
| 📤 Admin pays affiliate | Log payout + update affiliate balance |
| 🔁 Every week (cron) | Recalculate leaderboard stats in background |

## Edge Functions

The system uses Supabase Edge Functions to handle the automation workflow:

### `affiliate-automation`

This edge function provides multiple endpoints for handling different aspects of the affiliate automation:

#### 1. `create-referral`

Creates a new affiliate referral record when a user clicks an affiliate link and converts.

**Endpoint:** `/functions/v1/affiliate-automation/create-referral`

**Payload:**
```json
{
  "affiliate_code": "AFFILIATE123",
  "order_id": "ORD-12345",
  "order_amount": 349.00,
  "referred_user_id": "user-uuid",
  "conversion_type": "subscription"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Referral created successfully",
  "data": {
    "id": "referral-uuid",
    "affiliate_id": "affiliate-uuid",
    "order_id": "ORD-12345",
    "commission_amount": 34.90,
    "status": "pending"
  }
}
```

#### 2. `process-conversion`

Approves or rejects a referral, updating the affiliate's commission.

**Endpoint:** `/functions/v1/affiliate-automation/process-conversion`

**Payload:**
```json
{
  "referral_id": "referral-uuid",
  "status": "approved",
  "notes": "Valid referral, commission approved"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Referral approved successfully",
  "data": {
    "id": "referral-uuid",
    "status": "approved",
    "notes": "Valid referral, commission approved"
  }
}
```

#### 3. `process-withdrawal`

Processes an affiliate withdrawal request and sends notification emails.

**Endpoint:** `/functions/v1/affiliate-automation/process-withdrawal`

**Payload:**
```json
{
  "withdrawal_id": "withdrawal-uuid",
  "status": "completed",
  "transaction_id": "TXN-12345",
  "notes": "Payment sent via PayPal"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Withdrawal completed successfully",
  "data": {
    "id": "withdrawal-uuid",
    "status": "completed",
    "transaction_id": "TXN-12345"
  }
}
```

#### 4. `update-leaderboard`

Updates the affiliate leaderboard statistics (typically run on a schedule).

**Endpoint:** `/functions/v1/affiliate-automation/update-leaderboard`

**Payload:**
```json
{
  "force_update": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Leaderboard updated successfully",
  "affiliatesUpdated": 42,
  "timestamp": "2025-06-14T12:34:56.789Z"
}
```

## Database Schema

### `system_settings` Table

Stores system-wide settings and timestamps for automation tasks:

```sql
CREATE TABLE system_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);
```

Initial settings:
- `last_leaderboard_update`: Last date the affiliate leaderboard was updated
- `affiliate_system_version`: Current version of the affiliate system
- `min_withdrawal_amount`: Minimum amount for affiliate withdrawals

## Frontend Integration

### `useAffiliateAutomation` Hook

A custom React hook that provides an interface to the automation functions:

```typescript
export const useAffiliateAutomation = () => {
  // State for loading and errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a new referral
  const createReferral = async (params: CreateReferralParams) => {...};

  // Process a conversion (approve/reject referral)
  const processConversion = async (params: ProcessConversionParams) => {...};

  // Process a withdrawal request
  const processWithdrawal = async (params: ProcessWithdrawalParams) => {...};

  // Update the leaderboard (admin only)
  const updateLeaderboard = async (forceUpdate: boolean = false) => {...};

  return {
    createReferral,
    processConversion,
    processWithdrawal,
    updateLeaderboard,
    loading,
    error
  };
};
```

### Admin Automation Dashboard

The `AffiliateAutomationDashboard` component provides an interface for admins to:

- View the status of automation workflows
- Manually trigger the leaderboard update
- Toggle automation processes on/off
- Monitor the last run time of scheduled tasks

## Integration with n8n

The system is designed to work with n8n for workflow automation:

1. **Referral Tracking Workflow**:
   - Trigger: User clicks affiliate link
   - Action: Store referral code in localStorage/cookies
   - Action: Record visit in `affiliate_visits` table

2. **Conversion Workflow**:
   - Trigger: User completes enrollment
   - Action: Check for stored affiliate code
   - Action: Call `create-referral` endpoint
   - Action: Update affiliate statistics

3. **Withdrawal Workflow**:
   - Trigger: Affiliate requests withdrawal
   - Action: Create record in `affiliate_withdrawals` table
   - Action: Call `send-withdrawal-notification` function
   - Action: Admin reviews and processes withdrawal
   - Action: Call `process-withdrawal` endpoint
   - Action: Update affiliate balance

4. **Leaderboard Update Workflow**:
   - Trigger: Weekly cron job
   - Action: Call `update-leaderboard` endpoint
   - Action: Update `last_leaderboard_update` in system settings

## Security Considerations

1. **Authentication**: All endpoints require authentication with appropriate permissions
2. **Role-Based Access**: Only admins can process conversions and withdrawals
3. **Data Validation**: All inputs are validated before processing
4. **Error Handling**: Comprehensive error handling and logging
5. **Idempotency**: Operations are designed to be idempotent to prevent duplicates

## Monitoring and Maintenance

The system includes:

1. **Status Dashboard**: View current status of automation processes
2. **Manual Triggers**: Ability to manually trigger automations
3. **Audit Logs**: Track all automation activities
4. **Error Reporting**: Comprehensive error reporting and notifications

## Future Enhancements

1. **Advanced Analytics**: More detailed performance metrics for affiliates
2. **Fraud Detection**: Automated detection of suspicious referral patterns
3. **Multi-tier Commissions**: Support for multi-level affiliate structures
4. **Custom Commission Rules**: More flexible commission calculation based on products or tiers
5. **Affiliate Portal Enhancements**: More detailed reporting and analytics for affiliates