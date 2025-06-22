import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AffiliateReferralPayload {
  affiliate_code: string;
  order_id?: string;
  order_amount?: number;
  referred_user_id?: string;
  conversion_type: 'signup' | 'purchase' | 'subscription';
}

interface WithdrawalPayload {
  withdrawal_id: string;
  status: 'processing' | 'completed' | 'failed';
  transaction_id?: string;
  notes?: string;
}

interface LeaderboardUpdatePayload {
  force_update?: boolean;
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
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the request path
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    // Process based on the endpoint
    switch (path) {
      case "create-referral":
        return await handleCreateReferral(req, supabase);
      case "process-conversion":
        return await handleProcessConversion(req, supabase);
      case "process-withdrawal":
        return await handleProcessWithdrawal(req, supabase);
      case "update-leaderboard":
        return await handleUpdateLeaderboard(req, supabase);
      default:
        return new Response(
          JSON.stringify({ error: "Unknown endpoint" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Handle creating a new affiliate referral
async function handleCreateReferral(req: Request, supabase: any) {
  const payload: AffiliateReferralPayload = await req.json();
  
  // Validate required fields
  if (!payload.affiliate_code || !payload.conversion_type) {
    return new Response(
      JSON.stringify({ error: "affiliate_code and conversion_type are required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Get affiliate by code
    const { data: affiliateData, error: affiliateError } = await supabase
      .from("affiliates")
      .select("id, commission_rate")
      .eq("affiliate_code", payload.affiliate_code)
      .eq("status", "active")
      .single();

    if (affiliateError || !affiliateData) {
      return new Response(
        JSON.stringify({ error: "Affiliate not found or inactive" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Calculate commission amount if order amount is provided
    const commissionAmount = payload.order_amount 
      ? (payload.order_amount * (affiliateData.commission_rate / 100)) 
      : 0;

    // Create referral record
    const { data: referralData, error: referralError } = await supabase
      .from("affiliate_referrals")
      .insert({
        affiliate_id: affiliateData.id,
        referred_user_id: payload.referred_user_id,
        order_id: payload.order_id,
        order_amount: payload.order_amount,
        commission_amount: commissionAmount,
        commission_rate: affiliateData.commission_rate,
        conversion_type: payload.conversion_type,
        status: "pending"
      })
      .select()
      .single();

    if (referralError) {
      throw referralError;
    }

    // Update affiliate visit if it exists
    if (payload.referred_user_id) {
      await supabase
        .from("affiliate_visits")
        .update({ converted: true })
        .eq("affiliate_id", affiliateData.id)
        .is("converted", false)
        .order("created_at", { ascending: false })
        .limit(1);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Referral created successfully", 
        data: referralData 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating referral:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to create referral" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

// Handle processing a conversion (approve/reject referral)
async function handleProcessConversion(req: Request, supabase: any) {
  const { referral_id, status, notes } = await req.json();
  
  // Validate required fields
  if (!referral_id || !status) {
    return new Response(
      JSON.stringify({ error: "referral_id and status are required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Validate status
  if (!["approved", "rejected"].includes(status)) {
    return new Response(
      JSON.stringify({ error: "Status must be 'approved' or 'rejected'" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Update referral status
    const { data: referralData, error: referralError } = await supabase
      .from("affiliate_referrals")
      .update({
        status,
        notes: notes || null
      })
      .eq("id", referral_id)
      .select("*, affiliate:affiliates(id, email, affiliate_code)")
      .single();

    if (referralError) {
      throw referralError;
    }

    // If approved, update affiliate stats
    // Note: This should also be handled by the update_affiliate_stats trigger
    if (status === "approved") {
      await supabase.rpc("update_affiliate_stats", {
        affiliate_id: referralData.affiliate.id
      });
    }

    // Send notification email (optional)
    // This would call the send-withdrawal-notification function or similar

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Referral ${status} successfully`, 
        data: referralData 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing conversion:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process conversion" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

// Handle processing a withdrawal request
async function handleProcessWithdrawal(req: Request, supabase: any) {
  const payload: WithdrawalPayload = await req.json();
  
  // Validate required fields
  if (!payload.withdrawal_id || !payload.status) {
    return new Response(
      JSON.stringify({ error: "withdrawal_id and status are required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Get withdrawal record with affiliate info
    const { data: withdrawalData, error: withdrawalError } = await supabase
      .from("affiliate_withdrawals")
      .select("*, affiliate:affiliates(id, email, affiliate_code, payout_email)")
      .eq("id", payload.withdrawal_id)
      .single();

    if (withdrawalError || !withdrawalData) {
      return new Response(
        JSON.stringify({ error: "Withdrawal not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update withdrawal status
    const { data: updatedWithdrawal, error: updateError } = await supabase
      .from("affiliate_withdrawals")
      .update({
        status: payload.status,
        transaction_id: payload.transaction_id || null,
        notes: payload.notes || null,
        processed_at: new Date().toISOString()
      })
      .eq("id", payload.withdrawal_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // If completed, update affiliate total_earnings
    if (payload.status === "completed") {
      await supabase
        .from("affiliates")
        .update({
          total_earnings: supabase.rpc("decrement", { 
            x: withdrawalData.amount,
            y: withdrawalData.affiliate.total_earnings
          })
        })
        .eq("id", withdrawalData.affiliate.id);
    }

    // Send notification email
    try {
      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-withdrawal-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          email: withdrawalData.affiliate.email,
          status: payload.status,
          amount: withdrawalData.amount,
          affiliateCode: withdrawalData.affiliate.affiliate_code
        })
      });

      if (!emailResponse.ok) {
        console.error("Failed to send notification email:", await emailResponse.text());
      }
    } catch (emailError) {
      console.error("Error sending notification:", emailError);
      // Don't fail the whole operation if email fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Withdrawal ${payload.status} successfully`, 
        data: updatedWithdrawal 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing withdrawal:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process withdrawal" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

// Handle updating the leaderboard (scheduled task)
async function handleUpdateLeaderboard(req: Request, supabase: any) {
  const payload: LeaderboardUpdatePayload = await req.json();
  const forceUpdate = payload.force_update || false;

  try {
    // Check if we need to update (only update once per day unless forced)
    const { data: lastUpdate, error: lastUpdateError } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "last_leaderboard_update")
      .single();

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (!forceUpdate && lastUpdate && lastUpdate.value === today) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Leaderboard already updated today", 
          lastUpdate: lastUpdate.value 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update all affiliate statistics
    const { data: affiliates, error: affiliatesError } = await supabase
      .from("affiliates")
      .select("id")
      .eq("status", "active");

    if (affiliatesError) {
      throw affiliatesError;
    }

    // Process each affiliate
    for (const affiliate of affiliates) {
      await supabase.rpc("update_affiliate_stats", {
        affiliate_id: affiliate.id
      });
    }

    // Update last update timestamp
    await supabase
      .from("system_settings")
      .upsert({
        key: "last_leaderboard_update",
        value: today
      }, {
        onConflict: "key"
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Leaderboard updated successfully", 
        affiliatesUpdated: affiliates.length,
        timestamp: now.toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error updating leaderboard:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to update leaderboard" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}