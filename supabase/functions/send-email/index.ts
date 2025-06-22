import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@1.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject?: string;
  template_id?: string;
  body?: string;
  data?: Record<string, any>;
  from?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Get environment variables
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const defaultFromEmail = Deno.env.get("DEFAULT_FROM_EMAIL") || "hello@saudemax.com";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    // Check if Resend API key is configured
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    // Initialize Resend client
    const resend = new Resend(resendApiKey);

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { to, subject, template_id, body, data = {}, from } = await req.json() as EmailRequest;

    // Validate required fields
    if (!to) {
      throw new Error("Recipient email (to) is required");
    }

    if (!template_id && !body) {
      throw new Error("Either template_id or body is required");
    }

    // Get user information for authentication
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    let userEmail: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        userId = user.id;
        userEmail = user.email || null;
      }
    }

    let emailSubject = subject;
    let emailBody = body;
    let templateData = { ...data };

    // If using a template, fetch it from the database
    if (template_id) {
      const { data: template, error } = await supabase
        .from("email_templates")
        .select("*")
        .eq("id", template_id)
        .single();

      if (error || !template) {
        throw new Error(`Template not found: ${template_id}`);
      }

      // Use template subject if not overridden
      emailSubject = subject || template.subject;
      
      // Replace template variables
      emailBody = template.html_body;
      
      // Replace all {{variable}} placeholders with actual data
      Object.entries(templateData).forEach(([key, value]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        emailBody = emailBody.replace(regex, String(value));
      });
    }

    // Send email using Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: from || defaultFromEmail,
      to: [to],
      subject: emailSubject!,
      html: emailBody!,
    });

    if (emailError) {
      throw emailError;
    }

    // Log the email in the database
    const { error: logError } = await supabase
      .from("email_logs")
      .insert({
        to_email: to,
        subject: emailSubject,
        template_id: template_id || null,
        data: data,
        status: "sent",
        user_id: userId
      });

    if (logError) {
      console.error("Error logging email:", logError);
      // Continue anyway since the email was sent
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
        id: emailData?.id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    
    // Try to log the failed email
    try {
      const { to, subject, template_id, data } = await req.json() as EmailRequest;
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      await supabase
        .from("email_logs")
        .insert({
          to_email: to,
          subject: subject || "Unknown subject",
          template_id: template_id || null,
          data: data || {},
          status: "failed",
          error: error.message
        });
    } catch (logError) {
      console.error("Error logging failed email:", logError);
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to send email"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});