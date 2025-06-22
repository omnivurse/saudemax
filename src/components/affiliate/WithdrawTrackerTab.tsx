import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download, 
  Filter, 
  Search,
  AlertTriangle,
  ArrowRight,
  CreditCard
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { format } from 'date-fns';

interface Commission {
  id: string;
  member_id: string;
  amount: number;
  type: 'one_time' | 'recurring';
  plan_code: string;
  status: 'unpaid' | 'pending' | 'paid' | 'failed';
  payout_date: string | null;
  created_at: string;
}

interface PayoutRequest {
  id: string;
  amount_requested: number;
  status: 'processing' | 'completed' | 'failed';
  requested_at: string;
  completed_at: string | null;
}

export const WithdrawTrackerTab: React.FC = () => {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [filteredCommissions, setFilteredCommissions] = useState<Commission[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestLoading, setRequestLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestAmount, setRequestAmount] = useState<number | ''>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Fetch affiliate commissions
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('affiliate_commissions')
        .select('*')
        .eq('affiliate_id', user.id)
        .order('created_at', { ascending: false });

      if (commissionsError) throw commissionsError;

      // Fetch payout requests
      const { data: payoutsData, error: payoutsError } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('affiliate_id', user.id)
        .order('requested_at', { ascending: false });

      if (payoutsError) throw payoutsError;

      setCommissions(commissionsData || []);
      setFilteredCommissions(commissionsData || []);
      setPayoutRequests(payoutsData || []);
    } catch (err: any) {
      console.error('Error fetching withdraw data:', err);
      setError(err.message || 'Failed to load commission data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Apply filtering
    let filtered = [...commissions];
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(commission => commission.status === statusFilter);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(commission => 
        commission.member_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        commission.plan_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredCommissions(filtered);
  }, [commissions, statusFilter, searchTerm]);

  const handleRequestWithdrawal = async () => {
    if (!requestAmount) {
      setError('Please enter a valid amount');
      return;
    }

    // Check if there's a pending request
    const hasPendingRequest = payoutRequests.some(request => request.status === 'processing');
    if (hasPendingRequest) {
      setError('You already have a pending withdrawal request');
      return;
    }

    // Calculate total unpaid amount
    const totalUnpaid = commissions
      .filter(commission => commission.status === 'unpaid')
      .reduce((sum, commission) => sum + commission.amount, 0);

    // Validate request amount
    if (requestAmount > totalUnpaid) {
      setError(`You can only request up to $${totalUnpaid.toFixed(2)}`);
      return;
    }

    try {
      setRequestLoading(true);
      setError(null);
      setSuccess(null);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Create payout request
      const { data, error: insertError } = await supabase
        .from('payout_requests')
        .insert({
          affiliate_id: user.id,
          amount_requested: requestAmount,
          status: 'processing',
          requested_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Update payout requests list
      setPayoutRequests(prev => [data, ...prev]);
      setSuccess('Withdrawal request submitted successfully');
      
      // Reset form and close modal
      setRequestAmount('');
      setShowRequestModal(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error requesting withdrawal:', err);
      setError(err.message || 'Failed to submit withdrawal request');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleExportCSV = () => {
    // Create CSV content
    const headers = ['Member ID', 'Plan', 'Amount', 'Type', 'Status', 'Created Date', 'Payout Date'];
    const csvContent = [
      headers.join(','),
      ...filteredCommissions.map(commission => [
        commission.member_id,
        commission.plan_code,
        commission.amount.toFixed(2),
        commission.type,
        commission.status,
        format(new Date(commission.created_at), 'yyyy-MM-dd'),
        commission.payout_date ? format(new Date(commission.payout_date), 'yyyy-MM-dd') : ''
      ].join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `commission-history-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate summary values
  const totalUnpaid = commissions
    .filter(commission => commission.status === 'unpaid')
    .reduce((sum, commission) => sum + commission.amount, 0);

  const totalPaid = commissions
    .filter(commission => commission.status === 'paid')
    .reduce((sum, commission) => sum + commission.amount, 0);

  const totalPending = payoutRequests
    .filter(request => request.status === 'processing')
    .reduce((sum, request) => sum + request.amount_requested, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'unpaid': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'unpaid': return <DollarSign className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Withdrawal Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Request Withdrawal</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available for Withdrawal
                </label>
                <div className="text-2xl font-bold text-gray-900">${totalUnpaid.toFixed(2)}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount to Withdraw *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value ? parseFloat(e.target.value) : '')}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    step="0.01"
                    min="1"
                    max={totalUnpaid}
                  />
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Withdrawal Information</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Minimum withdrawal amount: $50.00</li>
                  <li>• Processing time: 3-5 business days</li>
                  <li>• Payment method: Direct deposit</li>
                </ul>
              </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRequestModal(false);
                    setError(null);
                  }}
                  disabled={requestLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRequestWithdrawal}
                  loading={requestLoading}
                  disabled={requestLoading || !requestAmount || requestAmount <= 0 || requestAmount > totalUnpaid}
                >
                  Submit Request
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Withdraw Tracker</h2>
        <Button 
          onClick={() => setShowRequestModal(true)}
          disabled={totalUnpaid <= 0 || payoutRequests.some(request => request.status === 'processing')}
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Request Withdrawal
        </Button>
      </div>

      {/* Status Messages */}
      {error && !showRequestModal && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">{success}</span>
          </div>
        </div>
      )}

      {/* Commission Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Unpaid Commissions</p>
              <p className="text-2xl font-bold text-blue-600">${totalUnpaid.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="w-5 h-5 text-blue-700" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Withdrawals</p>
              <p className="text-2xl font-bold text-yellow-600">${totalPending.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="w-5 h-5 text-yellow-700" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-5 h-5 text-green-700" />
            </div>
          </div>
        </Card>
      </div>

      {/* Withdrawal Requests */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Withdrawal Requests</h3>
        
        {loading && payoutRequests.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          </div>
        ) : payoutRequests.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Withdrawal Requests</h4>
            <p className="text-gray-600 mb-4">You haven't made any withdrawal requests yet.</p>
            <Button 
              onClick={() => setShowRequestModal(true)}
              disabled={totalUnpaid <= 0}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Request Withdrawal
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payoutRequests.map((request) => {
                  const StatusIcon = request.status === 'completed' ? CheckCircle : 
                                    request.status === 'failed' ? XCircle : Clock;
                  
                  return (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(request.requested_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${request.amount_requested.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${
                          request.status === 'completed' ? 'bg-green-100 text-green-800' :
                          request.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(request.completed_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Commission History */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 sm:mb-0">Commission History</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="unpaid">Unpaid</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        {loading && commissions.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          </div>
        ) : filteredCommissions.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Commission Records</h4>
            <p className="text-gray-600">
              {statusFilter !== 'all' || searchTerm 
                ? 'No records match your filter criteria.' 
                : 'You haven\'t earned any commissions yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payout Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCommissions.map((commission) => {
                  const StatusIcon = getStatusIcon(commission.status);
                  
                  return (
                    <tr key={commission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {commission.member_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {commission.plan_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${commission.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {commission.type.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${getStatusColor(commission.status)}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {commission.status.charAt(0).toUpperCase() + commission.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(commission.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(commission.payout_date)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Payout Information */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Payout Information</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Payout Schedule</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Withdrawal requests processed weekly</li>
              <li>• Minimum withdrawal amount: $50.00</li>
              <li>• Processing time: 3-5 business days</li>
              <li>• Payments sent via direct deposit</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Commission Types</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• One-time: Paid for initial enrollments</li>
              <li>• Recurring: Monthly commission on active members</li>
              <li>• Bonus: Special incentives and promotions</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-blue-800 text-sm">
            <strong>Need help?</strong> Contact your account manager or email <a href="mailto:commissions@saudemax.com" className="underline">commissions@saudemax.com</a>
          </p>
        </div>
      </Card>
    </div>
  );
};