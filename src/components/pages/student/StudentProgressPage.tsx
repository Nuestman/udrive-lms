import React from 'react';
import PageLayout from '../../ui/PageLayout';
import ProgressTracking from '../../student/ProgressTracking';

const StudentProgressPage: React.FC = () => {
  const breadcrumbs = [
    { label: 'My Progress' }
  ];

  return (
    <PageLayout
      title="My Progress"
      description="Track your learning journey and achievements"
      breadcrumbs={breadcrumbs}
    >
      <ProgressTracking studentId="current-student" />
    </PageLayout>
  );
};

export default StudentProgressPage;