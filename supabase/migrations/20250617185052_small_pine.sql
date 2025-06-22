/*
  # Add Deployment Status to System Settings

  1. New Settings
    - `deployment_status` - Stores the current deployment status of the project
    
  2. Security
    - Only admins can access the settings via existing RLS policy
*/

-- Insert deployment status setting if it doesn't exist
INSERT INTO system_settings (key, value, description)
VALUES 
  ('deployment_status', '{"status":"idle","message":"No active deployment","lastUpdated":"2025-06-17T15:00:00Z"}', 'Current deployment status of the project')
ON CONFLICT (key) DO NOTHING;