import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserCheck, 
  DollarSign, 
  TrendingUp,
  Download,
  Filter,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Activity,
  CreditCard,
  MessageCircle,
  Settings
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { UserRoleManager } from '../components/admin/UserRoleManager';
import { useAuth } from '../components/auth/AuthProvider';
import { RoleBasedContent } from '../components/ui/RoleBasedContent';
import { Link } from 'react-router-dom';
import { GrowthMetricsModule } from '../components/admin/GrowthMetricsModule';
import { ConversionFunnelModule } from '../components/admin/ConversionFunnelModule';
import { PlanEngagementModule } from '../components/admin/PlanEngagementModule';
import { ExportToolsModule } from '../components/admin/ExportToolsModule';

interface Member {
  id: string;
  name: string;
  plan: string;
  status: 'Active' | 'Inactive';
}

interface Claim {
  id: string;
  member: string;
  status: 'Active' | 'Pending' | 'Denied';
  type: string;
}

const mockMembers: Member[] = [
  { id: '1', name: 'John Jones', plan: 'Basic', status: 'Active' },
  { id: '2', name: 'Jose Diaz', plan: 'Premium', status: 'Active' },
];

const mockClaims: Claim[] = [
  { id: '1354', member: 'James Smith', status: 'Active', type: 'Medical' },
  { id: '2588', member: 'Sarah Johnson', status: 'Active', type: 'Dental' },
];

export const AdminDashboard: React.FC = () => {
  const { user, checkRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'claims' | 'roles' | 'commission' | 'growth' | 'conversion' | 'plan-engagement' | 'export'>('overview');

  const overviewStats = [
    {
      title: 'Total Members',
      value: '1,250',
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Pending Claims',
      value: '15',
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10'
    },
    {
      title: 'Active Advisors',
      value: '50',
      icon: UserCheck,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    }
  ];

  // Redirect non-admin users
  if (!checkRole('admin')) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="text-center p-8">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You don't have permission to access the admin dashboard.</p>
            <Button onClick={() => window.location.href = '/'}>
              Return to Homepage
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header with Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {overviewStats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-slate-700 rounded-xl p-6 border border-slate-600"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">{stat.title}</p>
                  <p className="text-white text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-700 rounded-xl border border-slate-600 p-4">
          <div className="flex space-x-4 overflow-x-auto">
            {[
              { key: 'overview', label: 'Overview', icon: Activity },
              { key: 'growth', label: 'Growth Metrics', icon: TrendingUp },
              { key: 'conversion', label: 'Conversion Funnel', icon: Filter },
              { key: 'plan-engagement', label: 'Plan Engagement', icon: Users },
              { key: 'export', label: 'Export Tools', icon: Download },
              { key: 'members', label: 'Members', icon: Users },
              { key: 'claims', label: 'Claims', icon: FileText },
              { key: 'roles', label: 'User Roles', icon: Settings },
              { key: 'commission', label: 'Commission Rules', icon: DollarSign }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-600 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Members Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-slate-700 rounded-xl border border-slate-600"
            >
              <div className="p-6 border-b border-slate-600">
                <h3 className="text-xl font-semibold text-white">Recent Members</h3>
              </div>
              
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Name</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Plan</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockMembers.map((member) => (
                        <tr key={member.id} className="border-b border-slate-600/50">
                          <td className="py-4 px-4 text-white">{member.name}</td>
                          <td className="py-4 px-4 text-slate-300">{member.plan}</td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              member.status === 'Active' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {member.status}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex space-x-2">
                              <Button size="sm" variant="ghost" className="text-slate-300 hover:text-white">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-slate-300 hover:text-white">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>

            {/* Claims Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-slate-700 rounded-xl border border-slate-600"
            >
              <div className="p-6 border-b border-slate-600">
                <h3 className="text-xl font-semibold text-white">Recent Claims</h3>
              </div>
              
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">ID</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Member</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockClaims.map((claim) => (
                        <tr key={claim.id} className="border-b border-slate-600/50">
                          <td className="py-4 px-4 text-white">{claim.id}</td>
                          <td className="py-4 px-4 text-slate-300">{claim.member}</td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              claim.status === 'Active' 
                                ? 'bg-green-500/20 text-green-400' 
                                : claim.status === 'Pending'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {claim.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-slate-300">{claim.type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {activeTab === 'growth' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <GrowthMetricsModule />
          </motion.div>
        )}

        {activeTab === 'conversion' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <ConversionFunnelModule />
          </motion.div>
        )}

        {activeTab === 'plan-engagement' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <PlanEngagementModule />
          </motion.div>
        )}

        {activeTab === 'export' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <ExportToolsModule />
          </motion.div>
        )}

        {activeTab === 'roles' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <RoleBasedContent allowedRoles={['admin']}>
              <UserRoleManager />
            </RoleBasedContent>
          </motion.div>
        )}

        {activeTab === 'commission' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="p-6">
              <div className="text-center py-8">
                <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Commission Rules Management</h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Define how affiliate agents earn commissions with flexible rule types including flat amounts, percentages, and tiered structures.
                </p>
                <Link to="/admin/commission-rules">
                  <Button size="lg">
                    Go to Commission Rules
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};