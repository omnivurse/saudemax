import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  AlertTriangle,
  Settings,
  Play,
  Pause,
  BarChart3,
  Mail
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';

interface AutomationStatus {
  key: string;
  name: string;
  description: string;
  lastRun?: string;
  status: 'active' | 'paused' | 'error';
  icon: React.ElementType;
}

interface SystemSetting {
  key: string;
  value: string;
  description?: string;
  updated_at?: string;
}

export const AffiliateAutomationDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);
  
  const [automationStatus, setAutomationStatus] = useState<AutomationStatus[]>([
    {
      key: 'referral-tracking',
      name: 'Referral Tracking',
      description: 'Tracks affiliate referrals from URL parameters',
      lastRun: 'Real-time',
      status: 'active',
      icon: Users
    },
    {
      key: 'conversion-tracking',
      name: 'Conversion Tracking',
      description: 'Records successful conversions and calculates commissions',
      lastRun: 'Real-time',
      status: 'active',
      icon: DollarSign
    },
    {
      key: 'withdrawal-notifications',
      name: 'Withdrawal Notifications',
      description: 'Sends emails when withdrawal status changes',
      lastRun: 'Real-time',
      status: 'active',
      icon: Mail
    },
    {
      key: 'leaderboard-update',
      name: 'Leaderboard Update',
      description: 'Recalculates leaderboard stats weekly',
      lastRun: 'Loading...',
      status: 'active',
      icon: TrendingUp
    }
  ]);

  // Fetch system settings on component mount
  useEffect(() => {
    const fetchSystemSettings = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('system_settings')
          .select('*');
        
        if (fetchError) throw fetchError;
        
        if (data) {
          setSystemSettings(data);
          
          // Update leaderboard last run time
          const leaderboardSetting = data.find(s => s.key === 'last_leaderboard_update');
          if (leaderboardSetting) {
            setAutomationStatus(prev => 
              prev.map(item => 
                item.key === 'leaderboard-update' 
                  ? { ...item, lastRun: new Date(leaderboardSetting.value).toLocaleDateString() } 
                  : item
              )
            );
          }
        }
      } catch (err: any) {
        console.error('Error fetching system settings:', err);
        setError('Failed to load system settings');
      }
    };
    
    fetchSystemSettings();
  }, []);

  const handleUpdateLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call the edge function to update the leaderboard
      const { data, error: functionError } = await supabase.functions.invoke(
        'affiliate-automation/update-leaderboard',
        {
          body: { force_update: true }
        }
      );
      
      if (functionError) throw functionError;
      
      // Update the last run time
      setAutomationStatus(prev => 
        prev.map(item => 
          item.key === 'leaderboard-update' 
            ? { ...item, lastRun: new Date().toLocaleDateString() } 
            : item
        )
      );
      
      setSuccessMessage(`Leaderboard updated successfully. ${data?.affiliatesUpdated || 0} affiliates processed.`);
      
      // Refresh system settings
      const { data: settingsData } = await supabase
        .from('system_settings')
        .select('*');
      
      if (settingsData) {
        setSystemSettings(settingsData);
      }
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      console.error('Failed to update leaderboard:', err);
      setError(err.message || 'Failed to update leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const toggleAutomationStatus = (key: string) => {
    setAutomationStatus(prev => 
      prev.map(item => 
        item.key === key 
          ? { ...item, status: item.status === 'active' ? 'paused' : 'active' } 
          : item
      )
    );
    
    // In a real implementation, you would update this in the database
    setSuccessMessage(`${key} automation ${automationStatus.find(a => a.key === key)?.status === 'active' ? 'paused' : 'activated'} successfully`);
    
    // Clear success message after 5 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);
  };

  // Only admins can access this dashboard
  if (user?.role !== 'admin') {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <AlertTriangle className="w-10 h-10 text-red-500" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Access Denied</h3>
            <p className="text-gray-600">You don't have permission to access the automation dashboard.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Affiliate Automation Dashboard</h2>
        <Button variant="outline" onClick={handleUpdateLeaderboard} loading={loading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Run Manual Update
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">Error: {error}</span>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Automations</p>
                <p className="text-2xl font-bold text-gray-900">
                  {automationStatus.filter(a => a.status === 'active').length}/{automationStatus.length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <Settings className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Last Leaderboard Update</p>
                <p className="text-2xl font-bold text-gray-900">
                  {systemSettings.find(s => s.key === 'last_leaderboard_update')?.value 
                    ? new Date(systemSettings.find(s => s.key === 'last_leaderboard_update')?.value || '').toLocaleDateString() 
                    : 'Never'}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Version</p>
                <p className="text-2xl font-bold text-gray-900">
                  {systemSettings.find(s => s.key === 'affiliate_system_version')?.value || '1.0.0'}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Automation Status */}
      <div className="grid md:grid-cols-2 gap-6">
        {automationStatus.map((automation, index) => {
          const StatusIcon = automation.status === 'active' ? CheckCircle : 
                            automation.status === 'paused' ? Pause : XCircle;
          const statusColor = automation.status === 'active' ? 'text-green-600' : 
                             automation.status === 'paused' ? 'text-yellow-600' : 'text-red-600';
          
          return (
            <motion.div
              key={automation.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="h-full">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <automation.icon className="w-6 h-6 text-blue-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{automation.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{automation.description}</p>
                      <div className="flex items-center mt-2">
                        <StatusIcon className={`w-4 h-4 ${statusColor} mr-1`} />
                        <span className={`text-sm font-medium ${statusColor} capitalize`}>
                          {automation.status}
                        </span>
                        {automation.lastRun && (
                          <span className="text-xs text-gray-500 ml-3">
                            Last run: {automation.lastRun}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant={automation.status === 'active' ? 'outline' : 'primary'}
                    onClick={() => toggleAutomationStatus(automation.key)}
                  >
                    {automation.status === 'active' ? (
                      <>
                        <Pause className="w-4 h-4 mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-1" />
                        Activate
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Automation Workflow */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Settings className="w-6 h-6 text-blue-700" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Automation Workflow</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-bold text-blue-800">1</span>
                </div>
                <div>
                  <p className="font-medium text-blue-800">Affiliate makes referral</p>
                  <p className="text-sm text-blue-700">n8n creates record in affiliate_referrals</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-bold text-blue-800">2</span>
                </div>
                <div>
                  <p className="font-medium text-blue-800">Referral converts</p>
                  <p className="text-sm text-blue-700">Add commission_earned to affiliate</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-bold text-blue-800">3</span>
                </div>
                <div>
                  <p className="font-medium text-blue-800">New withdrawal request</p>
                  <p className="text-sm text-blue-700">Email sent via send-withdrawal-notification</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-bold text-blue-800">4</span>
                </div>
                <div>
                  <p className="font-medium text-blue-800">Admin pays affiliate</p>
                  <p className="text-sm text-blue-700">Log payout + update affiliate balance</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-bold text-blue-800">5</span>
                </div>
                <div>
                  <p className="font-medium text-blue-800">Every week (cron)</p>
                  <p className="text-sm text-blue-700">Recalculate leaderboard stats in background</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* System Settings */}
      <Card>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">System Settings</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Setting
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {systemSettings.map((setting) => (
                <tr key={setting.key} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {setting.key}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {setting.key === 'last_leaderboard_update' 
                      ? new Date(setting.value).toLocaleDateString() 
                      : setting.value}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {setting.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {setting.updated_at ? new Date(setting.updated_at).toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
              {systemSettings.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No system settings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};