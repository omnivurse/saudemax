import React from 'react';
import { AffiliateDashboard } from './AffiliateDashboard';

// This component is a wrapper around AffiliateDashboard
// We're keeping this file for backward compatibility
// The advisor and affiliate dashboards have been consolidated
export const AdvisorDashboard: React.FC = () => {
  return <AffiliateDashboard />;
};

export default AdvisorDashboard;