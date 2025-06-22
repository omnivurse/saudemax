/*
  # Audit Logging System

  1. New Table
    - `audit_logs` - Stores timestamped records of user actions for compliance and tracking
    
  2. Security
    - Enable RLS on the table
    - Only admins can access all logs
    - Users can only see their own logs
    
  3. Schema
    - id: uuid (primary key)
    - user_id: uuid (references auth.users)
    - email: text
    - role: text (member, agent, admin)
    - action: text (e.g., "login", "plan_updated", "commission_requested")
    - context: jsonb (additional details about the action)
    - ip_address: text (optional)
    - created_at: timestamp with time zone (default now())
*/

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text,
  role text,
  action text NOT NULL,
  context jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can access all audit logs"
  ON audit_logs
  FOR ALL
  TO authenticated
  USING (has_role('admin'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Create function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_action text,
  p_context jsonb DEFAULT '{}'::jsonb,
  p_ip_address text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_role text;
  v_log_id uuid;
BEGIN
  -- Get current user info
  SELECT id, email INTO v_user_id, v_email FROM auth.users WHERE id = auth.uid();
  
  -- Get user role
  SELECT role INTO v_role FROM public.roles WHERE id = v_user_id;
  
  -- If no role found in roles table, try to get from users table
  IF v_role IS NULL THEN
    SELECT role INTO v_role FROM public.users WHERE id = v_user_id;
  END IF;
  
  -- If still no role, default to 'unknown'
  IF v_role IS NULL THEN
    v_role := 'unknown';
  END IF;
  
  -- Insert audit log
  INSERT INTO audit_logs (
    user_id,
    email,
    role,
    action,
    context,
    ip_address,
    created_at
  ) VALUES (
    v_user_id,
    v_email,
    v_role,
    p_action,
    p_context,
    p_ip_address,
    now()
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Create function to log audit events for a specific user (admin only)
CREATE OR REPLACE FUNCTION log_audit_event_for_user(
  p_user_id uuid,
  p_action text,
  p_context jsonb DEFAULT '{}'::jsonb,
  p_ip_address text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_role text;
  v_log_id uuid;
  v_is_admin boolean;
BEGIN
  -- Check if current user is admin
  SELECT EXISTS(
    SELECT 1 FROM public.roles 
    WHERE id = auth.uid() AND role = 'admin'
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Permission denied: Admin role required';
  END IF;
  
  -- Get user info
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  
  -- Get user role
  SELECT role INTO v_role FROM public.roles WHERE id = p_user_id;
  
  -- If no role found in roles table, try to get from users table
  IF v_role IS NULL THEN
    SELECT role INTO v_role FROM public.users WHERE id = p_user_id;
  END IF;
  
  -- If still no role, default to 'unknown'
  IF v_role IS NULL THEN
    v_role := 'unknown';
  END IF;
  
  -- Insert audit log
  INSERT INTO audit_logs (
    user_id,
    email,
    role,
    action,
    context,
    ip_address,
    created_at
  ) VALUES (
    p_user_id,
    v_email,
    v_role,
    p_action,
    p_context,
    p_ip_address,
    now()
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Create function to log system events (no user)
CREATE OR REPLACE FUNCTION log_system_event(
  p_action text,
  p_context jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
  v_is_admin boolean;
BEGIN
  -- Check if current user is admin
  SELECT EXISTS(
    SELECT 1 FROM public.roles 
    WHERE id = auth.uid() AND role = 'admin'
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Permission denied: Admin role required';
  END IF;
  
  -- Insert audit log
  INSERT INTO audit_logs (
    action,
    context,
    created_at
  ) VALUES (
    p_action,
    p_context,
    now()
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION log_audit_event(text, jsonb, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION log_audit_event_for_user(uuid, text, jsonb, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION log_system_event(text, jsonb) TO authenticated, service_role;

-- Add helpful notice about the audit logging system
DO $$
BEGIN
  RAISE NOTICE '=== AUDIT LOGGING SYSTEM CREATED ===';
  RAISE NOTICE '';
  RAISE NOTICE 'The audit_logs table has been created for tracking:';
  RAISE NOTICE '✅ User actions (login, logout, profile updates)';
  RAISE NOTICE '✅ Business events (plan changes, withdrawals, support actions)';
  RAISE NOTICE '✅ System events (scheduled jobs, data migrations)';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions available:';
  RAISE NOTICE '1. log_audit_event(action, context, ip_address) - Log current user action';
  RAISE NOTICE '2. log_audit_event_for_user(user_id, action, context, ip_address) - Admin only';
  RAISE NOTICE '3. log_system_event(action, context) - Log system events (Admin only)';
  RAISE NOTICE '';
  RAISE NOTICE 'Usage examples:';
  RAISE NOTICE 'SELECT log_audit_event(''login'', ''{}''::jsonb, ''127.0.0.1'');';
  RAISE NOTICE 'SELECT log_audit_event(''plan_updated'', ''{"from": "MO", "to": "MS"}''::jsonb);';
  RAISE NOTICE '';
  RAISE NOTICE 'This table is secured with RLS policies.';
  RAISE NOTICE '================================';
END $$;