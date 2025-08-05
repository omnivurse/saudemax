/**
 * Status utility functions for consistent styling and display
 */

/**
 * Gets appropriate CSS classes for status badges
 * @param status - The status string
 * @returns CSS classes for styling the status
 */
export const getStatusColor = (status: string): string => {
  const statusMap: Record<string, string> = {
    // Member/Plan statuses
    'active': 'bg-green-100 text-green-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'suspended': 'bg-orange-100 text-orange-800',
    'cancelled': 'bg-red-100 text-red-800',
    'inactive': 'bg-gray-100 text-gray-800',
    
    // Payment/Billing statuses
    'paid': 'bg-green-100 text-green-800',
    'overdue': 'bg-red-100 text-red-800',
    'failed': 'bg-red-100 text-red-800',
    
    // Share request statuses
    'submitted': 'bg-purple-100 text-purple-800',
    'under_review': 'bg-yellow-100 text-yellow-800',
    'approved': 'bg-green-100 text-green-800',
    'denied': 'bg-red-100 text-red-800',
    
    // Support ticket statuses
    'open': 'bg-blue-100 text-blue-800',
    'in_progress': 'bg-yellow-100 text-yellow-800',
    'resolved': 'bg-green-100 text-green-800',
    'closed': 'bg-gray-100 text-gray-800',
    
    // Commission/Withdrawal statuses
    'unpaid': 'bg-blue-100 text-blue-800',
    'processing': 'bg-blue-100 text-blue-800',
    'completed': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800'
  };
  
  return statusMap[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
};

/**
 * Gets appropriate icon for status display
 * @param status - The status string
 * @returns Icon component name as string
 */
export const getStatusIcon = (status: string): string => {
  const iconMap: Record<string, string> = {
    // Member/Plan statuses
    'active': 'CheckCircle',
    'pending': 'Clock',
    'suspended': 'AlertTriangle',
    'cancelled': 'XCircle',
    'inactive': 'MinusCircle',
    
    // Payment/Billing statuses
    'paid': 'CheckCircle',
    'overdue': 'XCircle',
    'failed': 'XCircle',
    
    // Share request statuses
    'submitted': 'FileText',
    'under_review': 'Clock',
    'approved': 'CheckCircle',
    'denied': 'XCircle',
    
    // Support ticket statuses
    'open': 'MessageCircle',
    'in_progress': 'Clock',
    'resolved': 'CheckCircle',
    'closed': 'XCircle',
    
    // Commission/Withdrawal statuses
    'unpaid': 'DollarSign',
    'processing': 'Clock',
    'completed': 'CheckCircle',
    'rejected': 'XCircle'
  };
  
  return iconMap[status.toLowerCase()] || 'AlertCircle';
};

/**
 * Formats status text for display (capitalizes and replaces underscores)
 * @param status - The status string
 * @returns Formatted status text
 */
export const formatStatusText = (status: string): string => {
  return status
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Gets priority levels for different status types
 * @param status - The status string
 * @returns Priority level (1-5, where 1 is highest priority)
 */
export const getStatusPriority = (status: string): number => {
  const priorityMap: Record<string, number> = {
    // High priority (action required)
    'overdue': 1,
    'failed': 1,
    'urgent': 1,
    'denied': 1,
    
    // Medium priority (attention needed)
    'pending': 2,
    'under_review': 2,
    'processing': 2,
    'in_progress': 2,
    'suspended': 2,
    
    // Normal priority
    'submitted': 3,
    'open': 3,
    'unpaid': 3,
    
    // Low priority (informational)
    'active': 4,
    'approved': 4,
    'paid': 4,
    'completed': 4,
    'resolved': 4,
    
    // Lowest priority (archived/inactive)
    'closed': 5,
    'cancelled': 5,
    'inactive': 5
  };
  
  return priorityMap[status.toLowerCase()] || 3;
};

/**
 * Checks if a status indicates an active/positive state
 * @param status - The status string
 * @returns True if status is positive/active
 */
export const isPositiveStatus = (status: string): boolean => {
  const positiveStatuses = ['active', 'approved', 'paid', 'completed', 'resolved'];
  return positiveStatuses.includes(status.toLowerCase());
};

/**
 * Checks if a status indicates a negative/problem state
 * @param status - The status string
 * @returns True if status indicates a problem
 */
export const isNegativeStatus = (status: string): boolean => {
  const negativeStatuses = ['cancelled', 'denied', 'failed', 'overdue', 'suspended', 'rejected'];
  return negativeStatuses.includes(status.toLowerCase());
};

/**
 * Checks if a status indicates a pending/in-progress state
 * @param status - The status string
 * @returns True if status indicates pending work
 */
export const isPendingStatus = (status: string): boolean => {
  const pendingStatuses = ['pending', 'under_review', 'processing', 'in_progress', 'submitted', 'open'];
  return pendingStatuses.includes(status.toLowerCase());
};