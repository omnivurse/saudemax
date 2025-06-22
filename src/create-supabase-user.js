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

async function createUser() {
  try {
    // 1. Create user in auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'agentdemo@saudemax.com',
      password: 'DemoAgent123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Agent Demo',
        role: 'agent'
      },
      app_metadata: {
        role: 'agent'
      }
    });

    if (userError) {
      throw userError;
    }

    console.log('User created successfully in auth.users:', userData.user);

    // 2. Create user in public.users
    const { data: publicUserData, error: publicUserError } = await supabase
      .from('users')
      .insert({
        id: userData.user.id,
        email: userData.user.email,
        full_name: 'Agent Demo',
        role: 'agent',
        is_active: true
      })
      .select()
      .single();

    if (publicUserError) {
      console.error('Error creating user in public.users:', publicUserError);
    } else {
      console.log('User created successfully in public.users:', publicUserData);
    }

    // 3. Create role in public.roles
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .insert({
        id: userData.user.id,
        role: 'agent'
      })
      .select()
      .single();

    if (roleError) {
      console.error('Error creating role in public.roles:', roleError);
    } else {
      console.log('Role created successfully in public.roles:', roleData);
    }

    // 4. Create affiliate profile
    const { data: affiliateData, error: affiliateError } = await supabase
      .from('affiliates')
      .insert({
        user_id: userData.user.id,
        affiliate_code: 'DEMO-AGENT',
        referral_link: 'https://saudemax.com?ref=DEMO-AGENT',
        email: userData.user.email,
        status: 'active',
        commission_rate: 15.00,
        total_earnings: 0,
        total_referrals: 0,
        total_visits: 0,
        payout_email: userData.user.email,
        payout_method: 'paypal'
      })
      .select()
      .single();

    if (affiliateError) {
      console.error('Error creating affiliate profile:', affiliateError);
    } else {
      console.log('Affiliate profile created successfully:', affiliateData);
    }

    console.log('\nUser creation complete!');
    console.log('\nLogin credentials:');
    console.log('Email: agentdemo@saudemax.com');
    console.log('Password: DemoAgent123!');

  } catch (error) {
    console.error('Error creating user:', error);
  }
}

createUser();