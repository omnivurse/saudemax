import { supabase } from './supabase';

/**
 * Checks if a Supabase Edge Function is deployed and accessible
 * @param functionName The name of the Edge Function to check
 * @returns An object with status information
 */
export async function checkEdgeFunctionStatus(functionName: string) {
  try {
    // First, try to invoke the function with a simple OPTIONS request
    // This will tell us if the function exists and CORS is properly configured
    const response = await fetch(`${supabase.supabaseUrl}/functions/v1/${functionName}`, {
      method: 'OPTIONS',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabase.supabaseKey}`,
        throw new Error('Unable to connect to Supabase. Check your internet connection and Supabase URL.');
      }
    });

    // If we get a 204 No Content, the function exists and CORS is properly configured
    if (response.status === 204) {
      return {
        deployed: true,
        accessible: true,
        status: 'available',
        message: `Function ${functionName} is deployed and accessible`
      };
    }

    // If we get a 404, the function doesn't exist or isn't deployed
    if (response.status === 404) {
      return {
        deployed: false,
        accessible: false,
        status: 'not_found',
        message: `Function ${functionName} is not deployed or doesn't exist`
      };
    }

    // For other status codes, the function exists but there might be issues
    return {
      deployed: true,
      accessible: false,
      status: 'error',
      statusCode: response.status,
      message: `Function ${functionName} exists but returned status ${response.status}`
    };
  } catch (error) {
    // Network errors indicate the function might exist but is not accessible
    // This could be due to CORS, network issues, or other problems
    return {
      deployed: null, // We can't determine if it's deployed
      accessible: false,
      status: 'network_error',
      message: `Could not access function ${functionName}: ${error.message}`,
      error
    };
  }
}

/**
 * Checks if the create-affiliate-user function is deployed and accessible
 */
export async function checkCreateAffiliateUserFunction() {
  return checkEdgeFunctionStatus('create-affiliate-user');
}

/**
 * Diagnoses issues with the create-affiliate-user function
 * @returns An object with diagnostic information
 */
export async function diagnoseCreateAffiliateUserFunction() {
  const status = await checkCreateAffiliateUserFunction();
  
  // If the function is deployed and accessible, no further diagnosis needed
  if (status.deployed && status.accessible) {
    return {
      ...status,
      diagnosis: 'Function is working correctly'
    };
  }
  
  // If we couldn't determine if the function is deployed
  if (status.deployed === null) {
    return {
      ...status,
      diagnosis: 'Network error prevented diagnosis. Check your internet connection and CORS configuration.',
      possibleIssues: [
        'Browser CORS restrictions',
        'Network connectivity issues',
        'Supabase project URL is incorrect',
        'Supabase anon key is invalid'
      ],
      recommendations: [
        'Verify supabaseUrl and supabaseKey are correct',
        'Check browser console for specific CORS errors',
        'Try accessing the function from a different network',
        'Ensure the function has proper CORS headers'
      ]
    };
  }
  
  // If the function is not deployed
  if (!status.deployed) {
    return {
      ...status,
      diagnosis: 'Function is not deployed or does not exist',
      possibleIssues: [
        'Function has not been deployed to Supabase',
        'Function name is incorrect',
        'Function was deployed to a different project'
      ],
      recommendations: [
        'Deploy the function using Supabase CLI or dashboard',
        'Verify the function name is correct',
        'Check that you are using the correct Supabase project'
      ]
    };
  }
  
  // If the function is deployed but not accessible
  return {
    ...status,
    diagnosis: 'Function is deployed but not accessible',
    possibleIssues: [
      'CORS configuration is incorrect',
      'Function has errors or is disabled',
      'Authentication issues with the Supabase key'
    ],
    recommendations: [
      'Check the function logs in Supabase dashboard',
      'Verify CORS headers include your application origin',
      'Ensure the function is enabled in Supabase dashboard',
      'Check that your Supabase anon key has the necessary permissions'
    ]
  };
}