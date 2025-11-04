import React, { useState } from 'react';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Search,
  Filter,
  Plus,
  UserCheck
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  instructor: string;
  capacity: number;
  enrolled: number;
  startDate: string;
  endDate: string;
  status: 'open' | 'closed' | 'full';
  price: number;
}

interface Enrollment {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  enrollmentDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  progress: number;
}

interface EnrollmentSystemProps {
  role: 'school_admin' | 'instructor' | 'student';
  userId?: string;
}

const EnrollmentSystem: React.FC<EnrollmentSystemProps> = ({ role, userId }) => {
  const [courses] = useState<Course[]>([
    {
      id: '1',
      title: 'Basic Driving Course',
      description: 'Learn the fundamentals of safe driving',
      duration: '6 weeks',
      instructor: 'John Smith',
      capacity: 20,
      enrolled: 15,
      startDate: '2024-04-01',
      endDate: '2024-05-15',
      status: 'open',
      price: 299
    },
    {
      id: '2',
      title: 'Advanced Defensive Driving',
      description: 'Master advanced driving techniques and safety',
      duration: '4 weeks',
      instructor: 'Sarah Wilson',
      capacity: 15,
      enrolled: 15,
      startDate: '2024-03-15',
      endDate: '2024-04-15',
      status: 'full',
      price: 399
    },
    {
      id: '3',
      title: 'Commercial Driver License Prep',
      description: 'Prepare for your CDL examination',
      duration: '8 weeks',
      instructor: 'Mike Johnson',
      capacity: 12,
      enrolled: 8,
      startDate: '2024-04-15',
      endDate: '2024-06-15',
      status: 'open',
      price: 599
    }
  ]);

  const [enrollments, setEnrollments] = useState<Enrollment[]>([
    {
      id: '1',
      studentId: '1',
      studentName: 'Sarah Johnson',
      courseId: '1',
      courseTitle: 'Basic Driving Course',
      enrollmentDate: '2024-03-01',
      status: 'approved',
      progress: 75
    },
    {
      id: '2',
      studentId: '2',
      studentName: 'Michael Chen',
      courseId: '2',
      courseTitle: 'Advanced Defensive Driving',
      enrollmentDate: '2024-02-15',
      status: 'completed',
      progress: 100
    },
    {
      id: '3',
      studentId: '3',
      studentName: 'Emily Rodriguez',
      courseId: '1',
      courseTitle: 'Basic Driving Course',
      enrollmentDate: '2024-03-10',
      status: 'pending',
      progress: 0
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('all');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'full':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-primary-100 text-primary-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <CheckCircle size={16} />;
      case 'rejected':
        return <XCircle size={16} />;
      case 'pending':
        return <AlertCircle size={16} />;
      default:
        return null;
    }
  };

  const handleEnroll = (courseId: string) => {
    const newEnrollment: Enrollment = {
      id: `enrollment-${Date.now()}`,
      studentId: userId || 'current-user',
      studentName: 'Current User',
      courseId,
      courseTitle: courses.find(c => c.id === courseId)?.title || '',
      enrollmentDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      progress: 0
    };
    
    setEnrollments([...enrollments, newEnrollment]);
  };

  const handleApproveEnrollment = (enrollmentId: string) => {
    setEnrollments(enrollments.map(e => 
      e.id === enrollmentId ? { ...e, status: 'approved' as const } : e
    ));
  };

  const handleRejectEnrollment = (enrollmentId: string) => {
    setEnrollments(enrollments.map(e => 
      e.id === enrollmentId ? { ...e, status: 'rejected' as const } : e
    ));
  };

  const filteredEnrollments = enrollments.filter(enrollment => {
    const matchesSearch = 
      enrollment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.courseTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || enrollment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const renderCourseCard = (course: Course) => (
    <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
          <p className="text-gray-600 mt-1">{course.description}</p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>
          {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Clock size={16} className="mr-2" />
          {course.duration}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Users size={16} className="mr-2" />
          {course.enrolled}/{course.capacity} enrolled
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Calendar size={16} className="mr-2" />
          {new Date(course.startDate).toLocaleDateString()}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <UserCheck size={16} className="mr-2" />
          {course.instructor}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold text-gray-900">
          ${course.price}
        </div>
        {role === 'student' && (
          <button
            onClick={() => handleEnroll(course.id)}
            disabled={course.status !== 'open'}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              course.status === 'open'
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {course.status === 'full' ? 'Full' : course.status === 'closed' ? 'Closed' : 'Enroll'}
          </button>
        )}
        {(role === 'school_admin' || role === 'instructor') && (
          <button
            onClick={() => setSelectedCourse(course)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            View Details
          </button>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span>Enrollment Progress</span>
          <span>{Math.round((course.enrolled / course.capacity) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(course.enrolled / course.capacity) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );

  const renderEnrollmentTable = () => (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Student
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Course
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Enrollment Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Progress
            </th>
            {(role === 'school_admin' || role === 'instructor') && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredEnrollments.map((enrollment) => (
            <tr key={enrollment.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {enrollment.studentName}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{enrollment.courseTitle}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(enrollment.status)}`}>
                  {getStatusIcon(enrollment.status)}
                  <span className="ml-1">
                    {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                  </span>
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${enrollment.progress}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-900">{enrollment.progress}%</span>
                </div>
              </td>
              {(role === 'school_admin' || role === 'instructor') && (
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {enrollment.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApproveEnrollment(enrollment.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectEnrollment(enrollment.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {enrollment.status !== 'pending' && (
                    <span className="text-gray-500">No actions</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {role === 'student' ? 'Course Enrollment' : 'Enrollment Management'}
          </h1>
          <p className="text-gray-600">
            {role === 'student' 
              ? 'Browse and enroll in available courses'
              : 'Manage student enrollments and course capacity'
            }
          </p>
        </div>
      </div>

      {/* Course Catalog for Students */}
      {role === 'student' && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(renderCourseCard)}
          </div>
        </div>
      )}

      {/* Enrollment Management for Admins/Instructors */}
      {(role === 'school_admin' || role === 'instructor') && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Enrollments</p>
                  <p className="text-2xl font-bold text-gray-900">{enrollments.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {enrollments.filter(e => e.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {enrollments.filter(e => e.status === 'approved').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Users className="w-6 h-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {enrollments.filter(e => e.status === 'completed').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search enrollments..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <Filter className="text-gray-400 mr-2" size={20} />
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Enrollments Table */}
          {renderEnrollmentTable()}
        </>
      )}
    </div>
  );
};

export default EnrollmentSystem;