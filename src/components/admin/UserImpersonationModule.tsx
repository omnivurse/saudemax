import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Search, 
  UserCheck, 
  UserX, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { startImpersonation } from '../../lib/impersonation';
import { useNavigate } from 'react-router-dom';
import { logAuditEvent } from '../../lib/logAuditEvent';

interface UserData {
  id: string;
  email: string;
  full_name: string;
  role: string;
  last_login?: string;
  is_active: boolean;
}

interface ImpersonationSession {
  id: string;
  admin_id: string;
  target_user_id: string;
  target_role: string;
  started_at: string;
  ended_at: string | null;
  admin_email?: string;
  target_email?: string;
}

export const UserImpersonationModule: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [recentSessions, setRecentSessions] = useState<ImpersonationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [impersonating, setImpersonating] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
    fetchRecentSessions();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentSessions = async () => {
    try {
      setSessionLoading(true);

      const { data, error: fetchError } = await supabase
        .from('impersonation_sessions')
        .select(`
          *,
          admin:admin_id(email),
          target:target_user_id(email)
        `)
        .order('started_at', { ascending: false })
        .limit(10);

      if (fetchError) {
        throw fetchError;
      }

      // Transform data to include admin and target emails
      const transformedData = (data || []).map(session => ({
        ...session,
        admin_email: session.admin?.email,
        target_email: session.target?.email
      }));

      setRecentSessions(transformedData);
    } catch (err: any) {
      console.error('Error fetching impersonation sessions:', err);
    } finally {
      setSessionLoading(false);
    }
  };

  useEffect(() => {
    // Apply filters
    let filtered = [...users];
    
    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(term) || 
        (user.full_name && user.full_name.toLowerCase().includes(term))
      );
    }
    
    setFilteredUsers(filtered);
  }, [users, roleFilter, searchTerm]);

  const handleImpersonate = async (user: UserData) => {
    try {
      setImpersonating(true);
      setError(null);
      setSuccess(null);

      // Start impersonation
      const result = await startImpersonation(
        user.id,
        user.email,
        user.full_name || user.email
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      setSuccess(`Now impersonating ${user.full_name || user.email}`);

      // Log the impersonation
      await logAuditEvent('impersonation_started', {
        target_user_id: user.id,
        target_email: user.email,
        target_role: user.role
      });

      // Redirect to appropriate dashboard based on user role
      setTimeout(() => {
        const redirectPath = user.role === 'admin' ? '/admin' : 
                           user.role === 'advisor' ? '/advisor' : 
                           user.role === 'affiliate' ? '/dashboard/affiliate' :
                           user.role === 'agent' ? '/agent' :
                           '/member/dashboard';
        navigate(redirectPath);
      }, 1000);
    } catch (err: any) {
      console.error('Error starting impersonation:', err);
      setError(err.message || 'Failed to start impersonation');
    } finally {
      setImpersonating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">User Impersonation</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            fetchUsers();
            fetchRecentSessions();
          }}
        >
          <Clock className="w-4 h-4 mr-2" />
          Refresh
        </Button>
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

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full md:w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-4 w-full md:w-auto">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="member">Member</option>
              <option value="agent">Agent</option>
              <option value="advisor">Advisor</option>
              <option value="affiliate">Affiliate</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 p-6 border-b border-gray-200">Users</h3>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <User className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Users Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || roleFilter !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'No users have been created yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name || 'No Name'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'agent' ? 'bg-green-100 text-green-800' :
                        user.role === 'advisor' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'affiliate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button 
                        size="sm" 
                        onClick={() => handleImpersonate(user)}
                        loading={impersonating}
                        disabled={impersonating}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Impersonate
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Recent Impersonation Sessions */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 p-6 border-b border-gray-200">Recent Impersonation Sessions</h3>
        {sessionLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          </div>
        ) : recentSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <UserCheck className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Impersonation Sessions</h3>
            <p className="text-gray-600">No impersonation sessions have been recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Started At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ended At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.admin_email || session.admin_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.target_email || session.target_user_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        session.target_role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        session.target_role === 'agent' ? 'bg-green-100 text-green-800' :
                        session.target_role === 'advisor' ? 'bg-blue-100 text-blue-800' :
                        session.target_role === 'affiliate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {session.target_role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(session.started_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {session.ended_at ? new Date(session.ended_at).toLocaleString() : 'Active'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        session.ended_at ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {session.ended_at ? 'Ended' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Impersonation Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Impersonation Guide</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">How It Works</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Impersonation allows admins to view the application as another user</li>
                <li>• All actions performed while impersonating are logged</li>
                <li>• A yellow banner appears at the top of the screen during impersonation</li>
                <li>• Click "End Impersonation" to return to your admin account</li>
                <li>• Impersonation sessions automatically end when you log out</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Security & Compliance</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• All impersonation sessions are logged for audit purposes</li>
                <li>• HIPAA compliant - maintains audit trail of all access</li>
                <li>• Only admins can impersonate users</li>
                <li>• No password sharing or credential exposure</li>
                <li>• Secure, temporary access for troubleshooting</li>
              </ul>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};