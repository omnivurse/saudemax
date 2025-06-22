import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthProvider';

export interface Affiliate {
  id: string;
  user_id: string;
  affiliate_code: string;
  referral_link: string;
  email: string;
  status: 'active' | 'pending' | 'suspended' | 'rejected';
  commission_rate: number;
  total_earnings: number;
  total_referrals: number;
  total_visits: number;
  payout_email?: string;
  payout_method: 'paypal' | 'bank_transfer' | 'crypto';
  created_at: string;
  updated_at: string;
}

export interface AffiliateReferral {
  id: string;
  affiliate_id: string;
  referred_user_id?: string;
  order_id?: string;
  order_amount?: number;
  commission_amount: number;
  commission_rate: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  conversion_type: 'signup' | 'purchase' | 'subscription';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AffiliateVisit {
  id: string;
  affiliate_id: string;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  page_url?: string;
  country?: string;
  device_type?: string;
  browser?: string;
  converted: boolean;
  created_at: string;
}

export interface AffiliateWithdrawal {
  id: string;
  affiliate_id: string;
  amount: number;
  method: string;
  payout_email?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transaction_id?: string;
  notes?: string;
  requested_at: string;
  processed_at?: string;
}

export interface AffiliateMetrics {
  totalEarnings: number;
  totalReferrals: number;
  totalVisits: number;
  conversionRate: number;
  pendingCommissions: number;
  thisMonthEarnings: number;
  thisMonthReferrals: number;
  thisMonthVisits: number;
}

// Helper function to get stored affiliate code from localStorage or cookies
export const getStoredAffiliateCode = (): string | null => {
  // First check localStorage
  const storedCode = localStorage.getItem('affiliate_code') || localStorage.getItem('affiliate_ref');
  if (storedCode) {
    return storedCode;
  }

  // Then check cookies
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'affiliate_code' || name === 'affiliate_ref') {
      return decodeURIComponent(value);
    }
  }

  return null;
};

