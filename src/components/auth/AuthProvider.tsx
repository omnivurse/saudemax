import React, { createContext, useContext } from 'react';
import { AuthContextType, useAuthProvider } from '../../hooks/useAuth';
import { logAuditEvent } from '../../lib/logAuditEvent';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuthProvider();
  
  // Wrap the original login and logout methods to add audit logging
  const authWithAuditLogging = {
    ...auth,
    login: async (email: string, password: string) => {
      try {
        // First perform the login
        await auth.login(email, password);
        
        // Then log the successful login
        try {
          await logAuditEvent('login', { email }, getClientIP());
        } catch (logError) {
          console.error('Failed to log login event:', logError);
          // Don't fail the login if logging fails
        }
      } catch (error) {
        // Try to log the failed login attempt
        try {
          await logAuditEvent('login_failed', { 
            email, 
            error: (error as Error).message 
          }, getClientIP());
        } catch (logError) {
          console.error('Failed to log login failure:', logError);
        }
        
        // Re-throw the original error
        throw error;
      }
    },
    logout: async () => {
      try {
        // Try to log the logout event before actually logging out
        try {
          await logAuditEvent('logout', {}, getClientIP());
        } catch (logError) {
          console.error('Failed to log logout event:', logError);
          // Continue with logout even if logging fails
        }
        
        // Perform the actual logout
        await auth.logout();
      } catch (error) {
        console.error('Logout error:', error);
        // Still attempt to logout even if audit logging fails
        await auth.logout();
        throw error;
      }
    }
  };

  return (
    <AuthContext.Provider value={authWithAuditLogging}>
      {children}
    </AuthContext.Provider>
  );
};

// Helper function to get client IP (this will be replaced by the actual IP on the server)
function getClientIP(): string {
  return '127.0.0.1'; // Placeholder - in a real app, this would be captured server-side
}