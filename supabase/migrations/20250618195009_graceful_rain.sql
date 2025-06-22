/*
  # Email Templates and Logs Schema

  1. New Tables
    - `email_templates` - Stores email templates with mustache-style placeholders
    - `email_logs` - Tracks all sent emails for auditing and troubleshooting
    
  2. Security
    - Enable RLS on all tables
    - Only admins can manage templates
    - Users can view their own email logs
    
  3. Initial Data
    - Add starter templates for common scenarios
*/

-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id text PRIMARY KEY, -- slug: welcome-agent, referral-earned, etc.
  subject text NOT NULL,
  html_body text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  subject text NOT NULL,
  template_id text REFERENCES email_templates(id),
  data jsonb DEFAULT '{}'::jsonb,
  status text CHECK (status IN ('sent', 'failed', 'delivered', 'opened')) DEFAULT 'sent',
  error text,
  sent_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for email_templates
CREATE POLICY "Admins can manage email templates"
  ON email_templates
  FOR ALL
  TO authenticated
  USING (has_role('admin'));

CREATE POLICY "All users can read email templates"
  ON email_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for email_logs
CREATE POLICY "Users can view own email logs"
  ON email_logs
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR
    to_email IN (
      SELECT email FROM users WHERE id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Admins can view all email logs"
  ON email_logs
  FOR ALL
  TO authenticated
  USING (has_role('admin'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_template_id ON email_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);

-- Create trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial email templates
INSERT INTO email_templates (id, subject, html_body, description)
VALUES 
  (
    'welcome-agent', 
    'Welcome to SaudeMAX Affiliate Program', 
    '<!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to SaudeMAX Affiliate Program</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px;
        }
        .header { 
          background: linear-gradient(135deg, #0062cc, #0097a7);
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          padding: 20px;
          background: #fff;
          border: 1px solid #e0e0e0;
        }
        .footer {
          text-align: center;
          padding: 20px;
          font-size: 12px;
          color: #666;
        }
        .button {
          display: inline-block;
          background-color: #0062cc;
          color: white;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .stats {
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Welcome to SaudeMAX!</h1>
      </div>
      <div class="content">
        <p>Hello {{full_name}},</p>
        <p>Welcome to the SaudeMAX Affiliate Program! We''re excited to have you join our team of healthcare sharing advocates.</p>
        
        <p>Here are your affiliate details:</p>
        <div class="stats">
          <p><strong>Affiliate Code:</strong> {{affiliate_code}}</p>
          <p><strong>Referral Link:</strong> {{referral_link}}</p>
          <p><strong>Commission Rate:</strong> {{commission_rate}}%</p>
        </div>
        
        <p>With your unique affiliate link, you can start referring new members right away. For each successful referral, you''ll earn a commission on their monthly contribution.</p>
        
        <a href="{{dashboard_url}}" class="button">Access Your Dashboard</a>
        
        <p>If you have any questions, please don''t hesitate to contact our affiliate support team.</p>
        
        <p>Best regards,<br>The SaudeMAX Team</p>
      </div>
      <div class="footer">
        <p>© 2025 SaudeMAX. All rights reserved.</p>
        <p>This email was sent to {{email}}. If you believe this was sent in error, please contact support.</p>
      </div>
    </body>
    </html>',
    'Welcome email for new affiliate agents'
  ),
  (
    'referral-earned', 
    'Congratulations! You Earned a Commission', 
    '<!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You Earned a Commission</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px;
        }
        .header { 
          background: linear-gradient(135deg, #2e7d32, #4caf50);
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          padding: 20px;
          background: #fff;
          border: 1px solid #e0e0e0;
        }
        .footer {
          text-align: center;
          padding: 20px;
          font-size: 12px;
          color: #666;
        }
        .button {
          display: inline-block;
          background-color: #2e7d32;
          color: white;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .commission {
          font-size: 24px;
          font-weight: bold;
          color: #2e7d32;
          text-align: center;
          padding: 15px;
          background-color: #f1f8e9;
          border-radius: 5px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Commission Earned!</h1>
      </div>
      <div class="content">
        <p>Hello {{full_name}},</p>
        <p>Great news! You''ve earned a commission from a successful referral.</p>
        
        <div class="commission">
          ${{amount}}
        </div>
        
        <p><strong>Details:</strong></p>
        <ul>
          <li>Plan: {{plan_name}}</li>
          <li>Commission Type: {{commission_type}}</li>
          <li>Date: {{date}}</li>
        </ul>
        
        <p>This commission will be included in your next payout. Keep up the great work!</p>
        
        <a href="{{dashboard_url}}" class="button">View Your Dashboard</a>
        
        <p>Thank you for your continued partnership with SaudeMAX.</p>
        
        <p>Best regards,<br>The SaudeMAX Team</p>
      </div>
      <div class="footer">
        <p>© 2025 SaudeMAX. All rights reserved.</p>
        <p>This email was sent to {{email}}. If you believe this was sent in error, please contact support.</p>
      </div>
    </body>
    </html>',
    'Email notification when an affiliate earns a commission'
  ),
  (
    'withdrawal-processed', 
    'Your Withdrawal Request Has Been Processed', 
    '<!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Withdrawal Request Processed</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px;
        }
        .header { 
          background: linear-gradient(135deg, #1565c0, #0d47a1);
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          padding: 20px;
          background: #fff;
          border: 1px solid #e0e0e0;
        }
        .footer {
          text-align: center;
          padding: 20px;
          font-size: 12px;
          color: #666;
        }
        .button {
          display: inline-block;
          background-color: #1565c0;
          color: white;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .withdrawal {
          font-size: 24px;
          font-weight: bold;
          color: #1565c0;
          text-align: center;
          padding: 15px;
          background-color: #e3f2fd;
          border-radius: 5px;
          margin: 20px 0;
        }
        .status {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 3px;
          font-weight: bold;
        }
        .status.completed {
          background-color: #e8f5e9;
          color: #2e7d32;
        }
        .status.processing {
          background-color: #fff8e1;
          color: #f57f17;
        }
        .status.failed {
          background-color: #ffebee;
          color: #c62828;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Withdrawal Update</h1>
      </div>
      <div class="content">
        <p>Hello {{full_name}},</p>
        <p>We''re writing to inform you about your recent withdrawal request.</p>
        
        <div class="withdrawal">
          ${{amount}}
        </div>
        
        <p><strong>Status:</strong> <span class="status {{status}}">{{status}}</span></p>
        <p><strong>Transaction ID:</strong> {{transaction_id}}</p>
        <p><strong>Processed Date:</strong> {{processed_date}}</p>
        
        {{#if notes}}
        <p><strong>Notes:</strong> {{notes}}</p>
        {{/if}}
        
        <p>{{status_message}}</p>
        
        <a href="{{dashboard_url}}" class="button">View Your Dashboard</a>
        
        <p>If you have any questions about this withdrawal, please contact our support team.</p>
        
        <p>Best regards,<br>The SaudeMAX Team</p>
      </div>
      <div class="footer">
        <p>© 2025 SaudeMAX. All rights reserved.</p>
        <p>This email was sent to {{email}}. If you believe this was sent in error, please contact support.</p>
      </div>
    </body>
    </html>',
    'Email notification when a withdrawal request is processed'
  ),
  (
    'share-request-update', 
    'Update on Your Share Request #{{request_number}}', 
    '<!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Share Request Update</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px;
        }
        .header { 
          background: linear-gradient(135deg, #7b1fa2, #9c27b0);
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          padding: 20px;
          background: #fff;
          border: 1px solid #e0e0e0;
        }
        .footer {
          text-align: center;
          padding: 20px;
          font-size: 12px;
          color: #666;
        }
        .button {
          display: inline-block;
          background-color: #7b1fa2;
          color: white;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .request-details {
          background-color: #f3e5f5;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .status {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 3px;
          font-weight: bold;
        }
        .status.approved {
          background-color: #e8f5e9;
          color: #2e7d32;
        }
        .status.under_review {
          background-color: #fff8e1;
          color: #f57f17;
        }
        .status.denied {
          background-color: #ffebee;
          color: #c62828;
        }
        .status.submitted {
          background-color: #e3f2fd;
          color: #1565c0;
        }
        .status.paid {
          background-color: #e8f5e9;
          color: #2e7d32;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Share Request Update</h1>
      </div>
      <div class="content">
        <p>Hello {{full_name}},</p>
        <p>There has been an update to your share request.</p>
        
        <div class="request-details">
          <p><strong>Request Number:</strong> {{request_number}}</p>
          <p><strong>Provider:</strong> {{provider}}</p>
          <p><strong>Service Date:</strong> {{service_date}}</p>
          <p><strong>Requested Amount:</strong> ${{requested_amount}}</p>
          <p><strong>Status:</strong> <span class="status {{status}}">{{status_display}}</span></p>
          {{#if approved_amount}}
          <p><strong>Approved Amount:</strong> ${{approved_amount}}</p>
          {{/if}}
        </div>
        
        {{#if review_notes}}
        <p><strong>Notes from Review:</strong> {{review_notes}}</p>
        {{/if}}
        
        <p>{{status_message}}</p>
        
        <a href="{{dashboard_url}}" class="button">View Request Details</a>
        
        <p>If you have any questions about this share request, please contact our member services team.</p>
        
        <p>Best regards,<br>The SaudeMAX Team</p>
      </div>
      <div class="footer">
        <p>© 2025 SaudeMAX. All rights reserved.</p>
        <p>This email was sent to {{email}}. If you believe this was sent in error, please contact support.</p>
      </div>
    </body>
    </html>',
    'Email notification when a share request status is updated'
  ),
  (
    'payment-receipt', 
    'Payment Receipt - SaudeMAX', 
    '<!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Receipt</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px;
        }
        .header { 
          background: linear-gradient(135deg, #00796b, #009688);
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          padding: 20px;
          background: #fff;
          border: 1px solid #e0e0e0;
        }
        .footer {
          text-align: center;
          padding: 20px;
          font-size: 12px;
          color: #666;
        }
        .button {
          display: inline-block;
          background-color: #00796b;
          color: white;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .receipt {
          border: 1px solid #e0e0e0;
          border-radius: 5px;
          margin: 20px 0;
        }
        .receipt-header {
          background-color: #e0f2f1;
          padding: 10px 15px;
          border-bottom: 1px solid #e0e0e0;
        }
        .receipt-body {
          padding: 15px;
        }
        .receipt-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px solid #f5f5f5;
        }
        .receipt-total {
          font-weight: bold;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 2px solid #e0e0e0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Payment Receipt</h1>
      </div>
      <div class="content">
        <p>Hello {{full_name}},</p>
        <p>Thank you for your payment to SaudeMAX. This email serves as your receipt.</p>
        
        <div class="receipt">
          <div class="receipt-header">
            <h3>Receipt #{{invoice_number}}</h3>
            <p>Date: {{payment_date}}</p>
          </div>
          <div class="receipt-body">
            <div class="receipt-row">
              <span>Plan:</span>
              <span>{{plan_name}}</span>
            </div>
            <div class="receipt-row">
              <span>Billing Period:</span>
              <span>{{billing_period}}</span>
            </div>
            <div class="receipt-row">
              <span>Payment Method:</span>
              <span>{{payment_method}}</span>
            </div>
            {{#if last4}}
            <div class="receipt-row">
              <span>Card ending in:</span>
              <span>{{last4}}</span>
            </div>
            {{/if}}
            <div class="receipt-total">
              <div class="receipt-row">
                <span>Total:</span>
                <span>${{amount}}</span>
              </div>
            </div>
          </div>
        </div>
        
        <p>Your next payment of ${{next_amount}} is scheduled for {{next_payment_date}}.</p>
        
        <a href="{{dashboard_url}}" class="button">View Billing History</a>
        
        <p>If you have any questions about this payment, please contact our member services team.</p>
        
        <p>Best regards,<br>The SaudeMAX Team</p>
      </div>
      <div class="footer">
        <p>© 2025 SaudeMAX. All rights reserved.</p>
        <p>This email was sent to {{email}}. If you believe this was sent in error, please contact support.</p>
      </div>
    </body>
    </html>',
    'Email receipt for payments'
  );

-- Add helpful notice about the email templates
DO $$
BEGIN
  RAISE NOTICE '=== EMAIL TEMPLATES CREATED ===';
  RAISE NOTICE '';
  RAISE NOTICE 'The following email templates have been created:';
  RAISE NOTICE '✅ welcome-agent - Welcome email for new affiliate agents';
  RAISE NOTICE '✅ referral-earned - Email notification when an affiliate earns a commission';
  RAISE NOTICE '✅ withdrawal-processed - Email notification when a withdrawal request is processed';
  RAISE NOTICE '✅ share-request-update - Email notification when a share request status is updated';
  RAISE NOTICE '✅ payment-receipt - Email receipt for payments';
  RAISE NOTICE '';
  RAISE NOTICE 'These templates use {{mustache}} style placeholders for dynamic content.';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Create the send-email edge function';
  RAISE NOTICE '2. Set up the email provider (Resend, SendGrid, or Mailgun)';
  RAISE NOTICE '3. Implement the email sending logic';
  RAISE NOTICE '================================';
END $$;