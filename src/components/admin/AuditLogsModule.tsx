import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  User, 
  Filter, 
  Search, 
  Download, 
  Calendar, 
  RefreshCw,
  AlertTriangle,
  Eye,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { format, subDays } from 'date-fns';

interface AuditLog {
  id: string;
  user_id: string | null;
  email: string | null;
  role: string | null;
  action: string;
  context: any;
  ip_address: string | null;
  created_at: string;
}

export const AuditLogsModule: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7' | '30' | '90' | 'all'>('30');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [uniqueActions, setUniqueActions] = useState<string[]>([]);
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchAuditLogs();
  }, [dateRange]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range
      let startDate: string | null = null;
      const now = new Date();
      
      if (dateRange !== 'all') {
        const days = parseInt(dateRange);
        startDate = subDays(now, days).toISOString();
      }

      // Fetch audit logs
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setLogs(data || []);
      setFilteredLogs(data || []);

      // Extract unique actions for filter dropdown
      const actions = [...new Set((data || []).map(log => log.action))];
      setUniqueActions(actions);
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Apply filters
    let filtered = [...logs];
    
    // Filter by action
    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter);
    }
    
    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(log => log.role === roleFilter);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        (log.email?.toLowerCase().includes(term)) || 
        log.action.toLowerCase().includes(term) || 
        JSON.stringify(log.context).toLowerCase().includes(term)
      );
    }
    
    setFilteredLogs(filtered);
  }, [logs, actionFilter, roleFilter, searchTerm]);

  const toggleLogExpansion = (id: string) => {
    setExpandedLogs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const exportLogs = () => {
    // Create CSV content
    const headers = ['Timestamp', 'User Email', 'Role', 'Action', 'Context', 'IP Address'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log.email || '',
        log.role || '',
        log.action,
        `"${JSON.stringify(log.context).replace(/"/g, '""')}"`,
        log.ip_address || ''
      ].join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatContext = (context: any): string => {
    if (!context || Object.keys(context).length === 0) {
      return 'No additional context';
    }
    
    try {
      return JSON.stringify(context, null, 2);
    } catch (e) {
      return String(context);
    }
  };

  const getActionColor = (action: string): string => {
    if (action.includes('login') || action.includes('logout')) {
      return 'bg-blue-100 text-blue-800';
    } else if (action.includes('create') || action.includes('add')) {
      return 'bg-green-100 text-green-800';
    } else if (action.includes('update') || action.includes('change')) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (action.includes('delete') || action.includes('remove')) {
      return 'bg-red-100 text-red-800';
    } else if (action.includes('view') || action.includes('read')) {
      return 'bg-purple-100 text-purple-800';
    } else if (action.includes('impersonation')) {
      return 'bg-orange-100 text-orange-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Audit Logs</h2>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setDateRange('7')}
            className={dateRange === '7' ? 'bg-blue-50 border-blue-200' : ''}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Last 7 Days
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setDateRange('30')}
            className={dateRange === '30' ? 'bg-blue-50 border-blue-200' : ''}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Last 30 Days
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setDateRange('90')}
            className={dateRange === '90' ? 'bg-blue-50 border-blue-200' : ''}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Last 90 Days
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setDateRange('all')}
            className={dateRange === 'all' ? 'bg-blue-50 border-blue-200' : ''}
          >
            <Calendar className="w-4 h-4 mr-2" />
            All Time
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={exportLogs}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchAuditLogs}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full md:w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="agent">Agent</option>
              <option value="advisor">Advisor</option>
              <option value="affiliate">Affiliate</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Audit Logs */}
      <Card>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FileText className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Audit Logs Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || actionFilter !== 'all' || roleFilter !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'No audit logs have been recorded yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {log.email || 'System'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {log.user_id ? `ID: ${log.user_id.substring(0, 8)}...` : 'No user ID'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {log.role || 'System'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ip_address || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => toggleLogExpansion(log.id)}
                        >
                          {expandedLogs[log.id] ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                    {expandedLogs[log.id] && (
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <h4 className="font-medium mb-2">Context Details:</h4>
                            <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                              {formatContext(log.context)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Audit Log Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Audit Log Guide</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Common Actions</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• <strong>login</strong> - User logged in</li>
                <li>• <strong>logout</strong> - User logged out</li>
                <li>• <strong>plan_updated</strong> - Member plan was changed</li>
                <li>• <strong>profile_updated</strong> - User profile was updated</li>
                <li>• <strong>withdrawal_requested</strong> - Withdrawal request submitted</li>
                <li>• <strong>commission_paid</strong> - Commission payment processed</li>
                <li>• <strong>impersonation_started</strong> - Admin started impersonating a user</li>
                <li>• <strong>impersonation_ended</strong> - Admin stopped impersonating a user</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Compliance Notes</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Audit logs are retained for compliance purposes</li>
                <li>• IP addresses are stored for security tracking</li>
                <li>• Context data provides detailed information about actions</li>
                <li>• Users can only see their own logs</li>
                <li>• Admins can see and export all logs</li>
                <li>• All impersonation sessions are fully logged</li>
                <li>• HIPAA compliant audit trail maintained</li>
              </ul>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};