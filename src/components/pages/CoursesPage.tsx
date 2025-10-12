import React from 'react';
import PageLayout from '../ui/PageLayout';
import { BookOpen, Plus, Search, Filter } from 'lucide-react';

interface CoursesPageProps {
  role: 'school_admin' | 'instructor' | 'student';
}

const CoursesPage: React.FC<CoursesPageProps> = ({ role }) => {
  const breadcrumbs = [
    { label: 'Courses' }
  ];

  const sampleCourses = [
    {
      id: '1',
      title: 'Basic Driving Course',
      description: 'Learn the fundamentals of safe driving',
      instructor: 'John Smith',
      students: 15,
      duration: '6 weeks',
      status: 'active'
    },
    {
      id: '2',
      title: 'Advanced Defensive Driving',
      description: 'Master advanced driving techniques',
      instructor: 'Sarah Wilson',
      students: 12,
      duration: '4 weeks',
      status: 'active'
    }
  ];

  const actions = role === 'school_admin' ? (
    <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
      <Plus size={20} className="mr-2" />
      Add Course
    </button>
  ) : null;

  return (
    <PageLayout
      title={role === 'student' ? 'My Courses' : 'Courses'}
      description={
        role === 'student' 
          ? 'Access your enrolled courses and track your progress'
          : 'Manage courses and curriculum'
      }
      breadcrumbs={breadcrumbs}
      actions={actions}
    >
      <div className="space-y-6">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search courses..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center">
              <Filter className="text-gray-400 mr-2" size={20} />
              <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option>All Courses</option>
                <option>Active</option>
                <option>Completed</option>
                <option>Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleCourses.map((course) => (
            <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-primary-600" />
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {course.status}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
              <p className="text-gray-600 mb-4">{course.description}</p>
              
              <div className="space-y-2 text-sm text-gray-500">
                <div>Instructor: {course.instructor}</div>
                <div>Students: {course.students}</div>
                <div>Duration: {course.duration}</div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  {role === 'student' ? 'Continue Learning' : 'Manage Course'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
};

export default CoursesPage;