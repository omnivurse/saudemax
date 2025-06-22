import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface MemberMetrics {
  totalMembers: number;
  newSignups: number;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
}

interface MonthlyData {
  month: string;
  signups: number;
  revenue: number;
}

export const GrowthMetricsModule: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'30days' | 'quarter' | 'year'>('30days');
  const [metrics, setMetrics] = useState<MemberMetrics | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, [timeframe]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range based on timeframe
      const now = new Date();
      let startDate: Date;
      
      switch (timeframe) {
        case '30days':
          startDate = subMonths(now, 1);
          break;
        case 'quarter':
          startDate = subMonths(now, 3);
          break;
        case 'year':
          startDate = subMonths(now, 12);
          break;
        default:
          startDate = subMonths(now, 1);
      }

      // Format dates for Supabase query
      const startDateStr = startDate.toISOString();
      const endDateStr = now.toISOString();

      // Fetch total active members
      const { data: activeMembers, error: membersError } = await supabase
        .from('member_profiles')
        .select('id')
        .eq('status', 'active');

      if (membersError) throw membersError;

      // Fetch new signups in the selected timeframe
      const { data: newSignups, error: signupsError } = await supabase
        .from('member_profiles')
        .select('id')
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr);

      if (signupsError) throw signupsError;

      // Fetch total revenue (paid invoices)
      const { data: revenueData, error: revenueError } = await supabase
        .from('billing_records')
        .select('amount')
        .eq('status', 'paid');

      if (revenueError) throw revenueError;

      // Calculate total revenue
      const totalRevenue = revenueData?.reduce((sum, record) => sum + record.amount, 0) || 0;

      // Calculate MRR (sum of monthly_contribution from active members)
      const { data: mrrData, error: mrrError } = await supabase
        .from('member_profiles')
        .select('monthly_contribution')
        .eq('status', 'active');

      if (mrrError) throw mrrError;

      const monthlyRecurringRevenue = mrrData?.reduce((sum, record) => sum + record.monthly_contribution, 0) || 0;

      // Set metrics
      setMetrics({
        totalMembers: activeMembers?.length || 0,
        newSignups: newSignups?.length || 0,
        totalRevenue,
        monthlyRecurringRevenue
      });

      // Fetch monthly data for charts
      await fetchMonthlyData(timeframe);
    } catch (err: any) {
      console.error('Error fetching metrics:', err);
      setError(err.message || 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyData = async (timeframe: string) => {
    try {
      // Determine how many months to fetch based on timeframe
      const monthsToFetch = timeframe === '30days' ? 6 : 
                           timeframe === 'quarter' ? 6 : 12;
      
      const monthlyDataArray: MonthlyData[] = [];
      
      // Generate data for each month
      for (let i = 0; i < monthsToFetch; i++) {
        const currentMonth = subMonths(new Date(), i);
        const monthStart = startOfMonth(currentMonth).toISOString();
        const monthEnd = endOfMonth(currentMonth).toISOString();
        const monthLabel = format(currentMonth, 'MMM yyyy');
        
        // Fetch signups for this month
        const { data: signupsData, error: signupsError } = await supabase
          .from('member_profiles')
          .select('id')
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd);
          
        if (signupsError) throw signupsError;
        
        // Fetch revenue for this month
        const { data: revenueData, error: revenueError } = await supabase
          .from('billing_records')
          .select('amount')
          .eq('status', 'paid')
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd);
          
        if (revenueError) throw revenueError;
        
        const monthRevenue = revenueData?.reduce((sum, record) => sum + record.amount, 0) || 0;
        
        monthlyDataArray.push({
          month: monthLabel,
          signups: signupsData?.length || 0,
          revenue: monthRevenue
        });
      }
      
      // Reverse the array to show oldest to newest
      setMonthlyData(monthlyDataArray.reverse());
    } catch (err: any) {
      console.error('Error fetching monthly data:', err);
      setError(err.message || 'Failed to load chart data');
    }
  };

  const exportData = () => {
    // Create CSV content
    const headers = ['Month', 'Signups', 'Revenue'];
    const csvContent = [
      headers.join(','),
      ...monthlyData.map(data => [
        data.month,
        data.signups,
        data.revenue.toFixed(2)
      ].join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `growth-metrics-${timeframe}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Growth Metrics</h2>
        <div className="flex flex-wrap gap-2">
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
            Quarter
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setTimeframe('year')}
            className={timeframe === 'year' ? 'bg-blue-50 border-blue-200' : ''}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Year
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={exportData}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchMetrics}
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

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    metrics?.totalMembers.toLocaleString() || '0'
                  )}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-700" />
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
                <p className="text-sm font-medium text-gray-600">New Signups</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    metrics?.newSignups.toLocaleString() || '0'
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  {timeframe === '30days' ? 'Last 30 days' : 
                   timeframe === 'quarter' ? 'Last quarter' : 'Last year'}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-700" />
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
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    `$${metrics?.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`
                  )}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="w-6 h-6 text-purple-700" />
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
                <p className="text-sm font-medium text-gray-600">Monthly Recurring Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    `$${metrics?.monthlyRecurringRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`
                  )}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <DollarSign className="w-6 h-6 text-yellow-700" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Growth Line Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Growth</h3>
          {loading ? (
            <div className="h-64 w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            </div>
          ) : monthlyData.length === 0 ? (
            <div className="h-64 w-full bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">No data available for the selected timeframe</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [value, 'Signups']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="signups" 
                    name="New Signups" 
                    stroke="#3B82F6" 
                    activeDot={{ r: 8 }} 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Revenue Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Month</h3>
          {loading ? (
            <div className="h-64 w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            </div>
          ) : monthlyData.length === 0 ? (
            <div className="h-64 w-full bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">No data available for the selected timeframe</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Legend />
                  <Bar 
                    dataKey="revenue" 
                    name="Monthly Revenue" 
                    fill="#8884d8" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Insights Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Growth Insights</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Member Acquisition</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Average of {Math.round((metrics?.newSignups || 0) / (timeframe === '30days' ? 1 : timeframe === 'quarter' ? 3 : 12))} new members per month</li>
                <li>• {metrics?.totalMembers || 0} total active members</li>
                <li>• {((metrics?.newSignups || 0) / (metrics?.totalMembers || 1) * 100).toFixed(1)}% growth rate in selected period</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Revenue Performance</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• ${metrics?.monthlyRecurringRevenue.toFixed(2) || '0.00'} monthly recurring revenue</li>
                <li>• ${(metrics?.totalRevenue || 0).toFixed(2)} total revenue collected</li>
                <li>• ${((metrics?.monthlyRecurringRevenue || 0) * 12).toFixed(2)} projected annual revenue</li>
              </ul>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};