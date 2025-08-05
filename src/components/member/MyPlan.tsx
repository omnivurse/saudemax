import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { format } from 'date-fns';

interface MemberPlanData {
  id: string;
  plan_name: string;
  plan_type: 'individual' | 'family';
  status: 'active' | 'pending' | 'suspended' | 'cancelled';
  monthly_contribution: number;
  enrollment_date: string;
  plan_id?: string;
}

export const MyPlan: React.FC = () => {
  const [planData, setPlanData] = useState<MemberPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMemberPlan = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get the current user first
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.warn("No authenticated user found");
          setError("User not authenticated");
          setLoading(false);
          return;
        }

        console.log('Current user ID:', user.id);

        // Query member_profiles with the correct fields
        // Use limit(1) instead of single() to avoid PGRST116 error
        const { data, error: fetchError } = await supabase
          .from('member_profiles')
          .select('id, plan_name, plan_type, status, monthly_contribution, enrollment_date, plan_id')
          .eq('user_id', user.id)
          .limit(1);

        if (fetchError) {
          console.error('Supabase query error:', fetchError);
          setError('Failed to load plan data. Please try again later.');
          setLoading(false);
          return;
        }

        console.log('Member profile data:', data);

        // Check if we got any results
        if (!data || data.length === 0) {
          console.warn("No plan returned for user", user.id);
          setError('No plan found for your account.');
          setPlanData(null);
        } else {
          setPlanData(data[0]);
          setError(null);
        }
      } catch (err: any) {
        console.error('Error fetching member plan:', err);
        setError(err.message || 'Failed to load plan data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMemberPlan();
  }, []);

  // Get IUA level from plan_id if available
  const getIuaLevel = (planId?: string) => {
    if (!planId) return '1500'; // Default value
    
    // Extract numeric value from plan_id (e.g., "plan_1500" -> "1500")
    const match = planId.match(/\d+/);
    return match ? match[0] : '1500';
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
        </div>
      </Card>
    );
  }

  // If there's an error or no plan data, show a friendly message
  if (error || !planData) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center h-40 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {error || "No plan found for your account."}
          </h3>
          <Button variant="outline" size="sm">
            Contact Support
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{planData.plan_name}</h2>
            <div className="flex items-center mt-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(planData.status)}`}>
                {planData.status.charAt(0).toUpperCase() + planData.status.slice(1)}
              </span>
              <span className="ml-2 text-sm text-gray-600">
                {planData.plan_type.charAt(0).toUpperCase() + planData.plan_type.slice(1)} Plan
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-4 md:mt-0">
            View Guidelines
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Shield className="w-5 h-5 text-blue-700 mr-2" />
              <p className="text-sm font-medium text-blue-700">IUA Tier</p>
            </div>
            <p className="text-2xl font-bold text-blue-900">${getIuaLevel(planData.plan_id)}</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <DollarSign className="w-5 h-5 text-green-700 mr-2" />
              <p className="text-sm font-medium text-green-700">Monthly Contribution</p>
            </div>
            <p className="text-2xl font-bold text-green-900">${planData.monthly_contribution}</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Calendar className="w-5 h-5 text-purple-700 mr-2" />
              <p className="text-sm font-medium text-purple-700">Enrollment Date</p>
            </div>
            <p className="text-2xl font-bold text-purple-900">{formatDate(planData.enrollment_date)}</p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <Button>Submit Share Request</Button>
            <Button variant="outline">Download ID Card</Button>
            <Button variant="outline">Update Payment</Button>
            <Button variant="outline">Contact Advisor</Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};