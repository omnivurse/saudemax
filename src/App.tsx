import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AffiliateTracker } from './components/affiliate/AffiliateTracker';
import { WhatsAppChatButton } from './components/ui/WhatsAppChatButton';
import { HomePage } from './pages/HomePage';
import { PlanComparison } from './pages/PlanComparison';
import { RulesPage } from './pages/RulesPage';
import { ContactPage } from './pages/ContactPage';
import { AboutPage } from './pages/AboutPage';
import { EnrollmentWizard } from './pages/EnrollmentWizard';
import { PaymentPage } from './pages/PaymentPage';
import { LoginPage } from './pages/LoginPage';
import { AdvisorDashboard } from './pages/AdvisorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminWithdrawalQueue } from './pages/AdminWithdrawalQueue';
import { AdminLeaderboard } from './pages/AdminLeaderboard';
import { AdminAutomationDashboard } from './pages/AdminAutomationDashboard';
import { CommissionRules } from './pages/CommissionRules';
import { PublicLeaderboard } from './pages/PublicLeaderboard';
import { MemberDashboard } from './pages/MemberDashboard';
import { MemberPlanPage } from './pages/MemberPlanPage';
import { MemberShareRequestsPage } from './pages/MemberShareRequestsPage';
import { DocumentsCenter } from './pages/DocumentsCenter';
import { BillingHistory } from './pages/BillingHistory';
import { NotificationsPage } from './pages/NotificationsPage';
import { AccountSettings } from './pages/AccountSettings';
import { SupportPage } from './pages/SupportPage';
import { AffiliateRegister } from './pages/affiliate/AffiliateRegister';
import { AffiliateDashboard } from './pages/AffiliateDashboard';
import { AdminAuditLogs } from './pages/AdminAuditLogs';
import { ImpersonationBanner } from './components/admin/ImpersonationBanner';
import AdminImpersonation from './pages/AdminImpersonation';
import AdminEmailTemplates from './pages/AdminEmailTemplates';
import EmailConfirmed from './pages/affiliate/EmailConfirmed';
import CreateAffiliateUser from './pages/CreateAffiliateUser';
import { TestPage } from './pages/TestPage';
import './i18n';

function App() {
  return (
    <Router>
      <AffiliateTracker />
      <ImpersonationBanner />
      <div className="min-h-screen bg-white flex flex-col">
        <Routes>
          {/* Test Page */}
          <Route path="/test" element={<TestPage />} />
          
          {/* Login Routes */}
          <Route 
            path="/login" 
            element={
              <ProtectedRoute requireAuth={false}>
                <LoginPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/affiliate-login" 
            element={
              <ProtectedRoute requireAuth={false}>
                <LoginPage isAffiliateLogin={true} />
              </ProtectedRoute>
            } 
          />
          
          {/* Create Affiliate User Route */}
          <Route 
            path="/create-affiliate" 
            element={<CreateAffiliateUser />} 
          />
          
          {/* Email Confirmation Route */}
          <Route 
            path="/affiliate/confirm" 
            element={<EmailConfirmed />} 
          />
          
          {/* Public Routes with Header/Footer */}
          <Route path="/" element={
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">
                <HomePage />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/plans" element={
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">
                <PlanComparison />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/rules" element={
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">
                <RulesPage />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/about" element={
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">
                <AboutPage />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/contact" element={
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">
                <ContactPage />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/enrollment" element={
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">
                <EnrollmentWizard />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/payment" element={
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">
                <PaymentPage />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/leaderboard" element={
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">
                <PublicLeaderboard />
              </main>
              <Footer />
            </div>
          } />

          {/* Affiliate Routes */}
          <Route path="/affiliate/register" element={
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">
                <AffiliateRegister />
              </main>
              <Footer />
            </div>
          } />
          
          <Route path="/register" element={
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">
                <AffiliateRegister />
              </main>
              <Footer />
            </div>
          } />
          
          {/* Standardize on /affiliate for the affiliate dashboard */}
          <Route 
            path="/affiliate" 
            element={
              <ProtectedRoute allowedRoles={['affiliate', 'admin', 'agent']}>
                <AffiliateDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Redirect from old path to new standardized path */}
          <Route 
            path="/dashboard/affiliate" 
            element={
              <ProtectedRoute allowedRoles={['affiliate', 'admin', 'agent']}>
                <AffiliateDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Member Portal Routes */}
          <Route 
            path="/member/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['affiliate', 'admin', 'agent']}>
                <MemberDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/member/plan" 
            element={
              <ProtectedRoute allowedRoles={['member']}>
                <MemberPlanPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/member/share-requests" 
            element={
              <ProtectedRoute allowedRoles={['member']}>
                <MemberShareRequestsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/member/documents" 
            element={
              <ProtectedRoute allowedRoles={['member']}>
                <DocumentsCenter />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/member/billing" 
            element={
              <ProtectedRoute allowedRoles={['member']}>
                <BillingHistory />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/member/notifications" 
            element={
              <ProtectedRoute allowedRoles={['member']}>
                <NotificationsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/member/settings" 
            element={
              <ProtectedRoute allowedRoles={['member']}>
                <AccountSettings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/member/support" 
            element={
              <ProtectedRoute allowedRoles={['member']}>
                <SupportPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Advisor Routes */}
          <Route 
            path="/advisor" 
            element={
              <ProtectedRoute allowedRoles={['advisor']}>
                <AdvisorDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/withdrawals" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminWithdrawalQueue />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/leaderboard" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLeaderboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/automation" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminAutomationDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/commission-rules" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CommissionRules />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/audit-logs" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminAuditLogs />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/impersonation" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminImpersonation />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/email-templates" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminEmailTemplates />
              </ProtectedRoute>
            } 
          />
        </Routes>
        
        {/* WhatsApp Chat Button - appears on all pages */}
        <WhatsAppChatButton />
      </div>
    </Router>
  );
}

export default App;