import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useAffiliate } from '../../hooks/useAffiliate';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { AlertTriangle, Shield, Lock } from 'lucide-react';

interface SecureAffiliateWrapperProps {
  children: React.ReactNode;
  requireActive?: boolean;
}

export const SecureAffiliateWrapper: React.FC<SecureAffiliateWrapperProps> = ({
  children,
  requireActive = true
}) => {
  const { user } = useAuth();
  const { affiliate, loading, error } = useAffiliate();
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessReason, setAccessReason] = useState<string>('');

  useEffect(() => {
    if (!loading) {
      // Check if user is logged in
      if (!user) {
        setAccessDenied(true);
        setAccessReason('authentication');
        return;
      }

      // Check if user has affiliate role
      if (user.role !== 'affiliate' && user.role !== 'admin') {
        setAccessDenied(true);
        setAccessReason('role');
        return;
      }

      // Admin bypass
      if (user.role === 'admin') {
        setAccessDenied(false);
        return;
      }

      // Check if affiliate profile exists
      if (!affiliate) {
        setAccessDenied(true);
        setAccessReason('profile');
        return;
      }

      // Check if affiliate is active (if required)
      if (requireActive && affiliate.status !== 'active') {
        setAccessDenied(true);
        setAccessReason('status');
        return;
      }

      // All checks passed
      setAccessDenied(false);
    }
  }, [user, affiliate, loading, requireActive]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="text-center p-8 max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  if (accessDenied) {
    let title = 'Access Denied';
    let message = 'You do not have permission to access this area.';
    let icon = <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />;
    let action = <Button onClick={() => window.location.href = '/'}>Return to Homepage</Button>;

    switch (accessReason) {
      case 'authentication':
        title = 'Login Required';
        message = 'You need to log in to access the affiliate dashboard.';
        action = <Button onClick={() => window.location.href = '/affiliate-login'}>Log In</Button>;
        break;
      case 'role':
        title = 'Affiliate Access Only';
        message = 'This area is restricted to affiliate users only.';
        break;
      case 'profile':
        title = 'No Affiliate Profile';
        message = 'You need to register as an affiliate to access this area.';
        action = <Button onClick={() => window.location.href = '/affiliate/register'}>Register as Affiliate</Button>;
        break;
      case 'status':
        title = 'Affiliate Status Pending';
        message = 'Your affiliate account is currently pending approval. Please check back later.';
        icon = <Lock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />;
        break;
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="text-center p-8 max-w-md">
          {icon}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          {action}
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};