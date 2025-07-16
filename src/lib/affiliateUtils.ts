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
    const response = await fetch(
      `${supabase.supabaseUrl}/functions/v1/create-affiliate-user`, 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseKey}`,
          'X-Request-ID': Math.random().toString(36).substring(2, 15)
        },
        body: JSON.stringify(userData)
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
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
          'Authorization': `Bearer ${supabase.supabaseKey}`
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
    return {
      error: error.message,
      supabaseUrl: supabase.supabaseUrl,
      hasKey: !!supabase.supabaseKey
    };
  }
}