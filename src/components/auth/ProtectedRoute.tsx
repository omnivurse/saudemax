import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { User } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: User['role'][];
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = ['member', 'advisor', 'admin', 'affiliate'],
  requireAuth = true
}) => {
  const { user, loading, checkRole } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if authentication is required but user is not logged in
  if (requireAuth && !user) {
    // Redirect to affiliate login if trying to access affiliate routes
    if (location.pathname === '/affiliate' || location.pathname === '/dashboard/affiliate') {
      return <Navigate to="/affiliate-login" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to appropriate dashboard if user is logged in but accessing login page
  if (user && (location.pathname === '/login' || location.pathname === '/affiliate-login')) {
    // Get role from user metadata if available
    const role = user.role || user.user_metadata?.role;
    
    const redirectPath = 
      role === 'admin' ? '/admin' : 
      role === 'advisor' ? '/advisor' : 
      role === 'affiliate' ? '/affiliate' :
      '/member/dashboard';
    
    return <Navigate to={redirectPath} replace />;
  }

  // Check if user has required role
  if (user && !allowedRoles.some(role => {
    // Normal role check
    if (role === user.role) return true;
    
    // Special case: treat 'affiliate' as having 'affiliate' permissions
    if (role === 'affiliate' && user.role === 'affiliate') return true;
    
    return false;
  })) {
    // Get role from user metadata if available
    const role = user.role || user.user_metadata?.role;
    
    // Redirect to appropriate dashboard based on user role
    const redirectPath = 
      role === 'admin' ? '/admin' : 
      role === 'advisor' ? '/advisor' : 
      role === 'affiliate' ? '/affiliate' :
      '/member/dashboard';
    
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;