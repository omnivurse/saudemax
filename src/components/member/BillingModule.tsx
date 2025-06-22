import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Download, 
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Plus,
  Edit
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { format } from 'date-fns';

interface BillingRecord {
  id: string;
  invoice_number: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'failed';
  payment_method: string | null;
  description: string;
  invoice_url: string | null;
}

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'bank_transfer' | 'crypto' | 'pix';
  last4: string | null;
  brand: string | null;
  expiry_month: number | null;
  expiry_year: number | null;
  is_default: boolean;
  is_active: boolean;
}

export const BillingModule: React.FC = () => {
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        setLoading(true);
        setError(null);

        // First, get the member profile ID
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Use limit(1) instead of single() to avoid PGRST116 error
        const { data: profileData, error: profileError } = await supabase
          .from('member_profiles')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (profileError) {
          throw profileError;
        }

        if (!profileData || profileData.length === 0) {
          console.warn("No member profile found for user", user.id);
          throw new Error('Member profile not found');
        }

        const profileId = profileData[0].id;

        // Fetch billing records
        const { data: billingData, error: billingError } = await supabase
          .from('billing_records')
          .select('*')
          .eq('member_profile_id', profileId)
          .order('due_date', { ascending: false })
          .limit(12);

        if (billingError) {
          throw billingError;
        }

        // Fetch payment methods
        const { data: paymentData, error: paymentError } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('member_profile_id', profileId)
          .eq('is_active', true);

        if (paymentError) {
          throw paymentError;
        }

        setBillingRecords(billingData || []);
        setPaymentMethods(paymentData || []);
      } catch (err: any) {
        console.error('Error fetching billing data:', err);
        setError(err.message || 'Failed to load billing data');
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'overdue': return <XCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
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

  const getPaymentMethodDisplay = (method: PaymentMethod) => {
    if (method.type === 'credit_card') {
      return `${method.brand || 'Card'} •••• ${method.last4 || '****'}`;
    } else if (method.type === 'bank_transfer') {
      return 'Bank Transfer';
    } else if (method.type === 'crypto') {
      return 'Cryptocurrency';
    } else if (method.type === 'pix') {
      return 'PIX';
    }
    return 'Unknown payment method';
  };

  const defaultPaymentMethod = paymentMethods.find(method => method.is_default);

  const handleDownloadInvoice = (invoiceUrl: string | null, invoiceNumber: string) => {
    if (!invoiceUrl) {
      alert('Invoice not available for download');
      return;
    }
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = invoiceUrl;
    link.download = `Invoice-${invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center h-40 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {error}
          </h3>
          <Button variant="outline" size="sm">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Method Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Payment Method</h2>
              <p className="text-gray-600 mt-1">Manage your payment information</p>
            </div>
            <Button className="mt-4 md:mt-0">
              <Plus className="w-4 h-4 mr-2" />
              Add Payment Method
            </Button>
          </div>

          {paymentMethods.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payment Methods</h3>
              <p className="text-gray-600 mb-4">You haven't added any payment methods yet.</p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Payment Method
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`p-4 border rounded-lg ${
                    method.is_default ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-6 h-6 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {getPaymentMethodDisplay(method)}
                        </p>
                        {method.type === 'credit_card' && method.expiry_month && method.expiry_year && (
                          <p className="text-sm text-gray-500">
                            Expires: {method.expiry_month}/{method.expiry_year}
                          </p>
                        )}
                        {method.is_default && (
                          <span className="text-sm text-blue-600">Default</span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Billing Records Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Billing History</h2>
              <p className="text-gray-600 mt-1">View your payment history and invoices</p>
            </div>
            <Button variant="outline" className="mt-4 md:mt-0">
              <Download className="w-4 h-4 mr-2" />
              Export History
            </Button>
          </div>

          {billingRecords.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Billing History</h3>
              <p className="text-gray-600">Your billing history will appear here once available.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {billingRecords.map((record) => {
                    const StatusIcon = getStatusIcon(record.status);
                    return (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {record.invoice_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${record.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(record.due_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(record.paid_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center w-fit space-x-1 ${getStatusColor(record.status)}`}>
                            <StatusIcon />
                            <span>{record.status.charAt(0).toUpperCase() + record.status.slice(1)}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDownloadInvoice(record.invoice_url, record.invoice_number)}
                              disabled={!record.invoice_url}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Invoice
                            </Button>
                            {record.status === 'pending' && (
                              <Button size="sm">
                                Pay Now
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

      {/* Payment Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Payment Information</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Next Payment</h4>
              <p className="text-blue-900 text-lg font-semibold">July 15, 2025</p>
              <p className="text-blue-800">$349.00 monthly contribution</p>
              {defaultPaymentMethod && (
                <p className="text-sm text-blue-700 mt-1">
                  Will be charged to {getPaymentMethodDisplay(defaultPaymentMethod)}
                </p>
              )}
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Payment Questions?</h4>
              <p className="text-blue-800 text-sm mb-3">
                If you have any questions about your billing or need to update your payment information, our support team is here to help.
              </p>
              <Button variant="outline" size="sm" className="bg-white">
                Contact Support
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};