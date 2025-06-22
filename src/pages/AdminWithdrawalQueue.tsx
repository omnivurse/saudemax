import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Check, 
  X, 
  Clock, 
  DollarSign,
  User,
  Calendar,
  Filter,
  Download,
  Eye,
  AlertCircle,
  Mail,
  ExternalLink
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useAuth } from '../components/auth/AuthProvider';
import { supabase } from '../lib/supabase';

interface WithdrawalRequest {
  id: string;
  affiliate_id: string;
  amount: number;
  method: string;
  payout_email: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transaction_id?: string;
  notes?: string;
  requested_at: string;
  processed_at?: string;
  affiliate: {
    id: string;
    affiliate_code: string;
    email: string;
    total_earnings: number;
    total_referrals: number;
  };
}

export const AdminWithdrawalQueue: React.FC = () => {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('affiliate_withdrawals')
        .select(`
          *,
          affiliate:affiliates(
            id,
            affiliate_code,
            email,
            total_earnings,
            total_referrals
          )
        `)
        .order('requested_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setWithdrawals(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching withdrawals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only allow admin users to access this page
    if (user?.role === 'admin') {
      fetchWithdrawals();
    }
  }, [user, statusFilter]);

  const updateWithdrawalStatus = async (
    withdrawalId: string, 
    newStatus: 'processing' | 'completed' | 'failed',
    transactionId?: string,
    notes?: string
  ) => {
    try {
      setProcessing(withdrawalId);
      setError(null);
      setSuccess(null);

      const updateData: any = {
        status: newStatus,
        processed_at: new Date().toISOString()
      };

      if (transactionId) {
        updateData.transaction_id = transactionId;
      }

      if (notes) {
        updateData.notes = notes;
      }

      const { error: updateError } = await supabase
        .from('affiliate_withdrawals')
        .update(updateData)
        .eq('id', withdrawalId);

      if (updateError) {
        throw updateError;
      }

      // Send email notification (if edge function exists)
      try {
        const withdrawal = withdrawals.find(w => w.id === withdrawalId);
        if (withdrawal?.affiliate?.email) {
          await sendWithdrawalNotification(
            withdrawal.affiliate.email,
            newStatus,
            withdrawal.amount,
            withdrawal.affiliate.affiliate_code
          );
        }
      } catch (emailError) {
        console.warn('Email notification failed:', emailError);
        // Don't fail the entire operation if email fails
      }

      setSuccess(`Withdrawal ${newStatus} successfully!`);
      
      // Refresh the list
      await fetchWithdrawals();
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating withdrawal:', err);
    } finally {
      setProcessing(null);
    }
  };

  const sendWithdrawalNotification = async (
    email: string,
    status: string,
    amount: number,
    affiliateCode: string
  ) => {
    // This would typically call a Supabase Edge Function
    // For now, we'll just log it - you can implement the actual email service later
    console.log('Sending withdrawal notification:', {
      email,
      status,
      amount,
      affiliateCode,
      subject: `Withdrawal Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your withdrawal request for $${amount.toFixed(2)} has been ${status}.`
    });

    // Example of how you might call an edge function:
    /*
    const { error } = await supabase.functions.invoke('send-withdrawal-notification', {
      body: {
        email,
        status,
        amount,
        affiliateCode
      }
    });

    if (error) {
      throw error;
    }
    */
  };

  const exportWithdrawals = () => {
    const csvContent = [
      ['Affiliate Code', 'Email', 'Amount', 'Method', 'Status', 'Requested Date', 'Processed Date'].join(','),
      ...withdrawals.map(w => [
        w.affiliate?.affiliate_code || '',
        w.affiliate?.email || '',
        w.amount.toFixed(2),
        w.method,
        w.status,
        new Date(w.requested_at).toLocaleDateString(),
        w.processed_at ? new Date(w.processed_at).toLocaleDateString() : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `withdrawals-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'processing': return CreditCard;
      case 'completed': return Check;
      case 'failed': return X;
      default: return AlertCircle;
    }
  };

  const totalPendingAmount = withdrawals
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + w.amount, 0);

  const totalProcessedAmount = withdrawals
    .filter(w => w.status === 'completed')
    .reduce((sum, w) => sum + w.amount, 0);

  // Redirect non-admin users
  if (user?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Withdrawal Review Queue</h1>
          <p className="text-gray-600">Review and process affiliate withdrawal requests</p>
        </motion.div>

        {/* Status Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">Error: {error}</span>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4"
          >
            <div className="flex items-center space-x-2">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium">{success}</span>
            </div>
          </motion.div>
        )}

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="bg-yellow-50 border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-800">Pending Requests</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {withdrawals.filter(w => w.status === 'pending').length}
                  </p>
                  <p className="text-sm text-yellow-700">
                    ${totalPendingAmount.toFixed(2)} total
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-green-50 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Completed</p>
                  <p className="text-2xl font-bold text-green-900">
                    {withdrawals.filter(w => w.status === 'completed').length}
                  </p>
                  <p className="text-sm text-green-700">
                    ${totalProcessedAmount.toFixed(2)} paid out
                  </p>
                </div>
                <Check className="w-8 h-8 text-green-600" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Processing</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {withdrawals.filter(w => w.status === 'processing').length}
                  </p>
                  <p className="text-sm text-blue-700">In progress</p>
                </div>
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center space-x-4">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <Button variant="outline" size="sm" onClick={exportWithdrawals}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Withdrawals Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading withdrawal requests...</p>
              </div>
            ) : withdrawals.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Withdrawal Requests</h3>
                <p className="text-gray-600">
                  {statusFilter === 'all' 
                    ? 'No withdrawal requests found.' 
                    : `No ${statusFilter} withdrawal requests found.`
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Affiliate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Requested
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {withdrawals.map((withdrawal) => {
                      const StatusIcon = getStatusIcon(withdrawal.status);
                      return (
                        <tr key={withdrawal.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {withdrawal.affiliate?.affiliate_code || 'Unknown'}
                                </div>
                                <div className="text-sm text-gray-500 flex items-center">
                                  <Mail className="w-3 h-3 mr-1" />
                                  {withdrawal.affiliate?.email || 'No email'}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {withdrawal.affiliate?.total_referrals || 0} referrals • 
                                  ${withdrawal.affiliate?.total_earnings?.toFixed(2) || '0.00'} earned
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              ${withdrawal.amount.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {withdrawal.transaction_id && (
                                <span>TXN: {withdrawal.transaction_id}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 capitalize">
                              {withdrawal.method}
                            </div>
                            <div className="text-xs text-gray-500">
                              {withdrawal.payout_email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <StatusIcon className="w-4 h-4" />
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(withdrawal.status)}`}>
                                {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                              </span>
                            </div>
                            {withdrawal.notes && (
                              <div className="text-xs text-gray-500 mt-1">
                                {withdrawal.notes}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(withdrawal.requested_at).toLocaleDateString()}</span>
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(withdrawal.requested_at).toLocaleTimeString()}
                            </div>
                            {withdrawal.processed_at && (
                              <div className="text-xs text-green-600 mt-1">
                                Processed: {new Date(withdrawal.processed_at).toLocaleDateString()}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {withdrawal.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => updateWithdrawalStatus(withdrawal.id, 'processing')}
                                    loading={processing === withdrawal.id}
                                    disabled={processing === withdrawal.id}
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateWithdrawalStatus(withdrawal.id, 'failed', undefined, 'Rejected by admin')}
                                    loading={processing === withdrawal.id}
                                    disabled={processing === withdrawal.id}
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                              {withdrawal.status === 'processing' && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => updateWithdrawalStatus(withdrawal.id, 'completed', `TXN-${Date.now()}`)}
                                  loading={processing === withdrawal.id}
                                  disabled={processing === withdrawal.id}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Mark Paid
                                </Button>
                              )}
                              {withdrawal.affiliate?.email && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => window.open(`mailto:${withdrawal.affiliate.email}?subject=Withdrawal Request Update&body=Hello ${withdrawal.affiliate.affiliate_code},%0D%0A%0D%0ARegarding your withdrawal request for $${withdrawal.amount.toFixed(2)}...`)}
                                >
                                  <Mail className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card className="bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <ExternalLink className="w-6 h-6 text-blue-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Withdrawal Processing Guide</h3>
                <div className="text-blue-800 space-y-2">
                  <p><strong>Pending:</strong> New withdrawal requests awaiting review</p>
                  <p><strong>Processing:</strong> Approved requests being processed for payment</p>
                  <p><strong>Completed:</strong> Successfully paid withdrawals with transaction IDs</p>
                  <p><strong>Failed:</strong> Rejected or failed withdrawal attempts</p>
                </div>
                <div className="mt-4 text-sm text-blue-700">
                  <p>💡 <strong>Tip:</strong> Click the email icon to send custom messages to affiliates about their withdrawal status.</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};