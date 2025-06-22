import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { email, password, fullName, payoutEmail, payoutMethod }: CreateAffiliateUserRequest = await req.json();

    // Validate required fields
    if (!email || !password || !fullName || !payoutEmail || !payoutMethod) {
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
    const { data: existingUser, error: checkError } = await supabase.auth.admin.listUsers();
    
    if (checkError) {
      console.error("Error checking existing users:", checkError);
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

    // Check if affiliate code would be unique
    const firstInitial = fullName.charAt(0).toUpperCase();
    const lastName = fullName.split(' ').pop() || '';
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const affiliateCode = `AF-${firstInitial}${lastName.toUpperCase()}${randomDigits}`;

    // Check if affiliate code already exists
    const { data: existingAffiliate, error: affiliateCheckError } = await supabase
      .from('affiliates')
      .select('affiliate_code')
      .eq('affiliate_code', affiliateCode)
      .single();

    if (affiliateCheckError && affiliateCheckError.code !== 'PGRST116') {
      console.error("Error checking affiliate code:", affiliateCheckError);
    }

    // If affiliate code exists, generate a new one
    let finalAffiliateCode = affiliateCode;
    if (existingAffiliate) {
      const newRandomDigits = Math.floor(1000 + Math.random() * 9000);
      finalAffiliateCode = `AF-${firstInitial}${lastName.toUpperCase()}${newRandomDigits}`;
    }

    // Create user with admin API (allows setting app_metadata)
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName
      },
      app_metadata: {
        role: 'affiliate'
      }
    });

    if (userError) {
      console.error("User creation error:", userError);
      
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

    const referralLink = `${new URL(req.url).origin}?ref=${finalAffiliateCode}`;

    // Create affiliate record
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
      console.error("Affiliate creation error:", affiliateError);
      
      // If affiliate creation fails, we should delete the user to avoid orphaned accounts
      try {
        await supabase.auth.admin.deleteUser(userData.user.id);
      } catch (deleteError) {
        console.error("Failed to cleanup user after affiliate creation failure:", deleteError);
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

    // Create a role record for the user
    const { error: roleError } = await supabase
      .from('roles')
      .insert({
        id: userData.user.id,
        role: 'affiliate'
      });

    if (roleError) {
      console.error("Error creating role record:", roleError);
      // Continue anyway since the user and affiliate were created successfully
    }

    // Create user profile record
    const { error: userProfileError } = await supabase
      .from('users')
      .insert({
        id: userData.user.id,
        email: email,
        full_name: fullName,
        role: 'affiliate'
      });

    if (userProfileError) {
      console.error("Error creating user profile record:", userProfileError);
      // Continue anyway since the core functionality is working
    }

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