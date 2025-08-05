import React, { useState } from 'react';
import { useAuth } from '../components/auth/AuthProvider';
import { SupportMessagesModule } from '../components/member/SupportMessagesModule';
import { MemberPageLayout } from '../components/layout/MemberPageLayout';

export const SupportPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <MemberPageLayout
      title="Support Center"
      description="Get help from our support team"
    >
      <SupportMessagesModule />
    </MemberPageLayout>
  );
};