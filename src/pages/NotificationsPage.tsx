import React, { useState } from 'react';
import { useAuth } from '../components/auth/AuthProvider';
import { NotificationsModule } from '../components/member/NotificationsModule';
import { MemberPageLayout } from '../components/layout/MemberPageLayout';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <MemberPageLayout
      title="Notification Settings"
      description="Manage your communication preferences"
    >
      <NotificationsModule />
    </MemberPageLayout>
  );
};