export const useAffiliate = () => {
  const { user } = useAuth();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [metrics, setMetrics] = useState<AffiliateMetrics | null>(null);
  const [referrals, setReferrals] = useState<AffiliateReferral[]>([]);
  const [visits, setVisits] = useState<AffiliateVisit[]>([]);
  const [withdrawals, setWithdrawals] = useState<AffiliateWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch affiliate profile
  const fetchAffiliate = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      setAffiliate(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Fetch affiliate metrics
  const fetchMetrics = async () => {
    if (!affiliate) return;

    try {
      // Try to use the RPC function first
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_affiliate_stats', {
        affiliate_id: affiliate.id
      });
      
      if (!rpcError && rpcData) {
        setMetrics(rpcData);
        return;
      }
      
      // Fall back to manual calculation if RPC fails
      
      // Get referrals data
      const { data: referralsData, error: referralsError } = await supabase
        .from('affiliate_referrals')
        .select('*')
        .eq('affiliate_id', affiliate.id);

      if (referralsError) throw referralsError;

      // Get visits data
      const { data: visitsData, error: visitsError } = await supabase
        .from('affiliate_visits')
        .select('*')
        .eq('affiliate_id', affiliate.id);

      if (visitsError) throw visitsError;

      // Get withdrawals data
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('affiliate_withdrawals')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .order('requested_at', { ascending: false });

      if (withdrawalsError) throw withdrawalsError;

      // Calculate metrics
      const totalEarnings = referralsData
        .filter(r => r.status === 'approved' || r.status === 'paid')
        .reduce((sum, r) => sum + (r.commission_amount || 0), 0);

      const pendingCommissions = referralsData
        .filter(r => r.status === 'pending')
        .reduce((sum, r) => sum + (r.commission_amount || 0), 0);

      const totalVisits = visitsData.length;
      const totalReferrals = referralsData.length;
      const conversionRate = totalVisits > 0 ? (totalReferrals / totalVisits) * 100 : 0;

      // This month data
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const thisMonthReferrals = referralsData.filter(
        r => new Date(r.created_at) >= thisMonth
      ).length;

      const thisMonthVisits = visitsData.filter(
        v => new Date(v.created_at) >= thisMonth
      ).length;

      const thisMonthEarnings = referralsData
        .filter(r => 
          new Date(r.created_at) >= thisMonth && 
          (r.status === 'approved' || r.status === 'paid')
        )
        .reduce((sum, r) => sum + (r.commission_amount || 0), 0);

      setMetrics({
        totalEarnings,
        totalReferrals,
        totalVisits,
        conversionRate,
        pendingCommissions,
        thisMonthEarnings,
        thisMonthReferrals,
        thisMonthVisits
      });

      setReferrals(referralsData);
      setVisits(visitsData);
      setWithdrawals(withdrawalsData);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Register as affiliate
  const registerAffiliate = async (data: {
    email: string;
    payout_email: string;
    payout_method: 'paypal' | 'bank_transfer' | 'crypto';
  }) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Generate unique affiliate code
      const affiliateCode = `AF${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const referralLink = `${window.location.origin}?ref=${affiliateCode}`;

      const { data: affiliateData, error } = await supabase
        .from('affiliates')
        .insert({
          user_id: user.id,
          affiliate_code: affiliateCode,
          referral_link: referralLink,
          email: data.email,
          payout_email: data.payout_email,
          payout_method: data.payout_method,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Update user role to affiliate
      const { error: roleError } = await supabase
        .from('users')
        .update({ role: 'affiliate' })
        .eq('id', user.id);
        
      if (roleError) {
        console.warn('Failed to update user role:', roleError);
      }
      
      // Also update roles table if it exists
      const { error: rolesError } = await supabase
        .from('roles')
        .upsert({ 
          id: user.id, 
          role: 'affiliate',
          updated_at: new Date().toISOString()
        });
        
      if (rolesError) {
        console.warn('Failed to update roles table:', rolesError);
      }

      setAffiliate(affiliateData);
      return affiliateData;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Update affiliate profile
  const updateAffiliate = async (updates: Partial<Affiliate>) => {
    if (!affiliate) throw new Error('No affiliate profile found');

    try {
      const { data, error } = await supabase
        .from('affiliates')
        .update(updates)
        .eq('id', affiliate.id)
        .select()
        .single();

      if (error) throw error;

      setAffiliate(data);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Request withdrawal
  const requestWithdrawal = async (amount: number, method: string, payoutEmail: string) => {
    if (!affiliate) throw new Error('No affiliate profile found');

    try {
      const { data, error } = await supabase
        .from('affiliate_withdrawals')
        .insert({
          affiliate_id: affiliate.id,
          amount,
          method,
          payout_email: payoutEmail,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh withdrawals list
      await fetchMetrics();
      
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Track visit
  const trackVisit = async (affiliateCode: string, visitData: {
    page_url: string;
    referrer?: string;
    user_agent?: string;
  }) => {
    try {
      // Get affiliate by code
      const { data: affiliateData, error: affiliateError } = await supabase
        .from('affiliates')
        .select('id')
        .eq('affiliate_code', affiliateCode)
        .eq('status', 'active')
        .single();

      if (affiliateError || !affiliateData) return;

      // Track the visit
      const { error } = await supabase
        .from('affiliate_visits')
        .insert({
          affiliate_id: affiliateData.id,
          page_url: visitData.page_url,
          referrer: visitData.referrer,
          user_agent: visitData.user_agent,
          ip_address: null, // Will be set by server
          country: null, // Will be set by server
          device_type: /Mobile|Android|iPhone|iPad/.test(visitData.user_agent || '') ? 'mobile' : 'desktop',
          browser: getBrowserFromUserAgent(visitData.user_agent || '')
        });

      if (error) throw error;
    } catch (err: any) {
      console.error('Failed to track visit:', err);
    }
  };

  // Track referral
  const trackReferral = async (affiliateCode: string, referralData: {
    referred_user_id?: string;
    order_id?: string;
    order_amount?: number;
    conversion_type: 'signup' | 'purchase' | 'subscription';
  }) => {
    try {
      // Get affiliate by code
      const { data: affiliateData, error: affiliateError } = await supabase
        .from('affiliates')
        .select('*')
        .eq('affiliate_code', affiliateCode)
        .eq('status', 'active')
        .single();

      if (affiliateError || !affiliateData) return;

      // Calculate commission
      const commissionAmount = (referralData.order_amount || 0) * (affiliateData.commission_rate / 100);

      // Create referral
      const { data, error } = await supabase
        .from('affiliate_referrals')
        .insert({
          affiliate_id: affiliateData.id,
          referred_user_id: referralData.referred_user_id,
          order_id: referralData.order_id,
          order_amount: referralData.order_amount,
          commission_amount: commissionAmount,
          commission_rate: affiliateData.commission_rate,
          conversion_type: referralData.conversion_type,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err: any) {
      console.error('Failed to track referral:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchAffiliate();
    }
  }, [user]);

  useEffect(() => {
    if (affiliate) {
      fetchMetrics();
    }
  }, [affiliate]);

  useEffect(() => {
    setLoading(false);
  }, [affiliate, metrics]);

  return {
    affiliate,
    metrics,
    referrals,
    visits,
    withdrawals,
    loading,
    error,
    registerAffiliate,
    updateAffiliate,
    requestWithdrawal,
    trackVisit,
    trackReferral,
    refetch: () => {
      fetchAffiliate();
      if (affiliate) fetchMetrics();
    }
  };
};

// Helper function to detect browser from user agent
const getBrowserFromUserAgent = (userAgent: string): string => {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Other';
};