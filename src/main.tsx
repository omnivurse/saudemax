import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './components/auth/AuthProvider';
import { AffiliateSecurityProvider } from './components/affiliate/AffiliateSecurityProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AffiliateSecurityProvider>
        <App />
      </AffiliateSecurityProvider>
    </AuthProvider>
  </StrictMode>
);