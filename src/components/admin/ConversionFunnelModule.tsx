import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  MousePointer, 
  UserPlus, 
  CheckCircle,
  Calendar,
  Download,
  RefreshCw,
  AlertTriangle,
  Filter,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { format, subDays, subMonths } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface FunnelMetrics {
  totalClicks: number;
  totalLeads: number;
  totalSignups: number;
  activeMembers: number;
}

interface ConversionRates {
  clickToLead: number;
  leadToSignup: number;
  signupToActive: number;
  overallConversion: number;
}

export const ConversionFunnelModule: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'7days' | '30days' | 'quarter'>('30days');
  const [metrics, setMetrics] = useState<FunnelMetrics | null>(null);
  const [conversionRates, setConversionRates] = useState<ConversionRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFunnelData();
  }, [timeframe]);

  const fetchFunnelData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range based on timeframe
      const now = new Date();
      let startDate: Date;
      
      switch (timeframe) {
        case '7days':
          startDate = subDays(now, 7);
          break;
        case '30days':
          startDate = subDays(now, 30);
          break;
        case 'quarter':
          startDate = subMonths(now, 3);
          break;
        default:
          startDate = subDays(now, 30);
      }

      // Format dates for Supabase query
      const startDateStr = startDate.toISOString();
      const endDateStr = now.toISOString();

      // Fetch total clicks
      const { data: clicksData, error: clicksError } = await supabase
        .from('affiliate_visits')
        .select('id')
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr);

      if (clicksError) throw clicksError;

      // Fetch total leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('affiliate_visits')
        .select('id')
        .eq('converted', true)
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr);

      if (leadsError) throw leadsError;

      // Fetch total signups (new member profiles)
      const { data: signupsData, error: signupsError } = await supabase
        .from('member_profiles')
        .select('id')
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr);

      if (signupsError) throw signupsError;

      // Fetch active members from those who signed up in the period
      const { data: activeMembers, error: activeMembersError } = await supabase
        .from('member_profiles')
        .select('id')
        .eq('status', 'active')
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr);

      if (activeMembersError) throw activeMembersError;

      // Set metrics
      const totalClicks = clicksData?.length || 0;
      const totalLeads = leadsData?.length || 0;
      const totalSignups = signupsData?.length || 0;
      const activeCount = activeMembers?.length || 0;

      setMetrics({
        totalClicks,
        totalLeads,
        totalSignups,
        activeMembers: activeCount
      });

      // Calculate conversion rates
      const clickToLead = totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0;
      const leadToSignup = totalLeads > 0 ? (totalSignups / totalLeads) * 100 : 0;
      const signupToActive = totalSignups > 0 ? (activeCount / totalSignups) * 100 : 0;
      const overallConversion = totalClicks > 0 ? (activeCount / totalClicks) * 100 : 0;

      setConversionRates({
        clickToLead,
        leadToSignup,
        signupToActive,
        overallConversion
      });

    } catch (err: any) {
      console.error('Error fetching funnel data:', err);
      setError(err.message || 'Failed to load funnel data');
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!metrics || !conversionRates) return;

    // Create CSV content
    const headers = ['Metric', 'Value', 'Conversion Rate'];
    const csvContent = [
      headers.join(','),
      ['Total Clicks', metrics.totalClicks, ''].join(','),
      ['Leads Collected', metrics.totalLeads, `${conversionRates.clickToLead.toFixed(2)}%`].join(','),
      ['Members Enrolled', metrics.totalSignups, `${conversionRates.leadToSignup.toFixed(2)}%`].join(','),
      ['Active Members', metrics.activeMembers, `${conversionRates.signupToActive.toFixed(2)}%`].join(','),
      ['', '', ''].join(','),
      ['Overall Conversion', '', `${conversionRates.overallConversion.toFixed(2)}%`].join(',')
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversion-funnel-${timeframe}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const getConversionRateColor = (rate: number) => {
    if (rate >= 20) return 'bg-green-100 text-green-800';
    if (rate >= 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Prepare data for the funnel chart
  const getFunnelData = () => {
    if (!metrics) return [];
    
    return [
      {
        name: 'Funnel Stages',
        Clicks: metrics.totalClicks,
        Leads: metrics.totalLeads,
        Signups: metrics.totalSignups,
        Active: metrics.activeMembers
      }
    ];
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Conversion Funnel</h2>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setTimeframe('7days')}
            className={timeframe === '7days' ? 'bg-blue-50 border-blue-200' : ''}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Last 7 Days
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setTimeframe('30days')}
            className={timeframe === '30days' ? 'bg-blue-50 border-blue-200' : ''}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Last 30 Days
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setTimeframe('quarter')}
            className={timeframe === 'quarter' ? 'bg-blue-50 border-blue-200' : ''}
          >
            <Calendar className="w-4 h-4 mr-2" />
            This Quarter
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={exportData}
            disabled={!metrics}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchFunnelData}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Funnel Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Clicks</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    metrics?.totalClicks.toLocaleString() || '0'
                  )}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <MousePointer className="w-6 h-6 text-blue-700" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Leads Collected</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    metrics?.totalLeads.toLocaleString() || '0'
                  )}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <UserPlus className="w-6 h-6 text-yellow-700" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Members Enrolled</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    metrics?.totalSignups.toLocaleString() || '0'
                  )}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="w-6 h-6 text-purple-700" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Members</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    metrics?.activeMembers.toLocaleString() || '0'
                  )}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-700" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Funnel Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Conversion Funnel</h3>
          {loading ? (
            <div className="h-64 w-full bg-gray-100 animate-pulse rounded-lg"></div>
          ) : !metrics ? (
            <div className="h-64 w-full bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">No data available for the selected timeframe</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Funnel Chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getFunnelData()}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" hide />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Clicks" fill="#3B82F6" name="Clicks" />
                    <Bar dataKey="Leads" fill="#F59E0B" name="Leads" />
                    <Bar dataKey="Signups" fill="#8B5CF6" name="Signups" />
                    <Bar dataKey="Active" fill="#10B981" name="Active Members" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Funnel Steps */}
              <div className="flex justify-between items-center">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <MousePointer className="w-8 h-8 text-blue-700" />
                  </div>
                  <p className="mt-2 font-medium text-gray-900">Clicks</p>
                  <p className="text-xl font-bold text-blue-700">{metrics.totalClicks.toLocaleString()}</p>
                </div>
                
                <div className="flex-1 h-1 bg-gray-200 relative mx-2">
                  <div 
                    className="absolute inset-0 bg-blue-500"
                    style={{ width: `${conversionRates?.clickToLead || 0}%` }}
                  ></div>
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-500">
                    {conversionRates?.clickToLead.toFixed(1)}%
                  </div>
                  <ArrowRight className="absolute -right-4 -top-2 text-gray-400" />
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                    <UserPlus className="w-8 h-8 text-yellow-700" />
                  </div>
                  <p className="mt-2 font-medium text-gray-900">Leads</p>
                  <p className="text-xl font-bold text-yellow-700">{metrics.totalLeads.toLocaleString()}</p>
                </div>
                
                <div className="flex-1 h-1 bg-gray-200 relative mx-2">
                  <div 
                    className="absolute inset-0 bg-yellow-500"
                    style={{ width: `${conversionRates?.leadToSignup || 0}%` }}
                  ></div>
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-500">
                    {conversionRates?.leadToSignup.toFixed(1)}%
                  </div>
                  <ArrowRight className="absolute -right-4 -top-2 text-gray-400" />
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                    <Users className="w-8 h-8 text-purple-700" />
                  </div>
                  <p className="mt-2 font-medium text-gray-900">Signups</p>
                  <p className="text-xl font-bold text-purple-700">{metrics.totalSignups.toLocaleString()}</p>
                </div>
                
                <div className="flex-1 h-1 bg-gray-200 relative mx-2">
                  <div 
                    className="absolute inset-0 bg-purple-500"
                    style={{ width: `${conversionRates?.signupToActive || 0}%` }}
                  ></div>
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-500">
                    {conversionRates?.signupToActive.toFixed(1)}%
                  </div>
                  <ArrowRight className="absolute -right-4 -top-2 text-gray-400" />
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-700" />
                  </div>
                  <p className="mt-2 font-medium text-gray-900">Active</p>
                  <p className="text-xl font-bold text-green-700">{metrics.activeMembers.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Conversion Rates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Rates</h3>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : !conversionRates ? (
            <div className="h-32 w-full bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">No data available for the selected timeframe</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">Click → Lead</p>
                    <p className="text-sm text-gray-600">Visitors who become leads</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConversionRateColor(conversionRates.clickToLead)}`}>
                    {conversionRates.clickToLead.toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">Lead → Signup</p>
                    <p className="text-sm text-gray-600">Leads who complete enrollment</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConversionRateColor(conversionRates.leadToSignup)}`}>
                    {conversionRates.leadToSignup.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">Signup → Active</p>
                    <p className="text-sm text-gray-600">Signups who become active members</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConversionRateColor(conversionRates.signupToActive)}`}>
                    {conversionRates.signupToActive.toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">Overall Conversion</p>
                    <p className="text-sm text-gray-600">Clicks to active members</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConversionRateColor(conversionRates.overallConversion)}`}>
                    {conversionRates.overallConversion.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Optimization Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Optimization Opportunities</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Lead Generation</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Optimize landing pages for higher click-to-lead conversion</li>
                <li>• Test different call-to-action messaging</li>
                <li>• Implement exit-intent popups to capture more leads</li>
                <li>• Enhance mobile responsiveness for better conversion</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Enrollment Completion</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Simplify the enrollment process to reduce abandonment</li>
                <li>• Implement follow-up emails for incomplete enrollments</li>
                <li>• Offer incentives for completing enrollment</li>
                <li>• Provide clear value proposition throughout the funnel</li>
              </ul>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};