import { supabase } from './supabase';

/**
 * Logs an audit event for the current user
 * 
 * @param action - The action being performed (e.g., 'login', 'plan_updated', 'withdrawal_requested')
 * @param context - Additional context about the action (optional)
 * @param ipAddress - The IP address of the user (optional)
 * @returns Promise with the result of the operation
 */
export async function logAuditEvent(
  action: string,
  context: Record<string, any> = {},
  ipAddress?: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session for audit log:', sessionError);
      return { success: false, error: sessionError.message };
    }

    // If no session exists, skip audit logging for now
    // This prevents errors during login attempts
    if (!session?.user) {
      console.log('No active session - skipping audit log for action:', action);
      return { success: true };
    }

    // Get user details
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, role')
      .eq('id', session.user.id)
      .single();

    if (userError) {
      console.error('Error getting user data for audit log:', userError);
    }

    // Insert audit log entry
    const { data, error: insertError } = await supabase
      .from('audit_logs')
      .insert({
        user_id: session.user.id,
        email: userData?.email || session.user.email,
        role: userData?.role || session.user.user_metadata?.role || 'unknown',
        action,
        context,
        ip_address: ipAddress || 'unknown'
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error inserting audit log:', insertError);
      return { success: false, error: insertError.message };
    }

    return { success: true, id: data?.id };
  } catch (error: any) {
    console.error('Error in logAuditEvent:', error);
    // Don't throw the error to prevent breaking the main flow
    return { success: false, error: error.message };
  }
}