import { useState, useEffect } from 'react';
import { useAuth } from '../components/auth/AuthProvider';
import { supabase } from './supabase';

interface Permission {
  resource: string;
  permission: 'read' | 'write' | 'delete' | 'all';
}

export const useRolePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // First try to get permissions from RPC function
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_permissions');
        
        if (!rpcError && rpcData) {
          setPermissions(rpcData);
          setLoading(false);
          return;
        }
        
        // If RPC fails, fall back to direct query
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (roleError) {
          // If roles query fails, try to get role from users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
            
          if (userError) {
            throw new Error('Failed to get user role');
          }
          
          const userRole = userData.role;
          
          // Get permissions for this role
          const { data: permissionsData, error: permissionsError } = await supabase
            .from('role_permissions')
            .select('resource, permission')
            .eq('role', userRole);
            
          if (permissionsError) {
            throw permissionsError;
          }
          
          setPermissions(permissionsData || []);
        } else {
          const userRole = roleData.role;
          
          // Get permissions for this role
          const { data: permissionsData, error: permissionsError } = await supabase
            .from('role_permissions')
            .select('resource, permission')
            .eq('role', userRole);
            
          if (permissionsError) {
            throw permissionsError;
          }
          
          setPermissions(permissionsData || []);
        }
      } catch (err: any) {
        console.error('Error fetching permissions:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user]);

  const hasPermission = (resource: string, action: 'read' | 'write' | 'delete' | 'all'): boolean => {
    if (!user) return false;
    
    // Admins have all permissions
    if (user.role === 'admin') return true;
    
    // Check if user has the specific permission or 'all' permission
    return permissions.some(p => 
      p.resource === resource && (p.permission === action || p.permission === 'all')
    );
  };

  return {
    permissions,
    loading,
    error,
    hasPermission
  };
};