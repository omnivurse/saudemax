import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeploymentStatusUpdate {
  status: 'idle' | 'in_progress' | 'completed' | 'failed';
  message: string;
  deploymentId?: string;
  deployUrl?: string;
  claimUrl?: string;
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
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { status, message, deploymentId, deployUrl, claimUrl }: DeploymentStatusUpdate = await req.json();

    // Validate required fields
    if (!status || !message) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Status and message are required" 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Call the RPC function to update deployment status
    const { data, error } = await supabase.rpc(
      "update_deployment_status",
      {
        p_status: status,
        p_message: message,
        p_deployment_id: deploymentId || null,
        p_deploy_url: deployUrl || null,
        p_claim_url: claimUrl || null
      }
    );

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: data
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error updating deployment status:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to update deployment status"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});