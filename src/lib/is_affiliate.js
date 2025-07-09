/**
 * Helper function to check if a user has the affiliate role
 * 
 * @param {Object} user - The user object from auth context
 * @returns {boolean} - True if the user has affiliate role, false otherwise
 */
export function isAffiliate(user) {
  if (!user) return false;
  
  // Check user.role directly
  if (user.role === 'affiliate') return true;
  
  // Check app_metadata
  if (user.app_metadata?.role === 'affiliate') return true;
  
  // Check user_metadata
  if (user.user_metadata?.role === 'affiliate') return true;
  
  return false;
}