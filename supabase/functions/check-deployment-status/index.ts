import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeploymentStatus {
  status: 'idle' | 'in_progress' | 'completed' | 'failed';
  message: string;
  lastUpdated: string;
  deploymentId?: string;
  deployUrl?: string;
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
    
    // Get deployment status from system_settings table
    const response = await fetch(`${supabaseUrl}/rest/v1/system_settings?key=eq.deployment_status`, {
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch deployment status: ${response.statusText}`);
    }

    const data = await response.json();
    let deploymentStatus: DeploymentStatus;

    if (data && data.length > 0) {
      // Parse the stored status
      try {
        deploymentStatus = JSON.parse(data[0].value);
      } catch (e) {
        // If parsing fails, return a default status
        deploymentStatus = {
          status: 'idle',
          message: 'No active deployment',
          lastUpdated: new Date().toISOString()
        };
      }
    } else {
      // No status found, return default
      deploymentStatus = {
        status: 'idle',
        message: 'No deployment history found',
        lastUpdated: new Date().toISOString()
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: deploymentStatus
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error checking deployment status:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to check deployment status"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});