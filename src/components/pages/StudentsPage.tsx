import React from 'react';
import PageLayout from '../ui/PageLayout';
import StudentManagement from '../student/StudentManagement';

interface StudentsPageProps {
  role: 'school_admin' | 'instructor';
}

const StudentsPage: React.FC<StudentsPageProps> = ({ role }) => {
  const breadcrumbs = [
    { label: 'Students' }
  ];

  return (
    <PageLayout
      title="Students"
      description="Manage student enrollments and track progress"
      breadcrumbs={breadcrumbs}
    >
      <StudentManagement role={role} />
    </PageLayout>
  );
};

export default StudentsPage;