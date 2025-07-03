import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  })
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  }
})

// Test connection function
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    console.log('Supabase connection test successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test error:', error);
    return false;
  }
};

// Helper function to check if user has a specific role
export const hasRole = async (role: string | string[]): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;
    
    // First check app_metadata (server-controlled)
    let userRole = user.app_metadata?.role;
    
    // If not found, check user_metadata (less secure)
    if (!userRole) {
      userRole = user.user_metadata?.role;
    }
    
    // If still not found, check the users table
    if (!userRole) {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (!error && data) {
        userRole = data.role;
      }
    }
    
    // If still no role found, return false
    if (!userRole) return false;
    
    if (Array.isArray(role)) {
      return role.includes(userRole);
    }
    
    return userRole === role;
  } catch (error) {
    console.error('Error checking role:', error);
    return false;
  }
}

// Helper function to check if user has permission for a resource
export const hasPermission = async (resource: string, permission: string): Promise<boolean> => {
  try {
    // First check if user is admin (admins have all permissions)
    const isAdmin = await hasRole('admin');
    if (isAdmin) return true;
    
    // Otherwise check specific permission
    const { data, error } = await supabase.rpc('check_permission', {
      resource,
      action: permission
    });
    
    if (error) {
      console.error('Error checking permission:', error);
      return false;
    }
    
    return data || false;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

export type Database = {
  public: {
    Tables: {
      member_profiles: {
        Row: {
          id: string
          user_id: string
          member_number: string
          plan_id: string
          plan_name: string
          plan_type: 'individual' | 'family'
          status: 'active' | 'pending' | 'suspended' | 'cancelled'
          enrollment_date: string
          next_billing_date: string
          monthly_contribution: number
          advisor_id: string | null
          emergency_contact: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          member_number: string
          plan_id: string
          plan_name: string
          plan_type: 'individual' | 'family'
          status?: 'active' | 'pending' | 'suspended' | 'cancelled'
          enrollment_date: string
          next_billing_date: string
          monthly_contribution: number
          advisor_id?: string | null
          emergency_contact?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          member_number?: string
          plan_id?: string
          plan_name?: string
          plan_type?: 'individual' | 'family'
          status?: 'active' | 'pending' | 'suspended' | 'cancelled'
          enrollment_date?: string
          next_billing_date?: string
          monthly_contribution?: number
          advisor_id?: string | null
          emergency_contact?: any
          created_at?: string
          updated_at?: string
        }
      },
      roles: {
        Row: {
          id: string
          role: 'admin' | 'affiliate' | 'member' | 'advisor' | 'agent'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role: 'admin' | 'affiliate' | 'member' | 'advisor' | 'agent'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'admin' | 'affiliate' | 'member' | 'advisor' | 'agent'
          created_at?: string
          updated_at?: string
        }
      },
      role_permissions: {
        Row: {
          id: string
          role: 'admin' | 'affiliate' | 'member' | 'advisor' | 'agent'
          resource: string
          permission: 'read' | 'write' | 'delete' | 'all'
          created_at: string
        }
        Insert: {
          id?: string
          role: 'admin' | 'affiliate' | 'member' | 'advisor' | 'agent'
          resource: string
          permission: 'read' | 'write' | 'delete' | 'all'
          created_at?: string
        }
        Update: {
          id?: string
          role?: 'admin' | 'affiliate' | 'member' | 'advisor' | 'agent'
          resource?: string
          permission?: 'read' | 'write' | 'delete' | 'all'
          created_at?: string
        }
      }
    }
    Functions: {
      has_role: {
        Args: {
          required_role: string
        }
        Returns: boolean
      }
      has_permission: {
        Args: {
          resource: string
          required_permission: string
        }
        Returns: boolean
      }
      current_user_role: {
        Args: Record<string, never>
        Returns: string
      }
      assign_role: {
        Args: {
          user_id: string
          new_role: string
        }
        Returns: undefined
      }
      get_user_permissions: {
        Args: Record<string, never>
        Returns: {
          resource: string
          permission: string
        }[]
      }
      check_permission: {
        Args: {
          resource: string
          action: string
        }
        Returns: boolean
      }
    }
  }
}