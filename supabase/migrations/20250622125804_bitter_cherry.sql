/*
  # Add deployment status tracking

  1. New System Settings
    - Add deployment_status key to system_settings table for tracking deployment status
  
  2. Initial Values
    - Set initial deployment status to idle
*/

-- Check if system_settings table exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'system_settings') THEN
    CREATE TABLE system_settings (
      key text PRIMARY KEY,
      value text NOT NULL,
      description text,
      updated_at timestamptz DEFAULT now()
    );
    
    -- Enable RLS
    ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
    
    -- Create policy for admin access
    CREATE POLICY "System settings policy"
      ON system_settings
      FOR ALL
      TO authenticated
      USING (has_role('admin'));
  END IF;
END
$$;

-- Insert initial deployment status if it doesn't exist
INSERT INTO system_settings (key, value, description)
VALUES (
  'deployment_status',
  '{"status":"idle","message":"No active deployment","lastUpdated":"' || now()::text || '"}',
  'Current deployment status of the application'
)
ON CONFLICT (key) DO NOTHING;

-- Create function to update deployment status
CREATE OR REPLACE FUNCTION update_deployment_status(
  p_status text,
  p_message text,
  p_deployment_id text DEFAULT NULL,
  p_deploy_url text DEFAULT NULL,
  p_claim_url text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status jsonb;
BEGIN
  -- Create status JSON
  v_status := jsonb_build_object(
    'status', p_status,
    'message', p_message,
    'lastUpdated', now(),
    'deploymentId', p_deployment_id,
    'deployUrl', p_deploy_url,
    'claim_url', p_claim_url
  );
  
  -- Update system_settings
  UPDATE system_settings
  SET 
    value = v_status::text,
    updated_at = now()
  WHERE key = 'deployment_status';
  
  -- Log the deployment status change
  INSERT INTO audit_logs (
    action,
    context,
    created_at
  ) VALUES (
    'deployment_status_changed',
    jsonb_build_object(
      'status', p_status,
      'message', p_message,
      'deployment_id', p_deployment_id
    ),
    now()
  );
  
  RETURN v_status;
END;
$$;

-- Create function to get current deployment status
CREATE OR REPLACE FUNCTION get_deployment_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status jsonb;
BEGIN
  SELECT value::jsonb INTO v_status
  FROM system_settings
  WHERE key = 'deployment_status';
  
  RETURN v_status;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION update_deployment_status TO authenticated;
GRANT EXECUTE ON FUNCTION get_deployment_status TO authenticated;