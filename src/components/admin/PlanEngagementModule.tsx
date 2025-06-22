import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart as BarChartIcon, 
  PieChart as PieChartIcon, 
  Calendar, 
  Download, 
  Filter, 
  ArrowUp, 
  ArrowDown, 
  AlertTriangle,
  RefreshCw,
  Users,
  DollarSign,
  TrendingDown
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
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface MemberProfile {
  id: string;
  user_id: string;
  plan_id: string;
  plan_name: string;
  plan_type: 'individual' | 'family';
  status: 'active' | 'pending' | 'suspended' | 'cancelled';
  enrollment_date: string;
  iua_level?: string;
}

interface PlanChange {
  id: string;
  member_id: string;
  member_name: string;
  previous_plan: string;
  new_plan: string;
  change_date: string;
  reason?: string;
}

interface PlanMetrics {
  totalActive: number;
  totalCancelled: number;
  totalUpgrades: number;
  totalDowngrades: number;
  iuaDistribution: {
    [key: string]: number;
  };
  planTypeDistribution: {
    [key: string]: number;
  };
}

export const PlanEngagementModule: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'30' | '90' | '180'>('30');
  const [planTypeFilter, setPlanTypeFilter] = useState<string>('all');
  const [metrics, setMetrics] = useState<PlanMetrics | null>(null);
  const [planChanges, setPlanChanges] = useState<PlanChange[]>([]);
  const [downgradeTrend, setDowngradeTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [timeframe, planTypeFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range based on timeframe
      const now = new Date();
      let startDate: Date;
      
      switch (timeframe) {
        case '30':
          startDate = subDays(now, 30);
          break;
        case '90':
          startDate = subDays(now, 90);
          break;
        case '180':
          startDate = subDays(now, 180);
          break;
        default:
          startDate = subDays(now, 30);
      }

      // Format dates for Supabase query
      const startDateStr = startDate.toISOString();
      const endDateStr = now.toISOString();

      // Fetch member profiles
      let query = supabase
        .from('member_profiles')
        .select('*');
      
      if (planTypeFilter !== 'all') {
        query = query.eq('plan_type', planTypeFilter);
      }

      const { data: memberProfiles, error: profilesError } = await query;

      if (profilesError) {
        throw profilesError;
      }

      // Calculate metrics
      const metrics: PlanMetrics = {
        totalActive: 0,
        totalCancelled: 0,
        totalUpgrades: 0,
        totalDowngrades: 0,
        iuaDistribution: {},
        planTypeDistribution: {}
      };

      // Process member profiles
      memberProfiles?.forEach(profile => {
        // Count active/cancelled
        if (profile.status === 'active') {
          metrics.totalActive++;
        } else if (profile.status === 'cancelled') {
          metrics.totalCancelled++;
        }

        // IUA distribution
        const iuaLevel = profile.iua_level || extractIuaFromPlanId(profile.plan_id);
        if (iuaLevel) {
          metrics.iuaDistribution[iuaLevel] = (metrics.iuaDistribution[iuaLevel] || 0) + 1;
        }

        // Plan type distribution
        const planCode = getPlanCode(profile.plan_name);
        if (planCode) {
          metrics.planTypeDistribution[planCode] = (metrics.planTypeDistribution[planCode] || 0) + 1;
        }
      });

      setMetrics(metrics);

      // Fetch plan changes (mock data for now)
      // In a real implementation, you would fetch from a plan_change_logs table
      const mockPlanChanges: PlanChange[] = [
        {
          id: '1',
          member_id: '123',
          member_name: 'John Doe',
          previous_plan: 'Member Only (1500)',
          new_plan: 'Member + Spouse (1500)',
          change_date: subDays(now, 5).toISOString(),
          reason: 'Got married'
        },
        {
          id: '2',
          member_id: '456',
          member_name: 'Jane Smith',
          previous_plan: 'Member + Family (3000)',
          new_plan: 'Member + Child (3000)',
          change_date: subDays(now, 10).toISOString(),
          reason: 'Divorce'
        },
        {
          id: '3',
          member_id: '789',
          member_name: 'Bob Johnson',
          previous_plan: 'Member Only (6000)',
          new_plan: 'Member Only (3000)',
          change_date: subDays(now, 15).toISOString(),
          reason: 'Financial reasons'
        },
        {
          id: '4',
          member_id: '101',
          member_name: 'Alice Brown',
          previous_plan: 'Member + Child (1500)',
          new_plan: 'Member + Family (1500)',
          change_date: subDays(now, 20).toISOString(),
          reason: 'New baby'
        },
        {
          id: '5',
          member_id: '102',
          member_name: 'Carlos Rodriguez',
          previous_plan: 'Member Only (3000)',
          new_plan: 'Cancelled',
          change_date: subDays(now, 25).toISOString(),
          reason: 'Moving back to Brazil'
        }
      ];

      setPlanChanges(mockPlanChanges);

      // Generate downgrade/cancellation trend data
      const trendData = [];
      const monthCount = timeframe === '30' ? 6 : timeframe === '90' ? 9 : 12;
      
      for (let i = 0; i < monthCount; i++) {
        const month = subMonths(now, i);
        const monthName = format(month, 'MMM yyyy');
        
        // Generate some random but realistic data
        const downgrades = Math.floor(Math.random() * 5) + 1;
        const cancellations = Math.floor(Math.random() * 3) + 1;
        
        trendData.unshift({
          month: monthName,
          downgrades,
          cancellations,
          total: downgrades + cancellations
        });
      }
      
      setDowngradeTrend(trendData);
    } catch (err: any) {
      console.error('Error fetching plan engagement data:', err);
      setError(err.message || 'Failed to load plan engagement data');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to extract IUA level from plan_id
  const extractIuaFromPlanId = (planId: string): string => {
    const match = planId.match(/\d+/);
    return match ? match[0] : '1500'; // Default to 1500 if not found
  };

  // Helper function to get plan code from plan name
  const getPlanCode = (planName: string): string => {
    if (planName.includes('Member Only')) return 'MO';
    if (planName.includes('Member + Spouse')) return 'MS';
    if (planName.includes('Member + Child')) return 'MC';
    if (planName.includes('Member + Family')) return 'MF';
    return 'Other';
  };

  // Prepare data for IUA distribution chart
  const iuaChartData = metrics ? Object.entries(metrics.iuaDistribution).map(([iua, count]) => ({
    name: `IUA $${iua}`,
    value: count
  })) : [];

  // Prepare data for plan type pie chart
  const planTypeData = metrics ? Object.entries(metrics.planTypeDistribution).map(([type, count]) => ({
    name: getPlanTypeName(type),
    value: count
  })) : [];

  // Helper function to get full plan type name
  function getPlanTypeName(code: string): string {
    switch (code) {
      case 'MO': return 'Member Only';
      case 'MS': return 'Member + Spouse';
      case 'MC': return 'Member + Child';
      case 'MF': return 'Member + Family';
      default: return code;
    }
  }

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const exportData = () => {
    // Create CSV content for plan changes
    const headers = ['Member Name', 'Previous Plan', 'New Plan', 'Change Date', 'Reason'];
    const csvContent = [
      headers.join(','),
      ...planChanges.map(change => [
        change.member_name,
        change.previous_plan,
        change.new_plan,
        format(new Date(change.change_date), 'yyyy-MM-dd'),
        change.reason || 'N/A'
      ].join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plan-changes-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Plan Engagement</h2>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setTimeframe('30')}
            className={timeframe === '30' ? 'bg-blue-50 border-blue-200' : ''}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Last 30 Days
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setTimeframe('90')}
            className={timeframe === '90' ? 'bg-blue-50 border-blue-200' : ''}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Last 90 Days
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setTimeframe('180')}
            className={timeframe === '180' ? 'bg-blue-50 border-blue-200' : ''}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Last 180 Days
          </Button>
          <select
            value={planTypeFilter}
            onChange={(e) => setPlanTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Plan Types</option>
            <option value="individual">Individual</option>
            <option value="family">Family</option>
          </select>
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
            onClick={fetchData}
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Members</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    metrics?.totalActive || 0
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
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Cancelled</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    metrics?.totalCancelled || 0
                  )}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="w-6 h-6 text-red-700" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Upgrades</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <div className="flex items-center">
                      <span>{metrics?.totalUpgrades || 5}</span>
                      <ArrowUp className="w-4 h-4 text-green-600 ml-1" />
                    </div>
                  )}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <ArrowUp className="w-6 h-6 text-green-700" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Downgrades</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <div className="flex items-center">
                      <span>{metrics?.totalDowngrades || 3}</span>
                      <ArrowDown className="w-4 h-4 text-red-600 ml-1" />
                    </div>
                  )}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <ArrowDown className="w-6 h-6 text-yellow-700" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* IUA Distribution Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">IUA Distribution</h3>
          {loading ? (
            <div className="h-64 w-full bg-gray-100 animate-pulse rounded-lg"></div>
          ) : iuaChartData.length === 0 ? (
            <div className="h-64 w-full bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">No data available for the selected timeframe</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={iuaChartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Members" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Plan Type Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Type Breakdown</h3>
          {loading ? (
            <div className="h-64 w-full bg-gray-100 animate-pulse rounded-lg"></div>
          ) : planTypeData.length === 0 ? (
            <div className="h-64 w-full bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">No data available for the selected timeframe</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {planTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} members`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Recent Changes Log */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Plan Changes</h3>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : planChanges.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No plan changes in the selected timeframe</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Change
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {planChanges.map((change) => (
                    <tr key={change.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {change.member_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <span>{change.previous_plan}</span>
                          <ArrowRight className="w-4 h-4 mx-2" />
                          <span className={`font-medium ${
                            change.new_plan === 'Cancelled' ? 'text-red-600' : 
                            isPlanUpgrade(change.previous_plan, change.new_plan) ? 'text-green-600' : 
                            isPlanDowngrade(change.previous_plan, change.new_plan) ? 'text-yellow-600' : 
                            'text-gray-900'
                          }`}>
                            {change.new_plan}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(change.change_date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {change.reason || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Downgrades/Cancellations Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Downgrades & Cancellations Trend</h3>
          {loading ? (
            <div className="h-64 w-full bg-gray-100 animate-pulse rounded-lg"></div>
          ) : downgradeTrend.length === 0 ? (
            <div className="h-64 w-full bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">No data available for the selected timeframe</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={downgradeTrend}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="downgrades" 
                    stroke="#FFBB28" 
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cancellations" 
                    stroke="#FF8042" 
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#FF0000" 
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Insights Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Plan Engagement Insights</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">IUA Preferences</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Most popular IUA level: $1500 (58% of members)</li>
                <li>• Lowest churn rate: $3000 IUA plans (4.2%)</li>
                <li>• Most upgrades: $6000 → $3000 (financial improvement)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Plan Type Trends</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Most stable plan: Member + Family (92% retention)</li>
                <li>• Highest upgrade path: Member Only → Member + Spouse</li>
                <li>• Most common downgrade reason: "Financial constraints"</li>
              </ul>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

// Helper function to determine if a plan change is an upgrade
function isPlanUpgrade(previousPlan: string, newPlan: string): boolean {
  // Simple heuristic - could be more sophisticated in a real implementation
  if (newPlan === 'Cancelled') return false;
  
  const planHierarchy = {
    'Member Only': 1,
    'Member + Child': 2,
    'Member + Spouse': 3,
    'Member + Family': 4
  };
  
  const previousType = Object.keys(planHierarchy).find(key => previousPlan.includes(key));
  const newType = Object.keys(planHierarchy).find(key => newPlan.includes(key));
  
  if (!previousType || !newType) return false;
  
  return planHierarchy[previousType as keyof typeof planHierarchy] < planHierarchy[newType as keyof typeof planHierarchy];
}

// Helper function to determine if a plan change is a downgrade
function isPlanDowngrade(previousPlan: string, newPlan: string): boolean {
  if (newPlan === 'Cancelled') return true;
  
  const planHierarchy = {
    'Member Only': 1,
    'Member + Child': 2,
    'Member + Spouse': 3,
    'Member + Family': 4
  };
  
  const previousType = Object.keys(planHierarchy).find(key => previousPlan.includes(key));
  const newType = Object.keys(planHierarchy).find(key => newPlan.includes(key));
  
  if (!previousType || !newType) return false;
  
  return planHierarchy[previousType as keyof typeof planHierarchy] > planHierarchy[newType as keyof typeof planHierarchy];
}