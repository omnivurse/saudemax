import React from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { AuditLogsModule } from '../components/admin/AuditLogsModule';
import { useAuth } from '../components/auth/AuthProvider';
import { Card } from '../components/ui/Card';
import { AlertTriangle } from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const { user } = useAuth();

  // Only admins can access this page
  if (user?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="text-center p-8">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to view audit logs.</p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <AuditLogsModule />
      </div>
    </DashboardLayout>
  );
};