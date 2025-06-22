import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Set' : 'Not set');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Try to fetch system settings
    const { data, error } = await supabase.from('system_settings').select('*').limit(1);
    
    if (error) {
      throw error;
    }
    
    console.log('Connection successful!');
    console.log('Data:', data);
    
    // Try to get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.warn('Error getting user:', userError);
    } else {
      console.log('Current user:', user);
    }
  } catch (err) {
    console.error('Connection failed:', err);
  }
}

testConnection();