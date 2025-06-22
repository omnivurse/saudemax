import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  DollarSign,
  Calendar,
  Download,
  Filter,
  Eye,
  Star,
  Award,
  Target,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useAuth } from '../components/auth/AuthProvider';
import { supabase } from '../lib/supabase';

interface LeaderboardEntry {
  id: string;
  affiliate_code: string;
  email: string;
  total_earnings: number;
  total_referrals: number;
  total_visits: number;
  commission_rate: number;
  status: string;
  created_at: string;
  conversion_rate: number;
  monthly_earnings: number;
  monthly_referrals: number;
  rank: number;
}

interface PerformanceMetrics {
  totalAffiliates: number;
  activeAffiliates: number;
  totalEarnings: number;
  totalReferrals: number;
  averageConversionRate: number;
  topPerformer: string;
}

export const AdminLeaderboard: React.FC = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'quarter'>('all');
  const [sortBy, setSortBy] = useState<'earnings' | 'referrals' | 'conversion'>('earnings');
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch affiliates with their performance data
      const { data: affiliatesData, error: affiliatesError } = await supabase
        .from('affiliates')
        .select(`
          id,
          affiliate_code,
          email,
          total_earnings,
          total_referrals,
          total_visits,
          commission_rate,
          status,
          created_at
        `)
        .eq('status', 'active')
        .order('total_earnings', { ascending: false });

      if (affiliatesError) {
        throw affiliatesError;
      }

      // Calculate additional metrics for each affiliate
      const enrichedData = await Promise.all(
        (affiliatesData || []).map(async (affiliate, index) => {
          // Calculate conversion rate
          const conversionRate = affiliate.total_visits > 0 
            ? (affiliate.total_referrals / affiliate.total_visits) * 100 
            : 0;

          // Get monthly performance (last 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const { data: monthlyReferrals } = await supabase
            .from('affiliate_referrals')
            .select('commission_amount')
            .eq('affiliate_id', affiliate.id)
            .gte('created_at', thirtyDaysAgo.toISOString());

          const monthlyEarnings = monthlyReferrals?.reduce(
            (sum, ref) => sum + (ref.commission_amount || 0), 
            0
          ) || 0;

          const monthlyReferralCount = monthlyReferrals?.length || 0;

          return {
            ...affiliate,
            conversion_rate: conversionRate,
            monthly_earnings: monthlyEarnings,
            monthly_referrals: monthlyReferralCount,
            rank: index + 1
          };
        })
      );

      // Sort based on selected criteria
      const sortedData = enrichedData.sort((a, b) => {
        switch (sortBy) {
          case 'referrals':
            return b.total_referrals - a.total_referrals;
          case 'conversion':
            return b.conversion_rate - a.conversion_rate;
          default:
            return b.total_earnings - a.total_earnings;
        }
      });

      // Update ranks after sorting
      const rankedData = sortedData.map((item, index) => ({
        ...item,
        rank: index + 1
      }));

      setLeaderboard(rankedData);

      // Calculate overall metrics
      const totalAffiliates = rankedData.length;
      const activeAffiliates = rankedData.filter(a => a.status === 'active').length;
      const totalEarnings = rankedData.reduce((sum, a) => sum + a.total_earnings, 0);
      const totalReferrals = rankedData.reduce((sum, a) => sum + a.total_referrals, 0);
      const averageConversionRate = rankedData.reduce((sum, a) => sum + a.conversion_rate, 0) / totalAffiliates;
      const topPerformer = rankedData[0]?.affiliate_code || 'N/A';

      setMetrics({
        totalAffiliates,
        activeAffiliates,
        totalEarnings,
        totalReferrals,
        averageConversionRate,
        topPerformer
      });

    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchLeaderboardData();
    }
  }, [user, timeFilter, sortBy]);

  const exportLeaderboard = () => {
    const csvContent = [
      ['Rank', 'Affiliate Code', 'Email', 'Total Earnings', 'Total Referrals', 'Conversion Rate', 'Monthly Earnings', 'Status'].join(','),
      ...leaderboard.map(entry => [
        entry.rank,
        entry.affiliate_code,
        entry.email,
        entry.total_earnings.toFixed(2),
        entry.total_referrals,
        entry.conversion_rate.toFixed(2) + '%',
        entry.monthly_earnings.toFixed(2),
        entry.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `affiliate-leaderboard-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2: return <Award className="w-6 h-6 text-gray-400" />;
      case 3: return <Star className="w-6 h-6 text-amber-600" />;
      default: return <span className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2: return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3: return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Redirect non-admin users
  if (user?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="text-center">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access the affiliate leaderboard.</p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Affiliate Performance Leaderboard</h1>
          <p className="text-gray-600">Track and analyze affiliate performance metrics</p>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <p className="text-red-800">Error: {error}</p>
          </motion.div>
        )}

        {/* Performance Metrics */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="bg-blue-50 border-blue-200">
                <div className="text-center">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-900">{metrics.totalAffiliates}</p>
                  <p className="text-sm text-blue-700">Total Affiliates</p>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-green-50 border-green-200">
                <div className="text-center">
                  <Activity className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-900">{metrics.activeAffiliates}</p>
                  <p className="text-sm text-green-700">Active</p>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="bg-purple-50 border-purple-200">
                <div className="text-center">
                  <DollarSign className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-900">${metrics.totalEarnings.toFixed(0)}</p>
                  <p className="text-sm text-purple-700">Total Earnings</p>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="bg-orange-50 border-orange-200">
                <div className="text-center">
                  <Target className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-orange-900">{metrics.totalReferrals}</p>
                  <p className="text-sm text-orange-700">Total Referrals</p>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card className="bg-teal-50 border-teal-200">
                <div className="text-center">
                  <TrendingUp className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-teal-900">{metrics.averageConversionRate.toFixed(1)}%</p>
                  <p className="text-sm text-teal-700">Avg Conversion</p>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card className="bg-yellow-50 border-yellow-200">
                <div className="text-center">
                  <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-lg font-bold text-yellow-900">{metrics.topPerformer}</p>
                  <p className="text-sm text-yellow-700">Top Performer</p>
                </div>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Filters and Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <Card>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center space-x-4">
                <Filter className="w-5 h-5 text-gray-400" />
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="earnings">Sort by Earnings</option>
                  <option value="referrals">Sort by Referrals</option>
                  <option value="conversion">Sort by Conversion Rate</option>
                </select>

                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                </select>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={exportLeaderboard}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={fetchLeaderboardData}>
                  <Activity className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Leaderboard Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Card>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading leaderboard...</p>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Affiliates</h3>
                <p className="text-gray-600">No active affiliates found for the leaderboard.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Affiliate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Earnings
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Referrals
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Conversion Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monthly Performance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leaderboard.map((entry, index) => (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            {getRankIcon(entry.rank)}
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRankBadgeColor(entry.rank)}`}>
                              #{entry.rank}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {entry.affiliate_code}
                            </div>
                            <div className="text-sm text-gray-500">
                              {entry.email}
                            </div>
                            <div className="text-xs text-gray-400">
                              Member since {new Date(entry.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            ${entry.total_earnings.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {entry.commission_rate}% commission rate
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {entry.total_referrals}
                          </div>
                          <div className="text-xs text-gray-500">
                            {entry.total_visits} visits
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              {entry.conversion_rate.toFixed(1)}%
                            </div>
                            <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${Math.min(entry.conversion_rate, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            ${entry.monthly_earnings.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {entry.monthly_referrals} referrals this month
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => window.open(`mailto:${entry.email}?subject=SaudeMAX Affiliate Performance&body=Hello ${entry.affiliate_code},%0D%0A%0D%0ACongratulations on your performance!`)}
                            >
                              <DollarSign className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Performance Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-6 h-6 text-blue-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Performance Insights</h3>
                <div className="text-blue-800 space-y-2">
                  <p>
                    <strong>Top Performer:</strong>{' '}
                    {metrics?.topPerformer || 'N/A'} is leading with ${leaderboard[0]?.total_earnings.toFixed(2) || '0'} in earnings
                  </p>
                  <p>
                    <strong>Conversion Leader:</strong>{' '}
                    {leaderboard.sort((a, b) => b.conversion_rate - a.conversion_rate)[0]?.affiliate_code || 'N/A'} has the highest conversion rate at{' '}
                    {leaderboard.sort((a, b) => b.conversion_rate - a.conversion_rate)[0]?.conversion_rate.toFixed(1) || '0'}%
                  </p>
                  <p>
                    <strong>Monthly Star:</strong>{' '}
                    {leaderboard.sort((a, b) => b.monthly_earnings - a.monthly_earnings)[0]?.affiliate_code || 'N/A'} is the top performer this month
                  </p>
                </div>
                <div className="mt-4 text-sm text-blue-700">
                  <p>💡 <strong>Tip:</strong> Consider creating a special incentive program for your top 3 affiliates to boost overall performance.</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Public Leaderboard Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <Card>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Public Leaderboard Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Enable Public Leaderboard</h4>
                  <p className="text-sm text-gray-600">Show top performers on a public page to encourage competition</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Show Earnings</h4>
                  <p className="text-sm text-gray-600">Display earnings amounts on the public leaderboard</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    defaultChecked
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Show Conversion Rates</h4>
                  <p className="text-sm text-gray-600">Display conversion metrics on the public leaderboard</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Number of Visible Affiliates</h4>
                  <p className="text-sm text-gray-600">How many affiliates to show on the public leaderboard</p>
                </div>
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="5">Top 5</option>
                  <option value="10" selected>Top 10</option>
                  <option value="20">Top 20</option>
                  <option value="all">All</option>
                </select>
              </div>

              <Button>
                Save Settings
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};