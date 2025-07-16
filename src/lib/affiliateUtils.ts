import { supabase } from './supabase';

/**
 * Creates a new affiliate user by calling the Supabase Edge Function
 * @param userData Object containing user and affiliate details
 * @returns Response from the Edge Function
 */
export async function createAffiliateUser(userData: {
  email: string;
  password: string;
  fullName: string;
  payoutEmail: string;
  payoutMethod: 'paypal' | 'bank_transfer' | 'crypto';
}) {
  try {
    const supabaseUrl = supabase.supabaseUrl;
    const supabaseKey = supabase.supabaseKey;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL or key is missing');
    }
    
    console.log('Making request to:', `${supabaseUrl}/functions/v1/create-affiliate-user`);
    
    const response = await fetch(
      `${supabaseUrl}/functions/v1/create-affiliate-user`, 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'X-Client-Info': 'supabase-js/2.39.3',
          'X-Request-ID': Math.random().toString(36).substring(2, 15),
          'Cache-Control': 'no-cache, no-store'
        },
        body: JSON.stringify(userData)
      }
    );

    console.log('Response status:', response.status);
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.error('Error response:', errorData);
      } catch (e) {
        // If response is not JSON
        errorData = { error: `HTTP error ${response.status}: ${response.statusText || 'Unknown error'}` };
        console.error('Non-JSON error:', errorData);
      }
      throw new Error(errorData.error || 'Failed to create affiliate user');
    }

    return await response.json();
  } catch (error) {
    console.error('Affiliate user creation error:', error);
    throw error;
  }
}

/**
 * Diagnoses potential issues with the create-affiliate-user Edge Function
 * @returns Diagnostic information
 */
export async function diagnoseCreateAffiliateFunction() {
  try {
    // Make a simple OPTIONS request to check if the function is accessible
    const response = await fetch(
      `${supabase.supabaseUrl}/functions/v1/create-affiliate-user`,
      { 
        method: 'OPTIONS',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Return diagnostic information
    return {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
      headers: Object.fromEntries([...response.headers.entries()]),
      supabaseUrl: supabase.supabaseUrl,
      hasKey: !!supabase.supabaseKey
    };
  } catch (error) {
    console.error('Diagnostic error:', error);
    return {
      error: error.message,
      supabaseUrl: supabase.supabaseUrl,
      hasKey: !!supabase.supabaseKey
    };
  }
}