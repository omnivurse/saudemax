import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  email: string;
  status: string;
  amount: number;
  affiliateCode: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, status, amount, affiliateCode }: NotificationRequest = await req.json()

    // Email templates based on status
    const getEmailContent = (status: string) => {
      const baseSubject = `SaudeMAX Affiliate - Withdrawal Request ${status.charAt(0).toUpperCase() + status.slice(1)}`
      
      switch (status) {
        case 'processing':
          return {
            subject: baseSubject,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1f2937;">Withdrawal Request Approved</h2>
                <p>Hello ${affiliateCode},</p>
                <p>Great news! Your withdrawal request has been approved and is now being processed.</p>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin: 0 0 10px 0; color: #374151;">Withdrawal Details:</h3>
                  <p style="margin: 5px 0;"><strong>Amount:</strong> $${amount.toFixed(2)}</p>
                  <p style="margin: 5px 0;"><strong>Status:</strong> Processing</p>
                </div>
                <p>Your payment will be processed within 3-5 business days. You'll receive another notification once the payment is complete.</p>
                <p>Thank you for being a valued SaudeMAX affiliate!</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px;">
                  Best regards,<br>
                  The SaudeMAX Team
                </p>
              </div>
            `
          }
        
        case 'completed':
          return {
            subject: baseSubject,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #059669;">Payment Completed! 🎉</h2>
                <p>Hello ${affiliateCode},</p>
                <p>Excellent news! Your withdrawal has been successfully processed and paid.</p>
                <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
                  <h3 style="margin: 0 0 10px 0; color: #065f46;">Payment Details:</h3>
                  <p style="margin: 5px 0;"><strong>Amount:</strong> $${amount.toFixed(2)}</p>
                  <p style="margin: 5px 0;"><strong>Status:</strong> Completed</p>
                  <p style="margin: 5px 0;"><strong>Payment Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
                <p>The payment has been sent to your registered payout method. Please allow 1-2 business days for the funds to appear in your account.</p>
                <p>Keep up the great work promoting SaudeMAX!</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px;">
                  Best regards,<br>
                  The SaudeMAX Team
                </p>
              </div>
            `
          }
        
        case 'failed':
          return {
            subject: baseSubject,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc2626;">Withdrawal Request Update</h2>
                <p>Hello ${affiliateCode},</p>
                <p>We're writing to inform you about your recent withdrawal request.</p>
                <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                  <h3 style="margin: 0 0 10px 0; color: #991b1b;">Request Details:</h3>
                  <p style="margin: 5px 0;"><strong>Amount:</strong> $${amount.toFixed(2)}</p>
                  <p style="margin: 5px 0;"><strong>Status:</strong> Unable to Process</p>
                </div>
                <p>Unfortunately, we were unable to process your withdrawal request at this time. This could be due to:</p>
                <ul style="color: #374151;">
                  <li>Insufficient available balance</li>
                  <li>Issues with the payout method information</li>
                  <li>Pending verification requirements</li>
                </ul>
                <p>Please contact our support team for assistance or to update your payout information.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px;">
                  Best regards,<br>
                  The SaudeMAX Team<br>
                  <a href="mailto:support@saudemax.com">support@saudemax.com</a>
                </p>
              </div>
            `
          }
        
        default:
          return {
            subject: `SaudeMAX Affiliate - Withdrawal Request Update`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1f2937;">Withdrawal Request Update</h2>
                <p>Hello ${affiliateCode},</p>
                <p>Your withdrawal request for $${amount.toFixed(2)} has been updated to: <strong>${status}</strong></p>
                <p>If you have any questions, please contact our support team.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px;">
                  Best regards,<br>
                  The SaudeMAX Team
                </p>
              </div>
            `
          }
      }
    }

    const emailContent = getEmailContent(status)

    // Here you would integrate with your email service
    // For example, using Resend, SendGrid, or another email provider
    
    // Example with Resend (you'd need to add your API key):
    /*
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SaudeMAX <noreply@saudemax.com>',
        to: [email],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    })

    if (!emailResponse.ok) {
      throw new Error(`Email service error: ${emailResponse.statusText}`)
    }
    */

    // For now, just log the email content (replace with actual email sending)
    console.log('Email notification:', {
      to: email,
      subject: emailContent.subject,
      status: status,
      amount: amount
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent successfully',
        email: email,
        status: status
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error sending notification:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})