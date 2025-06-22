import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  Users, 
  CreditCard, 
  DollarSign, 
  User,
  FileText,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Filter
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { format } from 'date-fns';

export const ExportToolsModule: React.FC = () => {
  const [loading, setLoading] = useState<{
    members: boolean;
    payments: boolean;
    affiliates: boolean;
    commissions: boolean;
  }>({
    members: false,
    payments: false,
    affiliates: false,
    commissions: false
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'all' | '30' | '90' | '180'>('all');

  // Helper function to convert JSON to CSV
  const convertToCSV = (data: any[], fields: string[]) => {
    // Create header row
    const header = fields.join(',');
    
    // Create data rows
    const rows = data.map(item => {
      return fields.map(field => {
        // Handle nested fields with dot notation
        const value = field.split('.').reduce((obj, key) => obj?.[key] ?? '', item);
        
        // Format dates if the value looks like a date
        if (value && typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
          try {
            return format(new Date(value), 'yyyy-MM-dd');
          } catch (e) {
            return value;
          }
        }
        
        // Escape commas and quotes in string values
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`;
        }
        
        return value ?? '';
      }).join(',');
    });
    
    // Combine header and rows
    return [header, ...rows].join('\n');
  };

  // Helper function to download CSV
  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get date filter based on timeframe
  const getDateFilter = () => {
    if (timeframe === 'all') return null;
    
    const now = new Date();
    let startDate: Date;
    
    switch (timeframe) {
      case '30':
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case '90':
        startDate = new Date(now.setDate(now.getDate() - 90));
        break;
      case '180':
        startDate = new Date(now.setDate(now.getDate() - 180));
        break;
      default:
        return null;
    }
    
    return startDate.toISOString();
  };

  // Export members data
  const exportMembers = async () => {
    setLoading(prev => ({ ...prev, members: true }));
    setError(null);
    setSuccess(null);
    
    try {
      let query = supabase
        .from('member_profiles')
        .select(`
          id,
          user_id,
          member_number,
          plan_id,
          plan_name,
          plan_type,
          status,
          enrollment_date,
          next_billing_date,
          monthly_contribution,
          users:user_id (
            email,
            full_name
          )
        `);
      
      // Apply date filter if selected
      const dateFilter = getDateFilter();
      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      if (!data || data.length === 0) {
        setError('No member data found');
        return;
      }
      
      // Define fields to include in CSV
      const fields = [
        'id',
        'member_number',
        'users.full_name',
        'users.email',
        'plan_name',
        'plan_type',
        'status',
        'enrollment_date',
        'next_billing_date',
        'monthly_contribution'
      ];
      
      // Convert to CSV
      const csv = convertToCSV(data, fields);
      
      // Download CSV
      downloadCSV(csv, `members-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      
      setSuccess('Members data exported successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error exporting members:', err);
      setError(err.message || 'Failed to export members data');
    } finally {
      setLoading(prev => ({ ...prev, members: false }));
    }
  };

  // Export payments data
  const exportPayments = async () => {
    setLoading(prev => ({ ...prev, payments: true }));
    setError(null);
    setSuccess(null);
    
    try {
      let query = supabase
        .from('billing_records')
        .select(`
          id,
          member_profile_id,
          invoice_number,
          amount,
          due_date,
          paid_date,
          status,
          payment_method,
          description,
          created_at,
          member_profiles:member_profile_id (
            member_number,
            users:user_id (
              email,
              full_name
            )
          )
        `);
      
      // Apply date filter if selected
      const dateFilter = getDateFilter();
      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      if (!data || data.length === 0) {
        setError('No payment data found');
        return;
      }
      
      // Define fields to include in CSV
      const fields = [
        'invoice_number',
        'member_profiles.member_number',
        'member_profiles.users.full_name',
        'member_profiles.users.email',
        'amount',
        'due_date',
        'paid_date',
        'status',
        'payment_method',
        'description',
        'created_at'
      ];
      
      // Convert to CSV
      const csv = convertToCSV(data, fields);
      
      // Download CSV
      downloadCSV(csv, `payments-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      
      setSuccess('Payments data exported successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error exporting payments:', err);
      setError(err.message || 'Failed to export payments data');
    } finally {
      setLoading(prev => ({ ...prev, payments: false }));
    }
  };

  // Export affiliates data
  const exportAffiliates = async () => {
    setLoading(prev => ({ ...prev, affiliates: true }));
    setError(null);
    setSuccess(null);
    
    try {
      let query = supabase
        .from('affiliates')
        .select(`
          id,
          affiliate_code,
          email,
          status,
          commission_rate,
          total_earnings,
          total_referrals,
          total_visits,
          payout_method,
          created_at,
          users:user_id (
            full_name
          )
        `);
      
      // Apply date filter if selected
      const dateFilter = getDateFilter();
      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      if (!data || data.length === 0) {
        setError('No affiliate data found');
        return;
      }
      
      // Define fields to include in CSV
      const fields = [
        'id',
        'affiliate_code',
        'users.full_name',
        'email',
        'status',
        'commission_rate',
        'total_earnings',
        'total_referrals',
        'total_visits',
        'payout_method',
        'created_at'
      ];
      
      // Convert to CSV
      const csv = convertToCSV(data, fields);
      
      // Download CSV
      downloadCSV(csv, `affiliates-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      
      setSuccess('Affiliates data exported successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error exporting affiliates:', err);
      setError(err.message || 'Failed to export affiliates data');
    } finally {
      setLoading(prev => ({ ...prev, affiliates: false }));
    }
  };

  // Export commissions data
  const exportCommissions = async () => {
    setLoading(prev => ({ ...prev, commissions: true }));
    setError(null);
    setSuccess(null);
    
    try {
      let query = supabase
        .from('agent_commissions')
        .select(`
          id,
          agent_id,
          member_id,
          amount,
          type,
          plan_code,
          status,
          payout_date,
          created_at,
          users:agent_id (
            email,
            full_name
          )
        `);
      
      // Apply date filter if selected
      const dateFilter = getDateFilter();
      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      if (!data || data.length === 0) {
        setError('No commission data found');
        return;
      }
      
      // Define fields to include in CSV
      const fields = [
        'id',
        'users.full_name',
        'users.email',
        'amount',
        'type',
        'plan_code',
        'status',
        'payout_date',
        'created_at'
      ];
      
      // Convert to CSV
      const csv = convertToCSV(data, fields);
      
      // Download CSV
      downloadCSV(csv, `commissions-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      
      setSuccess('Commissions data exported successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error exporting commissions:', err);
      setError(err.message || 'Failed to export commissions data');
    } finally {
      setLoading(prev => ({ ...prev, commissions: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Export Tools</h2>
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Time</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="180">Last 180 Days</option>
          </select>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
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

      {/* Export Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Members Export */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-6 h-full">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Members</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Download a CSV file containing all member profiles including plan details, status, and enrollment dates.
                </p>
                <Button 
                  onClick={exportMembers} 
                  loading={loading.members}
                  disabled={loading.members}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Members CSV
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Payments Export */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="p-6 h-full">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-green-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Payments</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Download a CSV file containing all billing records including invoice numbers, amounts, due dates, and payment status.
                </p>
                <Button 
                  onClick={exportPayments} 
                  loading={loading.payments}
                  disabled={loading.payments}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Payments CSV
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Affiliates Export */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-6 h-full">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <User className="w-6 h-6 text-purple-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Affiliates</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Download a CSV file containing all affiliate profiles including referral counts, earnings, and commission rates.
                </p>
                <Button 
                  onClick={exportAffiliates} 
                  loading={loading.affiliates}
                  disabled={loading.affiliates}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Affiliates CSV
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Commissions Export */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="p-6 h-full">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-yellow-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Commissions</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Download a CSV file containing all agent commissions including amounts, plan codes, types, and payout status.
                </p>
                <Button 
                  onClick={exportCommissions} 
                  loading={loading.commissions}
                  disabled={loading.commissions}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Commissions CSV
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Export Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Export Guide</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Export Format</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• All exports are in CSV format</li>
                <li>• UTF-8 encoding for international character support</li>
                <li>• First row contains column headers</li>
                <li>• Dates are in YYYY-MM-DD format</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Data Privacy</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Exports may contain sensitive information</li>
                <li>• Handle exported data according to privacy policies</li>
                <li>• Do not share exports with unauthorized parties</li>
                <li>• Delete exports when no longer needed</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-blue-800 text-sm">
              <strong>Need custom exports?</strong> Contact the development team for specialized data exports or automated reporting.
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};