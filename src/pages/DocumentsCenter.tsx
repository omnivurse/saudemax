import React, { useState } from 'react';
import { useAuth } from '../components/auth/AuthProvider';
import { DocumentsModule } from '../components/member/DocumentsModule';
import { MemberPageLayout } from '../components/layout/MemberPageLayout';

export const DocumentsCenter: React.FC = () => {
  const { user } = useAuth();

  return (
    <MemberPageLayout
      title="Documents Center"
      description="Access and manage your important documents"
    >
      <DocumentsModule />
    </MemberPageLayout>
  );
};