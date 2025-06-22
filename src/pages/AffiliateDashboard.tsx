import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Menu, 
  X, 
  LogOut, 
  User, 
  Briefcase, 
  PieChart, 
  DollarSign, 
  Settings,
  Users,
  Calendar,
  TrendingUp,
  AlertTriangle,
  BarChart as BarChartIcon,
  Link as LinkIcon,
  Image
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ReferralMetricsTab } from '../components/affiliate/ReferralMetricsTab';
import { PromoToolsTab } from '../components/affiliate/PromoToolsTab';
import { WithdrawTrackerTab } from '../components/affiliate/WithdrawTrackerTab';
import { useAuth } from '../components/auth/AuthProvider';
import { useAffiliate } from '../hooks/useAffiliate';

export const AffiliateDashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'book' | 'pipeline' | 'withdrawals' | 'settings' | 'referrals' | 'promo'>('referrals');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { affiliate, metrics, loading: affiliateLoading } = useAffiliate();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAffiliateRole = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (!user) {
          navigate('/affiliate-login');
          return;
        }
        
        // Check if user has affiliate role
        const { data: userData, error: userDataError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (userDataError) {
          console.error('Error fetching user role:', userDataError);
        }
        
        const isAffiliate = 
          userData?.role === 'affiliate' || 
          user.app_metadata?.role === 'affiliate' || 
          user.user_metadata?.role === 'affiliate';
        
        if (!isAffiliate) {
          setError('Access denied. You do not have affiliate permissions.');
          return;
        }
      } catch (err: any) {
        console.error('Error checking affiliate role:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    checkAffiliateRole();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/affiliate-login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Navigation items
  const navigation = [
    { name: 'Book of Business', key: 'book', icon: Briefcase },
    { name: 'Enrollment Pipeline', key: 'pipeline', icon: Users },
    { name: 'Referral Metrics', key: 'referrals', icon: BarChartIcon },
    { name: 'Promo Tools', key: 'promo', icon: Image },
    { name: 'Withdraw Tracker', key: 'withdrawals', icon: DollarSign },
    { name: 'Affiliate Settings', key: 'settings', icon: Settings }
  ];

  // If there's an error (e.g., not an affiliate), show error message
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate('/affiliate-login')}>Return to Login</Button>
        </Card>
      </div>
    );
  }

  // Loading state
  if (loading || affiliateLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Affiliate Profile */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || affiliate?.full_name || 'Affiliate'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  Affiliate
                </p>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 overflow-y-auto">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                
                return (
                  <li key={item.name}>
                    <button
                      onClick={() => {
                        setActiveTab(item.key as any);
                        setSidebarOpen(false);
                      }}
                      className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:text-red-600 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Affiliate Dashboard</h1>
            <div className="w-5"></div> {/* Spacer for centering */}
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Desktop Header */}
            <div className="hidden lg:block mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name || affiliate?.full_name || 'Affiliate'}</h1>
              <p className="text-gray-600">Here's your affiliate dashboard overview</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                    <p className="text-2xl font-bold text-gray-900">{affiliate?.total_referrals || metrics?.totalReferrals || 0}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Users className="w-6 h-6 text-blue-700" />
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics?.conversionRate?.toFixed(1) || 0}%</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <TrendingUp className="w-6 h-6 text-yellow-700" />
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                    <p className="text-2xl font-bold text-gray-900">${affiliate?.total_earnings?.toFixed(2) || metrics?.totalEarnings?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <DollarSign className="w-6 h-6 text-green-700" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Tab Content */}
            {activeTab === 'book' && (
              <Card className="p-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Book of Business</h2>
                  <p className="text-gray-600">Coming Soon - Your client management dashboard will appear here.</p>
                </div>
              </Card>
            )}

            {activeTab === 'pipeline' && (
              <Card className="p-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Enrollment Pipeline</h2>
                  <p className="text-gray-600">Coming Soon - Track your enrollment pipeline and conversions.</p>
                </div>
              </Card>
            )}

            {activeTab === 'referrals' && (
              <ReferralMetricsTab />
            )}

            {activeTab === 'promo' && (
              <PromoToolsTab />
            )}

            {activeTab === 'withdrawals' && (
              <WithdrawTrackerTab />
            )}

            {activeTab === 'settings' && (
              <Card className="p-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Affiliate Settings</h2>
                  <p className="text-gray-600">Coming Soon - Manage your affiliate profile and preferences.</p>
                </div>
              </Card>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
};