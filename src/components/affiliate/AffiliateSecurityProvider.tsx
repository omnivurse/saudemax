import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../../lib/supabase';

interface AffiliateSecurityContextType {
  hasPermission: (resource: string, action: string) => boolean;
  isLoading: boolean;
  error: string | null;
}

const AffiliateSecurityContext = createContext<AffiliateSecurityContextType | undefined>(undefined);

export const useAffiliateSecurity = () => {
  const context = useContext(AffiliateSecurityContext);
  if (context === undefined) {
    throw new Error('useAffiliateSecurity must be used within an AffiliateSecurityProvider');
  }
  return context;
};

interface AffiliateSecurityProviderProps {
  children: React.ReactNode;
}

export const AffiliateSecurityProvider: React.FC<AffiliateSecurityProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      // Handle null user case
      if (!user) {
        setPermissions({});
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // First try to use the RPC function
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_permissions');
        
        if (!rpcError && rpcData) {
          // Organize permissions by resource
          const permissionsByResource: Record<string, string[]> = {};
          
          rpcData.forEach((item: { resource: string; permission: string }) => {
            if (!permissionsByResource[item.resource]) {
              permissionsByResource[item.resource] = [];
            }
            permissionsByResource[item.resource].push(item.permission);
          });
          
          setPermissions(permissionsByResource);
          setIsLoading(false);
          return;
        }

        // Fall back to direct query if RPC fails
        const { data, error: fetchError } = await supabase
          .from('role_permissions')
          .select('resource, permission')
          .eq('role', user.role);

        if (fetchError) {
          throw fetchError;
        }

        // Organize permissions by resource
        const permissionsByResource: Record<string, string[]> = {};
        
        (data || []).forEach((item: { resource: string; permission: string }) => {
          if (!permissionsByResource[item.resource]) {
            permissionsByResource[item.resource] = [];
          }
          permissionsByResource[item.resource].push(item.permission);
        });

        setPermissions(permissionsByResource);
      } catch (err: any) {
        console.error('Error fetching permissions:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, [user]);

  const hasPermission = (resource: string, action: string): boolean => {
    // If no user, no permissions
    if (!user) return false;
    
    // Admin role has all permissions
    if (user.role === 'admin') {
      return true;
    }

    // Check if user has the specific permission or 'all' permission
    const resourcePermissions = permissions[resource] || [];
    return resourcePermissions.includes(action) || resourcePermissions.includes('all');
  };

  return (
    <AffiliateSecurityContext.Provider value={{ hasPermission, isLoading, error }}>
      {children}
    </AffiliateSecurityContext.Provider>
  );
};