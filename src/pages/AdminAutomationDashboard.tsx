import React, { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { AffiliateAutomationDashboard } from '../components/admin/AffiliateAutomationDashboard';
import { DeploymentStatusWidget } from '../components/admin/DeploymentStatusWidget';
import { Card } from '../components/ui/Card';
import { motion } from 'framer-motion';
import { Settings, Users, DollarSign, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '../components/auth/AuthProvider';
import { AnimatePresence } from 'framer-motion';

export const AdminAutomationDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'affiliate' | 'billing' | 'system' | 'deployment'>('affiliate');

  // Only admins can access this dashboard
  if (user?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="text-center p-8">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You don't have permission to access the automation dashboard.</p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Automation Dashboard</h1>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { key: 'affiliate' as const, label: 'Affiliate System', icon: Users },
                  { key: 'billing' as const, label: 'Billing System', icon: DollarSign },
                  { key: 'system' as const, label: 'System Tasks', icon: Settings },
                  { key: 'deployment' as const, label: 'Deployment', icon: RefreshCw }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                        activeTab === tab.key
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'affiliate' && (
              <motion.div
                key="affiliate"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <AffiliateAutomationDashboard />
              </motion.div>
            )}
            
            {activeTab === 'billing' && (
              <motion.div
                key="billing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <div className="text-center py-12">
                    <RefreshCw className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Billing Automation Coming Soon</h3>
                    <p className="text-gray-600">
                      This section will include automation for billing reminders, payment processing, and invoice generation.
                    </p>
                  </div>
                </Card>
              </motion.div>
            )}
            
            {activeTab === 'system' && (
              <motion.div
                key="system"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <div className="text-center py-12">
                    <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">System Tasks Coming Soon</h3>
                    <p className="text-gray-600">
                      This section will include database maintenance, backup scheduling, and system health monitoring.
                    </p>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'deployment' && (
              <motion.div
                key="deployment"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DeploymentStatusWidget />
                  
                  <Card>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Deployment History</h3>
                      <div className="text-center py-8 text-gray-500">
                        <p>No recent deployments found</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};