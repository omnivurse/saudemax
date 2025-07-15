/**
 * Utility to help with Keplr wallet conflicts and injections
 */

/**
 * Detects if there are multiple wallet extensions that might conflict with Keplr
 * @returns Information about potential conflicts
 */
export const detectWalletConflicts = (): { 
  hasKeplr: boolean;
  hasPotentialConflicts: boolean;
  conflictingExtensions: string[];
} => {
  const result = {
    hasKeplr: false,
    hasPotentialConflicts: false,
    conflictingExtensions: [] as string[]
  };
  
  // Check if Keplr is available
  if (typeof window !== 'undefined' && window.keplr) {
    result.hasKeplr = true;
  }
  
  // Check for other wallets that might conflict
  // These are common Cosmos-based wallets that could interfere
  const potentialConflicts = [
    { name: 'Leap Wallet', check: () => typeof window !== 'undefined' && !!window.leap },
    { name: 'Cosmostation', check: () => typeof window !== 'undefined' && !!window.cosmostation },
    { name: 'Coin98', check: () => typeof window !== 'undefined' && !!window.coin98 },
    // Add other potential conflicting wallets as needed
  ];
  
  for (const wallet of potentialConflicts) {
    try {
      if (wallet.check()) {
        result.hasPotentialConflicts = true;
        result.conflictingExtensions.push(wallet.name);
      }
    } catch (e) {
      // Ignore errors in checks
    }
  }
  
  return result;
};

/**
 * Attempts to safely initialize Keplr, handling potential conflicts
 * @returns An object with the initialization result
 */
export const safeInitializeKeplr = async (): Promise<{
  success: boolean;
  error?: string;
  keplr?: any;
  offlineSigner?: any;
}> => {
  try {
    // First check if Keplr exists
    if (typeof window === 'undefined' || !window.keplr) {
      return {
        success: false,
        error: 'Keplr wallet extension not detected. Please install Keplr and refresh.'
      };
    }
    
    // Check for conflicts before attempting initialization
    const conflicts = detectWalletConflicts();
    if (conflicts.hasPotentialConflicts) {
      console.warn('Potential wallet conflicts detected:', conflicts.conflictingExtensions);
      return {
        success: false,
        error: `Other wallet extensions detected (${conflicts.conflictingExtensions.join(', ')}) that may conflict with Keplr. Please disable them and try again.`
      };
    }
    
    // Try to enable Keplr with a short timeout to avoid hanging
    const keplr = window.keplr;
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Keplr connection timed out')), 3000);
    });
    
    // Try to enable the chain
    await Promise.race([
      keplr.enable('cosmoshub-4'), // Use your specific chain ID
      timeoutPromise
    ]);
    
    // Get the offline signer
    const offlineSigner = await keplr.getOfflineSigner('cosmoshub-4'); // Use your specific chain ID
    
    return {
      success: true,
      keplr,
      offlineSigner
    };
  } catch (error) {
    console.error('Error initializing Keplr:', error);
    let errorMessage = 'Failed to initialize Keplr wallet';
    
    // Check for the specific error mentioned
    if (error.message?.includes('inject getOfflineSigner') || 
        error.message?.includes('intercept Keplr')) {
      errorMessage = 'Another wallet extension is conflicting with Keplr. Please disable other wallets and try again in incognito mode.';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Example usage in a React component:
 * 
 * const connectKeplr = async () => {
 *   setConnecting(true);
 *   try {
 *     const result = await safeInitializeKeplr();
 *     if (result.success) {
 *       const { keplr, offlineSigner } = result;
 *       // Use keplr and offlineSigner here
 *     } else {
 *       // Show error message to user
 *       setErrorMessage(result.error);
 *     }
 *   } finally {
 *     setConnecting(false);
 *   }
 * };
 */