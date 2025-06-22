import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  CreditCard, 
  AlertCircle,
  CheckCircle,
  Megaphone
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface NotificationPreferences {
  id: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  share_request_updates: boolean;
  billing_reminders: boolean;
  marketing_emails: boolean;
}

export const NotificationsModule: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [memberProfileId, setMemberProfileId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setLoading(true);
        setError(null);

        // First, get the member profile ID
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Use limit(1) instead of single() to avoid PGRST116 error
        const { data: profileData, error: profileError } = await supabase
          .from('member_profiles')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (profileError) {
          throw profileError;
        }

        if (!profileData || profileData.length === 0) {
          console.warn("No member profile found for user", user.id);
          throw new Error('Member profile not found');
        }

        const profileId = profileData[0].id;
        setMemberProfileId(profileId);

        // Fetch notification preferences
        const { data: preferencesData, error: preferencesError } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('member_profile_id', profileId)
          .limit(1);

        if (preferencesError) {
          throw preferencesError;
        }

        if (preferencesData && preferencesData.length > 0) {
          setPreferences(preferencesData[0]);
        } else {
          // If no preferences exist yet, create default ones
          await createDefaultPreferences(profileId);
        }
      } catch (err: any) {
        console.error('Error fetching notification preferences:', err);
        setError(err.message || 'Failed to load notification preferences');
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  const createDefaultPreferences = async (profileId: string) => {
    try {
      const defaultPreferences = {
        member_profile_id: profileId,
        email_notifications: true,
        sms_notifications: true,
        share_request_updates: true,
        billing_reminders: true,
        marketing_emails: false
      };

      const { data, error } = await supabase
        .from('notification_preferences')
        .insert(defaultPreferences)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setPreferences(data);
    } catch (err: any) {
      console.error('Error creating default preferences:', err);
      setError(err.message || 'Failed to create default notification preferences');
    }
  };

  const handleToggleChange = async (field: keyof NotificationPreferences, value: boolean) => {
    if (!preferences || !memberProfileId) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Update local state immediately for responsive UI
      setPreferences(prev => {
        if (!prev) return prev;
        return { ...prev, [field]: value };
      });

      // Update in database
      const { error } = await supabase
        .from('notification_preferences')
        .update({ [field]: value })
        .eq('member_profile_id', memberProfileId);

      if (error) {
        throw error;
      }

      setSuccess('Preferences updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error updating notification preferences:', err);
      setError(err.message || 'Failed to update notification preferences');
      
      // Revert local state on error
      setPreferences(prev => {
        if (!prev) return prev;
        return { ...prev, [field]: !value };
      });
    } finally {
      setSaving(false);
    }
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

  if (error && !preferences) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center h-40 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {error}
          </h3>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Try Again
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
            <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
            <p className="text-gray-600 mt-1">Manage how you receive updates and alerts</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <p>{success}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Email Notifications */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Email Notifications</h3>
                <p className="text-sm text-gray-600">Receive notifications via email</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences?.email_notifications || false}
                onChange={(e) => handleToggleChange('email_notifications', e.target.checked)}
                disabled={saving}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* SMS Notifications */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">SMS Notifications</h3>
                <p className="text-sm text-gray-600">Receive notifications via text message</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences?.sms_notifications || false}
                onChange={(e) => handleToggleChange('sms_notifications', e.target.checked)}
                disabled={saving}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Share Request Updates */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Bell className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Share Request Updates</h3>
                <p className="text-sm text-gray-600">Get notified about share request status changes</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences?.share_request_updates || false}
                onChange={(e) => handleToggleChange('share_request_updates', e.target.checked)}
                disabled={saving}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Billing Reminders */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-orange-700" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Billing Reminders</h3>
                <p className="text-sm text-gray-600">Receive reminders about upcoming payments</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences?.billing_reminders || false}
                onChange={(e) => handleToggleChange('billing_reminders', e.target.checked)}
                disabled={saving}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Marketing Emails */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Megaphone className="w-5 h-5 text-red-700" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Marketing Emails</h3>
                <p className="text-sm text-gray-600">Receive promotional emails and newsletters</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences?.marketing_emails || false}
                onChange={(e) => handleToggleChange('marketing_emails', e.target.checked)}
                disabled={saving}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <strong>Note:</strong> These preferences apply to all communications from SaudeMAX. 
            You will still receive important account notifications regardless of these settings.
          </p>
        </div>
      </Card>
    </motion.div>
  );
};