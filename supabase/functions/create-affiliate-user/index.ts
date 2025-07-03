import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-request-id, cache-control",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

interface CreateAffiliateUserRequest {
  email: string;
  password: string;
  fullName: string;
  payoutEmail: string;
  payoutMethod: 'paypal' | 'bank_transfer' | 'crypto';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Log request details for debugging
    const requestId = req.headers.get("X-Request-ID") || "unknown";
    console.log(`Processing request ${requestId}`);
    
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(`[${requestId}] Missing Supabase environment variables`);
      throw new Error("Missing Supabase environment variables");
    }

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log(`[${requestId}] Supabase client created`);

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log(`[${requestId}] Request body parsed:`, JSON.stringify(requestBody));
    } catch (parseError) {
      console.error(`[${requestId}] Error parsing request body:`, parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid request format" 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { email, password, fullName, payoutEmail, payoutMethod }: CreateAffiliateUserRequest = requestBody;

    // Validate required fields
    if (!email || !password || !fullName || !payoutEmail || !payoutMethod) {
      console.error(`[${requestId}] Missing required fields`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required fields" 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user already exists
    console.log(`[${requestId}] Checking if user exists: ${email}`);
    const { data: existingUser, error: checkError } = await supabase.auth.admin.listUsers();
    
    if (checkError) {
      console.error(`[${requestId}] Error checking existing users:`, checkError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to verify user uniqueness" 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if email already exists
    const emailExists = existingUser.users.some(user => user.email === email);
    if (emailExists) {
      console.error(`[${requestId}] Email already exists: ${email}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "An account with this email already exists. Please use a different email or try logging in." 
        }),
        { 
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate affiliate code
    const firstInitial = fullName.charAt(0).toUpperCase();
    const lastName = fullName.split(' ').pop() || '';
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const affiliateCode = `AF-${firstInitial}${lastName.toUpperCase()}${randomDigits}`;
    console.log(`[${requestId}] Generated affiliate code: ${affiliateCode}`);

    // Check if affiliate code already exists
    const { data: existingAffiliate, error: affiliateCheckError } = await supabase
      .from('affiliates')
      .select('affiliate_code')
      .eq('affiliate_code', affiliateCode)
      .single();

    if (affiliateCheckError && affiliateCheckError.code !== 'PGRST116') {
      console.error(`[${requestId}] Error checking affiliate code:`, affiliateCheckError);
    }

    // If affiliate code exists, generate a new one
    let finalAffiliateCode = affiliateCode;
    if (existingAffiliate) {
      const newRandomDigits = Math.floor(1000 + Math.random() * 9000);
      finalAffiliateCode = `AF-${firstInitial}${lastName.toUpperCase()}${newRandomDigits}`;
      console.log(`[${requestId}] Generated new affiliate code: ${finalAffiliateCode}`);
    }

    // Create user with admin API (allows setting app_metadata)
    console.log(`[${requestId}] Creating user: ${email}`);
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
        role: 'affiliate'
      },
      app_metadata: {
        role: 'affiliate'
      }
    });

    if (userError) {
      console.error(`[${requestId}] User creation error:`, userError);
      
      // Provide specific error messages based on error type
      if (userError.message.includes('email')) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "This email is already registered. Please use a different email address." 
          }),
          { 
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } else if (userError.message.includes('password')) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Password does not meet requirements. Please use a stronger password." 
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } else {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Registration failed: ${userError.message}` 
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    if (!userData.user) {
      console.error(`[${requestId}] User creation failed - no user data returned`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "User creation failed - no user data returned" 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[${requestId}] User created successfully: ${userData.user.id}`);

    // Generate referral link
    const referralLink = `${new URL(req.url).origin}?ref=${finalAffiliateCode}`;
    console.log(`[${requestId}] Generated referral link: ${referralLink}`);

    // Create affiliate record
    console.log(`[${requestId}] Creating affiliate record`);
    const { data: affiliateData, error: affiliateError } = await supabase
      .from('affiliates')
      .insert({
        user_id: userData.user.id,
        affiliate_code: finalAffiliateCode,
        referral_link: referralLink,
        email: email,
        payout_email: payoutEmail,
        payout_method: payoutMethod,
        status: 'active' // Set to active immediately for testing
      })
      .select()
      .single();

    if (affiliateError) {
      console.error(`[${requestId}] Affiliate creation error:`, affiliateError);
      
      // If affiliate creation fails, we should delete the user to avoid orphaned accounts
      try {
        await supabase.auth.admin.deleteUser(userData.user.id);
        console.log(`[${requestId}] Cleaned up user after affiliate creation failure`);
      } catch (deleteError) {
        console.error(`[${requestId}] Failed to cleanup user after affiliate creation failure:`, deleteError);
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create affiliate profile: ${affiliateError.message}` 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[${requestId}] Affiliate record created successfully`);

    // Create a role record for the user
    console.log(`[${requestId}] Creating role record`);
    const { error: roleError } = await supabase
      .from('roles')
      .insert({
        id: userData.user.id,
        role: 'affiliate'
      });

    if (roleError) {
      console.error(`[${requestId}] Error creating role record:`, roleError);
      // Continue anyway since the user and affiliate were created successfully
    }

    // REMOVED: The redundant user profile record creation
    // This was causing the "Database error creating new user" error
    // The user record is now created automatically by database triggers

    console.log(`[${requestId}] Request completed successfully`);
    return new Response(
      JSON.stringify({
        success: true,
        message: "Affiliate account created successfully",
        user: {
          id: userData.user.id,
          email: userData.user.email,
          affiliate_code: finalAffiliateCode
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error creating affiliate user:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: `An unexpected error occurred: ${error.message || "Please try again later"}`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});