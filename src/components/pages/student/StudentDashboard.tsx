import React from 'react';
import PageLayout from '../../ui/PageLayout';
import StudentDashboard from '../../student/StudentDashboard';

const StudentDashboardPage: React.FC = () => {
  const breadcrumbs = [
    { label: 'Dashboard' }
  ];

  return (
    <PageLayout
      title=""
      breadcrumbs={breadcrumbs}
    >
      <StudentDashboard />
    </PageLayout>
  );
};

export default StudentDashboardPage;