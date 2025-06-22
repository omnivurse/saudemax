import React, { useEffect } from 'react';
import { useAffiliate } from '../../hooks/useAffiliate';

export const AffiliateTracker: React.FC = () => {
  const { trackVisit } = useAffiliate();

  useEffect(() => {
    // Check for affiliate referral code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');

    if (refCode) {
      // Store in localStorage for persistence
      localStorage.setItem('affiliate_code', refCode);
      
      // Also set a cookie as fallback
      document.cookie = `affiliate_code=${refCode}; path=/; max-age=${30 * 24 * 60 * 60}`; // 30 days

      // Track the visit
      trackVisit(refCode, {
        page_url: window.location.href,
        referrer: document.referrer,
        user_agent: navigator.userAgent
      });

      // Clean URL by removing ref parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('ref');
      window.history.replaceState({}, document.title, newUrl.toString());
    }
  }, [trackVisit]);

  // This component doesn't render anything visible
  return null;
};