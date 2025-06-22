import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.error('Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file');
  process.exit(1);
}

// Create Supabase admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRlsPolicies() {
  try {
    console.log('Starting RLS policy fixes...');

    // 1. Add affiliate policy to users table
    console.log('Adding affiliate policy to users table...');
    
    // First check if the policy already exists
    const { data: existingPolicies } = await supabase.rpc('get_policies', {
      table_name: 'users'
    });
    
    const hasAffiliatePolicy = existingPolicies?.some(p => 
      p.policyname.toLowerCase().includes('affiliate') && 
      p.tablename === 'users'
    );
    
    if (!hasAffiliatePolicy) {
      // Create SQL to add the policy
      const { error: policyError } = await supabase.rpc('execute_sql', {
        sql: `
          CREATE POLICY "Affiliates can view own profile"
            ON public.users
            FOR SELECT
            TO authenticated
            USING (id = auth.uid() AND (
              EXISTS (
                SELECT 1 FROM public.roles
                WHERE id = auth.uid() AND role = 'affiliate'
              ) OR
              EXISTS (
                SELECT 1 FROM public.roles
                WHERE id = auth.uid() AND role = 'agent'
              )
            ));
        `
      });
      
      if (policyError) {
        console.error('Error creating affiliate policy:', policyError);
      } else {
        console.log('Affiliate policy created successfully');
      }
    } else {
      console.log('Affiliate policy already exists, skipping');
    }

    // 2. Update roles table to ensure 'agent' is treated as 'affiliate'
    console.log('Checking roles table for agent/affiliate mapping...');
    
    // Check if we need to add a trigger or function to map 'agent' to 'affiliate'
    const { error: functionError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.handle_agent_role()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $$
        BEGIN
          -- If role is 'agent', treat it as 'affiliate' for permissions
          IF NEW.role = 'agent' THEN
            -- Update app_metadata to include both roles
            UPDATE auth.users
            SET raw_app_metadata = 
              CASE 
                WHEN raw_app_metadata IS NULL THEN 
                  jsonb_build_object('role', 'agent', 'affiliate_access', true)
                ELSE
                  jsonb_set(
                    jsonb_set(raw_app_metadata, '{role}', to_jsonb('agent')),
                    '{affiliate_access}', 
                    to_jsonb(true)
                  )
              END
            WHERE id = NEW.id;
          END IF;
          
          RETURN NEW;
        END;
        $$;
        
        -- Create or replace the trigger
        DROP TRIGGER IF EXISTS on_agent_role_update ON public.roles;
        CREATE TRIGGER on_agent_role_update
          AFTER INSERT OR UPDATE ON public.roles
          FOR EACH ROW
          WHEN (NEW.role = 'agent')
          EXECUTE FUNCTION public.handle_agent_role();
      `
    });
    
    if (functionError) {
      console.error('Error creating agent role handler:', functionError);
    } else {
      console.log('Agent role handler created successfully');
    }

    // 3. Update existing users with agent role
    console.log('Updating existing agent users...');
    
    const { data: agentUsers, error: agentUsersError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'agent');
      
    if (agentUsersError) {
      console.error('Error fetching agent users:', agentUsersError);
    } else if (agentUsers && agentUsers.length > 0) {
      console.log(`Found ${agentUsers.length} agent users to update`);
      
      for (const user of agentUsers) {
        // Update app_metadata for each agent user
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          user.id,
          {
            app_metadata: {
              role: 'agent',
              affiliate_access: true
            }
          }
        );
        
        if (updateError) {
          console.error(`Error updating user ${user.id}:`, updateError);
        } else {
          console.log(`Updated user ${user.id} successfully`);
        }
      }
    } else {
      console.log('No agent users found to update');
    }

    console.log('RLS policy fixes completed successfully!');
  } catch (error) {
    console.error('Error fixing RLS policies:', error);
  }
}

fixRlsPolicies();