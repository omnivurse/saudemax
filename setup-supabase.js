import fs from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Supabase Setup Script');
console.log('=====================');
console.log('This script will help you set up your Supabase connection.');
console.log('You will need your Supabase URL and anon key from your Supabase project dashboard.');
console.log('');

rl.question('Enter your Supabase URL: ', (supabaseUrl) => {
  rl.question('Enter your Supabase anon key: ', (supabaseAnonKey) => {
    rl.question('Enter your Supabase service role key (optional): ', (serviceRoleKey) => {
      const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=${supabaseUrl}
VITE_SUPABASE_ANON_KEY=${supabaseAnonKey}
SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey || 'your_supabase_service_role_key'}

# Authorize.Net Configuration (Frontend)
VITE_AUTH_NET_CLIENT_KEY=your_authorize_net_client_key
VITE_AUTH_NET_API_LOGIN_ID=your_authorize_net_api_login_id

# Optional: For development
VITE_APP_ENV=development
`;

      fs.writeFileSync('.env', envContent);
      console.log('');
      console.log('.env file created successfully!');
      console.log('');
      console.log('Next steps:');
      console.log('1. Run "npm run dev" to start the development server');
      console.log('2. Navigate to http://localhost:5173/test to test the Supabase connection');
      console.log('3. Create a demo user in your Supabase dashboard with the following credentials:');
      console.log('   - Email: agentdemo@saudemax.com');
      console.log('   - Password: DemoAgent123!');
      console.log('   - User metadata: {"role": "agent", "full_name": "Agent Demo"}');
      console.log('');
      console.log('Thank you for using the setup script!');
      
      rl.close();
    });
  });
});