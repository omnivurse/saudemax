import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { checkCreateAffiliateUserFunction, diagnoseCreateAffiliateUserFunction } from '../lib/checkDeploymentStatus';

export const TestPage: React.FC = () => {
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<any | null>(null);
  const [publicUser, setPublicUser] = useState<any | null>(null);
  const [functionStatus, setFunctionStatus] = useState<any | null>(null);
  const [functionDiagnosis, setFunctionDiagnosis] = useState<any | null>(null);
  const [isCheckingFunction, setIsCheckingFunction] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        // Test Supabase connection by making a simple query
        const { data, error } = await supabase.from('system_settings').select('*').limit(1);
        
        if (error) {
          console.error('Supabase connection error:', error);
          setSupabaseStatus('error');
          setErrorMessage(error.message);
          return;
        }
        
        setSupabaseStatus('connected');
        
        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        setAuthUser(user);
        
        // If user is authenticated, get their profile from public.users
        if (user) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (userError) {
            console.error('Error fetching user data:', userError);
          } else {
            setPublicUser(userData);
          }
        }
      } catch (err: any) {
        console.error('Error checking Supabase connection:', err);
        setSupabaseStatus('error');
        setErrorMessage(err.message);
      }
    };
    
    checkSupabaseConnection();
  }, []);

  const handleTestLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'agentdemo@saudemax.com',
        password: 'DemoAgent123!'
      });
      
      if (error) {
        throw error;
      }
      
      setAuthUser(data.user);
      
      // Get user profile
      if (data.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (userError) {
          console.error('Error fetching user data:', userError);
        } else {
          setPublicUser(userData);
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setAuthUser(null);
      setPublicUser(null);
    } catch (err: any) {
      console.error('Logout error:', err);
      setErrorMessage(err.message);
    }
  };

  const handleCheckFunction = async () => {
    setIsCheckingFunction(true);
    try {
      const status = await checkCreateAffiliateUserFunction();
      setFunctionStatus(status);
    } catch (error) {
      console.error('Error checking function:', error);
      setErrorMessage(error.message);
    } finally {
      setIsCheckingFunction(false);
    }
  };

  const handleDiagnoseFunction = async () => {
    setIsDiagnosing(true);
    try {
      const diagnosis = await diagnoseCreateAffiliateUserFunction();
      setFunctionDiagnosis(diagnosis);
    } catch (error) {
      console.error('Error diagnosing function:', error);
      setErrorMessage(error.message);
    } finally {
      setIsDiagnosing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Supabase Connection Test</h1>
        
        {/* Supabase Status */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Supabase Connection</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              supabaseStatus === 'connected' ? 'bg-green-500' : 
              supabaseStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
            }`}></div>
            <span className="font-medium">
              {supabaseStatus === 'connected' ? 'Connected' : 
               supabaseStatus === 'error' ? 'Error' : 'Checking...'}
            </span>
          </div>
          
          {errorMessage && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{errorMessage}</p>
            </div>
          )}
          
          <div className="mt-4">
            <p className="text-gray-600">
              <strong>Supabase URL:</strong> {supabase.supabaseUrl || 'Not set'}
            </p>
            <p className="text-gray-600">
              <strong>Anon Key:</strong> {supabase.supabaseKey ? '✓ Set' : '✗ Not set'}
            </p>
          </div>
        </Card>
        
        {/* Edge Function Status */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Edge Function Status</h2>
          
          <div className="flex space-x-4 mb-4">
            <Button 
              onClick={handleCheckFunction}
              loading={isCheckingFunction}
              disabled={isCheckingFunction}
            >
              Check Function Status
            </Button>
            
            <Button 
              onClick={handleDiagnoseFunction}
              loading={isDiagnosing}
              disabled={isDiagnosing}
              variant="outline"
            >
              Diagnose Function Issues
            </Button>
          </div>
          
          {functionStatus && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Function Status</h3>
              <div className="space-y-2">
                <p><strong>Deployed:</strong> {functionStatus.deployed === null ? 'Unknown' : functionStatus.deployed ? 'Yes' : 'No'}</p>
                <p><strong>Accessible:</strong> {functionStatus.accessible ? 'Yes' : 'No'}</p>
                <p><strong>Status:</strong> {functionStatus.status}</p>
                <p><strong>Message:</strong> {functionStatus.message}</p>
              </div>
            </div>
          )}
          
          {functionDiagnosis && (
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h3 className="font-medium text-purple-900 mb-2">Function Diagnosis</h3>
              <div className="space-y-2">
                <p><strong>Diagnosis:</strong> {functionDiagnosis.diagnosis}</p>
                
                {functionDiagnosis.possibleIssues && (
                  <div>
                    <p className="font-medium">Possible Issues:</p>
                    <ul className="list-disc pl-5">
                      {functionDiagnosis.possibleIssues.map((issue: string, index: number) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {functionDiagnosis.recommendations && (
                  <div>
                    <p className="font-medium">Recommendations:</p>
                    <ul className="list-disc pl-5">
                      {functionDiagnosis.recommendations.map((rec: string, index: number) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="mt-4">
            <p className="text-gray-600">
              <strong>Function URL:</strong> {supabase.supabaseUrl ? `${supabase.supabaseUrl}/functions/v1/create-affiliate-user` : 'Not available'}
            </p>
          </div>
        </Card>
        
        {/* Authentication Status */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Authentication Status</h2>
          
          {authUser ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700">Authenticated as: {authUser.email}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-gray-600"><strong>User ID:</strong> {authUser.id}</p>
                <p className="text-gray-600"><strong>Email:</strong> {authUser.email}</p>
                <p className="text-gray-600"><strong>Created:</strong> {new Date(authUser.created_at).toLocaleString()}</p>
                <p className="text-gray-600"><strong>Last Sign In:</strong> {authUser.last_sign_in_at ? new Date(authUser.last_sign_in_at).toLocaleString() : 'Never'}</p>
                
                <div className="mt-2">
                  <p className="font-medium text-gray-700">User Metadata:</p>
                  <pre className="mt-1 p-2 bg-gray-100 rounded-lg overflow-x-auto text-xs">
                    {JSON.stringify(authUser.user_metadata, null, 2)}
                  </pre>
                </div>
                
                <div className="mt-2">
                  <p className="font-medium text-gray-700">App Metadata:</p>
                  <pre className="mt-1 p-2 bg-gray-100 rounded-lg overflow-x-auto text-xs">
                    {JSON.stringify(authUser.app_metadata, null, 2)}
                  </pre>
                </div>
              </div>
              
              <Button onClick={handleLogout}>Sign Out</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-700">Not authenticated</p>
              </div>
              
              <Button onClick={handleTestLogin}>Test Login (agentdemo@saudemax.com)</Button>
            </div>
          )}
        </Card>
        
        {/* User Profile */}
        {publicUser && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">User Profile</h2>
            
            <div className="space-y-2">
              <p className="text-gray-600"><strong>Full Name:</strong> {publicUser.full_name}</p>
              <p className="text-gray-600"><strong>Role:</strong> {publicUser.role}</p>
              <p className="text-gray-600"><strong>Active:</strong> {publicUser.is_active ? 'Yes' : 'No'}</p>
              <p className="text-gray-600"><strong>Created:</strong> {new Date(publicUser.created_at).toLocaleString()}</p>
              
              <div className="mt-2">
                <p className="font-medium text-gray-700">Full Profile:</p>
                <pre className="mt-1 p-2 bg-gray-100 rounded-lg overflow-x-auto text-xs">
                  {JSON.stringify(publicUser, null, 2)}
                </pre>
              </div>
            </div>
          </Card>
        )}
        
        {/* Affiliate Profile */}
        {authUser && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Affiliate Profile</h2>
            
            <div className="space-y-4">
              <Button onClick={async () => {
                try {
                  const { data, error } = await supabase
                    .from('affiliates')
                    .select('*')
                    .eq('user_id', authUser.id)
                    .single();
                    
                  if (error) {
                    throw error;
                  }
                  
                  // Display the result
                  const resultElement = document.getElementById('affiliate-result');
                  if (resultElement) {
                    resultElement.textContent = JSON.stringify(data, null, 2);
                  }
                } catch (err: any) {
                  console.error('Error fetching affiliate profile:', err);
                  const resultElement = document.getElementById('affiliate-result');
                  if (resultElement) {
                    resultElement.textContent = `Error: ${err.message}`;
                  }
                }
              }}>
                Fetch Affiliate Profile
              </Button>
              
              <pre id="affiliate-result" className="mt-1 p-2 bg-gray-100 rounded-lg overflow-x-auto text-xs min-h-[100px]">
                Click the button above to fetch affiliate profile
              </pre>
            </div>
          </Card>
        )}

        {/* Roles Table Status */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Roles Table Status</h2>
          
          <div className="space-y-4">
            <Button onClick={async () => {
              try {
                const { data, error } = await supabase
                  .from('roles')
                  .select('*')
                  .limit(10);
                  
                if (error) {
                  throw error;
                }
                
                // Display the result
                const resultElement = document.getElementById('roles-result');
                if (resultElement) {
                  resultElement.textContent = JSON.stringify(data, null, 2);
                }
              } catch (err: any) {
                console.error('Error fetching roles:', err);
                const resultElement = document.getElementById('roles-result');
                if (resultElement) {
                  resultElement.textContent = `Error: ${err.message}`;
                }
              }
            }}>
              Check Roles Table
            </Button>
            
            <pre id="roles-result" className="mt-1 p-2 bg-gray-100 rounded-lg overflow-x-auto text-xs min-h-[100px]">
              Click the button above to check the roles table
            </pre>
          </div>
        </Card>
      </div>
    </div>
  );
};