import React from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useRolePermissions } from '../../lib/useRolePermissions';

interface RoleBasedContentProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  resource?: string;
  action?: 'read' | 'write' | 'delete' | 'all';
  fallback?: React.ReactNode;
}

export const RoleBasedContent: React.FC<RoleBasedContentProps> = ({
  children,
  allowedRoles,
  resource,
  action = 'read',
  fallback = null
}) => {
  const { user, checkRole } = useAuth();
  const { hasPermission } = useRolePermissions();

  // No user, don't render
  if (!user) return fallback;

  // Check roles if specified
  if (allowedRoles && !checkRole(allowedRoles)) {
    return fallback;
  }

  // Check permissions if specified
  if (resource && action && !hasPermission(resource, action)) {
    return fallback;
  }

  // All checks passed, render the content
  return <>{children}</>;
};