import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      // Create client with Auth context of the user that called the function.
      // This way your row-level-security (RLS) policies are applied.
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get query parameters
    const url = new URL(req.url)
    const timeFrame = url.searchParams.get('timeFrame') || 'all'
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const showEarnings = url.searchParams.get('showEarnings') === 'true'
    const showConversion = url.searchParams.get('showConversion') === 'true'

    // Determine date range based on timeFrame
    let dateFilter = null
    if (timeFrame === 'month') {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      dateFilter = thirtyDaysAgo.toISOString()
    } else if (timeFrame === 'quarter') {
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
      dateFilter = ninetyDaysAgo.toISOString()
    }

    // Fetch affiliates
    let query = supabaseClient
      .from('affiliates')
      .select('id, affiliate_code, total_referrals, total_earnings, total_visits, status')
      .eq('status', 'active')
      .order('total_earnings', { ascending: false })
      .limit(limit)

    const { data: affiliates, error: affiliatesError } = await query

    if (affiliatesError) {
      throw affiliatesError
    }

    // Process data for public consumption
    const publicData = affiliates.map((affiliate, index) => {
      const conversionRate = affiliate.total_visits > 0 
        ? (affiliate.total_referrals / affiliate.total_visits) * 100 
        : 0

      // Only include sensitive data if explicitly allowed
      const result: any = {
        rank: index + 1,
        affiliate_code: affiliate.affiliate_code,
        total_referrals: affiliate.total_referrals,
      }

      if (showEarnings) {
        result.total_earnings = affiliate.total_earnings
      }

      if (showConversion) {
        result.conversion_rate = conversionRate
      }

      return result
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: publicData,
        metadata: {
          timeFrame,
          showEarnings,
          showConversion,
          totalAffiliates: publicData.length,
          lastUpdated: new Date().toISOString()
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    
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