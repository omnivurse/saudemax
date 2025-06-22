import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart as BarChartIcon, 
  TrendingUp, 
  Calendar, 
  Download, 
  Search, 
  Filter, 
  Link as LinkIcon,
  ExternalLink,
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { format } from 'date-fns';
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

interface ReferralData {
  id: string;
  referral_url: string;
  click_count: number;
  conversion_count: number;
  earnings: number;
  created_at: string;
}

export const ReferralMetricsTab: React.FC = () => {
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [filteredReferrals, setFilteredReferrals] = useState<ReferralData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'all' | 'month' | 'quarter'>('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'earnings' | 'conversions' | 'clicks'>('earnings');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchReferralData();
  }, [timeframe]);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get affiliate ID
      const { data: affiliateData, error: affiliateError } = await supabase
        .from('affiliates')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (affiliateError) {
        console.error('Error fetching affiliate ID:', affiliateError);
        throw new Error('Could not find your affiliate profile');
      }
      
      const affiliateId = affiliateData.id;

      // Calculate date range based on timeframe
      let fromDate: Date | null = null;
      const now = new Date();
      
      if (timeframe === 'month') {
        fromDate = new Date(now);
        fromDate.setMonth(now.getMonth() - 1);
      } else if (timeframe === 'quarter') {
        fromDate = new Date(now);
        fromDate.setMonth(now.getMonth() - 3);
      }

      // Fetch referral data
      let query = supabase
        .from('affiliate_referrals')
        .select('*')
        .eq('affiliate_id', affiliateId);
      
      if (fromDate) {
        query = query.gte('created_at', fromDate.toISOString());
      }

      const { data: referralData, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      
      // Fetch visit data
      const { data: visitData, error: visitError } = await supabase
        .from('affiliate_visits')
        .select('*')
        .eq('affiliate_id', affiliateId);
        
      if (visitError) throw visitError;
      
      // Fetch affiliate links
      const { data: linkData, error: linkError } = await supabase
        .from('affiliate_links')
        .select('*')
        .eq('affiliate_id', user.id);
        
      if (linkError) throw linkError;

      // Transform data for display
      // Group visits by referral URL
      const visitsByUrl: Record<string, number> = {};
      visitData?.forEach(visit => {
        const url = visit.page_url || 'unknown';
        visitsByUrl[url] = (visitsByUrl[url] || 0) + 1;
      });
      
      // Group conversions by referral URL
      const conversionsByUrl: Record<string, number> = {};
      const earningsByUrl: Record<string, number> = {};
      
      referralData?.forEach(referral => {
        // Try to match with a link
        const matchingLink = linkData?.find(link => 
          referral.order_id?.includes(new URL(link.referral_url).searchParams.get('source') || '')
        );
        
        const url = matchingLink?.referral_url || 'default';
        conversionsByUrl[url] = (conversionsByUrl[url] || 0) + 1;
        earningsByUrl[url] = (earningsByUrl[url] || 0) + (referral.commission_amount || 0);
      });
      
      // Create combined data
      const transformedData: ReferralData[] = Object.keys(visitsByUrl).map(url => {
        return {
          id: url,
          referral_url: url,
          click_count: visitsByUrl[url] || 0,
          conversion_count: conversionsByUrl[url] || 0,
          earnings: earningsByUrl[url] || 0,
          created_at: new Date().toISOString() // Fallback
        };
      });
      
      // Add any links that don't have visits yet
      linkData?.forEach(link => {
        if (!transformedData.some(item => item.referral_url === link.referral_url)) {
          transformedData.push({
            id: link.id,
            referral_url: link.referral_url,
            click_count: 0,
            conversion_count: 0,
            earnings: 0,
            created_at: link.created_at
          });
        }
      });

      setReferrals(transformedData);
      setFilteredReferrals(transformedData);
    } catch (err: any) {
      console.error('Error fetching referral data:', err);
      setError(err.message || 'Failed to load referral metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Apply filtering and sorting
    let filtered = [...referrals];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(ref => 
        ref.referral_url.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'earnings') {
        comparison = a.earnings - b.earnings;
      } else if (sortBy === 'conversions') {
        comparison = a.conversion_count - b.conversion_count;
      } else if (sortBy === 'clicks') {
        comparison = a.click_count - b.click_count;
      }
      
      return sortDirection === 'desc' ? -comparison : comparison;
    });
    
    setFilteredReferrals(filtered);
  }, [referrals, searchTerm, sortBy, sortDirection]);

  // Prepare chart data
  const chartData = filteredReferrals.map(ref => {
    // Extract source parameter or use URL
    let name;
    try {
      const url = new URL(ref.referral_url);
      name = url.searchParams.get('source') || url.searchParams.get('ref') || url.pathname.split('/').pop() || 'Unknown';
    } catch (e) {
      name = 'Unknown';
    }
    
    return {
      name,
      conversions: ref.conversion_count,
      earnings: ref.earnings,
      clicks: ref.click_count
    };
  });

  // Calculate totals
  const totalClicks = filteredReferrals.reduce((sum, ref) => sum + ref.click_count, 0);
  const totalConversions = filteredReferrals.reduce((sum, ref) => sum + ref.conversion_count, 0);
  const totalEarnings = filteredReferrals.reduce((sum, ref) => sum + ref.earnings, 0);
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

  const handleExport = () => {
    // Create CSV content
    const headers = ['Referral URL', 'Clicks', 'Conversions', 'Earnings', 'Created Date'];
    const csvContent = [
      headers.join(','),
      ...filteredReferrals.map(ref => [
        ref.referral_url,
        ref.click_count,
        ref.conversion_count,
        `$${ref.earnings.toFixed(2)}`,
        format(new Date(ref.created_at), 'yyyy-MM-dd')
      ].join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `referral-metrics-${timeframe}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Referral Metrics</h2>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setTimeframe('month')}
            className={timeframe === 'month' ? 'bg-blue-50 border-blue-200' : ''}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Month
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
            onClick={() => setTimeframe('all')}
            className={timeframe === 'all' ? 'bg-blue-50 border-blue-200' : ''}
          >
            <Calendar className="w-4 h-4 mr-2" />
            All Time
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Clicks</p>
              <p className="text-2xl font-bold text-gray-900">{totalClicks.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <LinkIcon className="w-5 h-5 text-blue-700" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Conversions</p>
              <p className="text-2xl font-bold text-gray-900">{totalConversions.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="w-5 h-5 text-green-700" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{conversionRate.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <BarChartIcon className="w-5 h-5 text-purple-700" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">${totalEarnings.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <DollarSign className="w-5 h-5 text-yellow-700" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search referral links..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full sm:w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="earnings">Sort by Earnings</option>
              <option value="conversions">Sort by Conversions</option>
              <option value="clicks">Sort by Clicks</option>
            </select>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={toggleSortDirection}
            >
              {sortDirection === 'desc' ? '↓' : '↑'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Chart */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Referral Link</h3>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <AlertTriangle className="w-10 h-10 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{error}</h3>
            <Button variant="outline" size="sm" onClick={fetchReferralData}>
              Try Again
            </Button>
          </div>
        ) : filteredReferrals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <BarChartIcon className="w-10 h-10 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Referral Data</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'No results match your search criteria.' : 'You don\'t have any referral data for this time period.'}
            </p>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="conversions" fill="#3B82F6" name="Conversions" />
                <Bar yAxisId="right" dataKey="earnings" fill="#10B981" name="Earnings ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Data Table */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Referral Links</h3>
        {loading ? (
          <div className="flex justify-center items-center h-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredReferrals.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500">No referral data available.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referral Link
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clicks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversion Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Earnings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReferrals.map((referral) => {
                  const conversionRate = referral.click_count > 0 
                    ? (referral.conversion_count / referral.click_count) * 100 
                    : 0;
                  
                  // Extract source parameter or use URL
                  let refCode;
                  try {
                    const url = new URL(referral.referral_url);
                    refCode = url.searchParams.get('source') || url.searchParams.get('ref') || url.pathname.split('/').pop() || 'Unknown';
                  } catch (e) {
                    refCode = 'Unknown';
                  }
                  
                  return (
                    <tr key={referral.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {refCode}
                            </div>
                            <div className="text-xs text-gray-500 truncate max-w-xs">
                              {referral.referral_url}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {referral.click_count.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {referral.conversion_count.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {conversionRate.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${referral.earnings.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => window.open(referral.referral_url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Tips Section */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Referral Tips</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Boost Your Conversions</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Share your referral links on social media</li>
              <li>• Include your link in email signatures</li>
              <li>• Create targeted landing pages</li>
              <li>• Follow up with potential clients</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Commission Structure</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• 10% commission on first month</li>
              <li>• 5% recurring commission for 12 months</li>
              <li>• Bonus tiers for high-volume referrers</li>
              <li>• Monthly payouts via direct deposit</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};