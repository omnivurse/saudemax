import { supabase } from './supabase';
import { logAuditEvent } from './logAuditEvent';

// Key for storing impersonation data in localStorage
const IMPERSONATION_STORAGE_KEY = 'saudemax_impersonation';

/**
 * Interface for impersonation session data
 */
export interface ImpersonationSession {
  sessionId: string;
  adminId: string;
  targetUserId: string;
  targetRole: string;
  targetEmail: string;
  targetName: string;
  startedAt: string;
}

/**
 * Start impersonating a user
 * 
 * @param targetUserId - The ID of the user to impersonate
 * @param targetEmail - The email of the user to impersonate
 * @param targetName - The name of the user to impersonate
 * @returns Promise with the result of the operation
 */
export async function startImpersonation(
  targetUserId: string,
  targetEmail: string,
  targetName: string
): Promise<{ success: boolean; error?: string; sessionId?: string }> {
  try {
    // Get current user to ensure we're an admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting current user:', userError);
      return { success: false, error: userError.message };
    }
    
    if (!user) {
      return { success: false, error: 'No authenticated user' };
    }

    // Check if current user is admin
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (userDataError) {
      console.error('Error checking user role:', userDataError);
      return { success: false, error: userDataError.message };
    }
    
    const isAdmin = userData.role === 'admin';
    
    if (!isAdmin) {
      return { success: false, error: 'Permission denied: Admin role required' };
    }

    // Generate a session ID
    const sessionId = crypto.randomUUID();

    // Get target user role
    const { data: targetUserData, error: targetUserError } = await supabase
      .from('users')
      .select('role')
      .eq('id', targetUserId)
      .single();

    if (targetUserError) {
      console.error('Error getting target user role:', targetUserError);
      return { success: false, error: targetUserError.message };
    }

    // Store impersonation data in localStorage
    const impersonationData: ImpersonationSession = {
      sessionId,
      adminId: user.id,
      targetUserId,
      targetRole: targetUserData.role,
      targetEmail,
      targetName,
      startedAt: new Date().toISOString()
    };
    
    localStorage.setItem(IMPERSONATION_STORAGE_KEY, JSON.stringify(impersonationData));

    // Log the impersonation start
    await logAuditEvent('impersonation_started', {
      target_user_id: targetUserId,
      target_email: targetEmail,
      target_name: targetName,
      session_id: sessionId
    });

    return { success: true, sessionId };
  } catch (err: any) {
    console.error('Unexpected error starting impersonation:', err);
    return { success: false, error: err.message };
  }
}

/**
 * End the current impersonation session
 * 
 * @returns Promise with the result of the operation
 */
export async function endImpersonation(): Promise<{ success: boolean; error?: string }> {
  try {
    // Get impersonation data from localStorage
    const impersonationDataStr = localStorage.getItem(IMPERSONATION_STORAGE_KEY);
    
    if (!impersonationDataStr) {
      return { success: false, error: 'No active impersonation session' };
    }
    
    const impersonationData: ImpersonationSession = JSON.parse(impersonationDataStr);

    // Log the impersonation end
    await logAuditEvent('impersonation_ended', {
      target_user_id: impersonationData.targetUserId,
      target_email: impersonationData.targetEmail,
      target_name: impersonationData.targetName,
      session_id: impersonationData.sessionId,
      duration_seconds: Math.floor((Date.now() - new Date(impersonationData.startedAt).getTime()) / 1000)
    });

    // Remove impersonation data from localStorage
    localStorage.removeItem(IMPERSONATION_STORAGE_KEY);

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error ending impersonation:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get the current impersonation session
 * 
 * @returns The current impersonation session or null if not impersonating
 */
export function getCurrentImpersonation(): ImpersonationSession | null {
  try {
    const impersonationDataStr = localStorage.getItem(IMPERSONATION_STORAGE_KEY);
    
    if (!impersonationDataStr) {
      return null;
    }
    
    return JSON.parse(impersonationDataStr);
  } catch (err) {
    console.error('Error getting current impersonation:', err);
    return null;
  }
}

/**
 * Check if the current user is impersonating another user
 * 
 * @returns True if impersonating, false otherwise
 */
export function isImpersonating(): boolean {
  return getCurrentImpersonation() !== null;
}