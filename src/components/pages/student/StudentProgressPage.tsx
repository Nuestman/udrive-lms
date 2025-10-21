import React from 'react';
import PageLayout from '../../ui/PageLayout';
import ProgressTracking from '../../student/ProgressTracking';
import { useAuth } from '../../../contexts/AuthContext';

const StudentProgressPage: React.FC = () => {
  const { profile } = useAuth();
  const breadcrumbs = [
    { label: 'My Progress' }
  ];

  if (!profile?.id) {
    return (
      <PageLayout
        title="My Progress"
        description="Track your learning journey and achievements"
        breadcrumbs={breadcrumbs}
      >
        <div className="text-center py-12">
          <p className="text-gray-500">Please log in to view your progress.</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="My Progress"
      description="Track your learning journey and achievements"
      breadcrumbs={breadcrumbs}
    >
      <ProgressTracking studentId={profile.id} />
    </PageLayout>
  );
};

export default StudentProgressPage;