import React, { useState } from 'react';
import { useAuth } from '../components/auth/AuthProvider';
import { BillingModule } from '../components/member/BillingModule';
import { MemberPageLayout } from '../components/layout/MemberPageLayout';

export const BillingHistory: React.FC = () => {
  const { user } = useAuth();

  return (
    <MemberPageLayout
      title="Billing & Payments"
      description="Manage your payment methods and view billing history"
    >
      <BillingModule />
    </MemberPageLayout>
  );
};