import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, Activity, CreditCard, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthProvider';
import { Sidebar } from '../components/ui/Sidebar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { MyPlan } from '../components/member/MyPlan';

export const MemberDashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Mobile Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar isMobile onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
        <div className="h-full sticky top-0">
          <Sidebar />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            <div className="w-5"></div> {/* Spacer for centering */}
          </div>
        </div>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Desktop Header */}
            <div className="hidden lg:block mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name || 'Member'}</h1>
              <p className="text-gray-600">Here's your SaudeMAX member overview</p>
            </div>

            {/* Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Plan Summary Card - Now using MyPlan component */}
              <div className="lg:col-span-2">
                <MyPlan />
              </div>

              {/* Share Requests Card */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Share Requests</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending</span>
                    <span className="font-semibold text-gray-900">2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Approved</span>
                    <span className="font-semibold text-gray-900">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Shared</span>
                    <span className="font-semibold text-green-600">$12,450</span>
                  </div>
                  <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/member/share-requests')}>
                    View All Requests
                  </Button>
                </div>
              </Card>

              {/* Upcoming Payment Card */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Payment</h2>
                <div className="space-y-2">
                  <p className="text-gray-600">Next Billing Date</p>
                  <p className="text-xl font-semibold text-gray-900">July 15, 2025</p>
                  <p className="text-gray-600">Amount: $349.00</p>
                  <Button className="w-full mt-4">
                    Make Payment
                  </Button>
                </div>
              </Card>

              {/* Recent Activity Card */}
              <Card className="p-6 lg:col-span-3">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Share Request Approved</p>
                      <p className="text-sm text-gray-600">Your request #SR-2025-001 for $1,250 was approved</p>
                    </div>
                    <p className="text-sm text-gray-500">June 12, 2025</p>
                  </div>
                  
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                      <CreditCard className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Payment Processed</p>
                      <p className="text-sm text-gray-600">Monthly contribution of $349 was processed successfully</p>
                    </div>
                    <p className="text-sm text-gray-500">June 1, 2025</p>
                  </div>
                  
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Document Added</p>
                      <p className="text-sm text-gray-600">New ID card has been added to your documents</p>
                    </div>
                    <p className="text-sm text-gray-500">May 28, 2025</p>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};