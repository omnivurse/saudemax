import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../components/auth/AuthProvider';
import { Button } from '../components/ui/Button';
import { testSupabaseConnection } from '../lib/supabase';

interface LoginPageProps {
  isAffiliateLogin?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ isAffiliateLogin = false }) => {
  const [email, setEmail] = useState(isAffiliateLogin ? 'agentdemo@saudemax.com' : '');
  const [password, setPassword] = useState(isAffiliateLogin ? 'DemoAgent123!' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const connected = await testSupabaseConnection();
        setConnectionStatus(connected ? 'connected' : 'disconnected');
      } catch (error) {
        console.error('Connection test error:', error);
        setConnectionStatus('disconnected');
      }
    };
    checkConnection();
  }, []);

  useEffect(() => {
    if (user) {
      const role = user?.role || user?.user_metadata?.role;
      
      const redirectPath =
        role === 'admin' ? '/admin' :
        role === 'affiliate' ? '/affiliate' :
        role === 'advisor' ? '/advisor' :
        role === 'member' ? '/member/dashboard' :
        '/member/dashboard'; // Default fallback

      console.log('Redirecting user with role:', role, 'to path:', redirectPath);
      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (connectionStatus === 'disconnected') {
        const connected = await testSupabaseConnection();
        if (!connected) {
          throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
        }
        setConnectionStatus('connected');
      }

      await login(email, password);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
      if (err.message?.includes('Failed to fetch') || err.message?.includes('connect')) {
        setConnectionStatus('disconnected');
      }
    } finally {
      setLoading(false);
    }
  };

  if (user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm mx-auto"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src="/SAUDEMAX_logo1 (1) copy.png" 
              alt="SAUDEMAX" 
              className="h-8 w-auto mx-auto mb-2"
            />
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              {isAffiliateLogin ? 'Affiliate Login' : 'Log in'}
            </h2>

            {/* Connection Status */}
            {connectionStatus !== 'connected' && (
              <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
                connectionStatus === 'checking' 
                  ? 'bg-yellow-50 border border-yellow-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                {connectionStatus === 'checking' ? (
                  <Wifi className="w-5 h-5 text-yellow-600 animate-pulse" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-600" />
                )}
                <span className={`text-sm ${
                  connectionStatus === 'checking' ? 'text-yellow-700' : 'text-red-700'
                }`}>
                  {connectionStatus === 'checking' 
                    ? 'Checking connection...' 
                    : 'Connection failed. Please check your internet connection.'}
                </span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2"
              >
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-700 text-sm">{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                loading={loading}
                disabled={!email || !password || loading || connectionStatus === 'disconnected'}
              >
                {loading ? 'Logging in...' : 'Log in'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            {/* Demo Credentials */}
            {isAffiliateLogin && (
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Demo Credentials:</h4>
                <div className="text-xs text-blue-800 space-y-1">
                  <div>Email: agentdemo@saudemax.com</div>
                  <div>Password: DemoAgent123!</div>
                </div>
              </div>
            )}
            
            {!isAffiliateLogin && (
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Demo Credentials:</h4>
                <div className="text-xs text-blue-800 space-y-1">
                  <div>Member: member@saudemax.com / password123</div>
                  <div>Admin: admin@saudemax.com / password123</div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Right Side - Member Portal Preview */}
      <div className="hidden lg:flex flex-1 bg-white items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Member Portal Preview */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Welcome, John Doe</h2>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <img 
                  src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop&crop=face" 
                  alt="Profile" 
                  className="w-14 h-14 rounded-full object-cover"
                />
              </div>
            </div>

            {/* Plan and Claims Grid */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Plan</h3>
                <p className="text-blue-600 font-medium">Basic Plan</p>
                <p className="text-sm text-gray-600">Status - Active</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Claims</h3>
                <p className="text-gray-900 font-medium">2 pending</p>
              </div>
            </div>

            {/* Documents and Support */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Documents</h3>
                <p className="text-sm text-gray-600">ID card, guidelines</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Support</h3>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;