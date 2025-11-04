// Courses Page - Real Database Integration
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, BookOpen, Users, Clock, Edit, Trash2, Eye, MoreVertical } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCourses } from '../../hooks/useCourses';
import { useToast } from '../../contexts/ToastContext';
import { enrollmentsApi } from '../../lib/api';
import PageLayout from '../ui/PageLayout';
import CreateCourseModal from './CreateCourseModal';
import EditCourseModal from './EditCourseModal';
import UniversalEnrollmentButton from '../common/UniversalEnrollmentButton';
import type { Course } from '../../types/database.types';

interface CoursesPageProps {
  role: 'super_admin' | 'school_admin' | 'instructor' | 'student';
}

const CoursesPage: React.FC<CoursesPageProps> = ({ role }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { courses, loading, error, deleteCourse, publishCourse } = useCourses();
  const { success, error: showError } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [userEnrollments, setUserEnrollments] = useState<Set<string>>(new Set());
  const [enrollmentData, setEnrollmentData] = useState<Map<string, { progress: number; status: string }>>(new Map());

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle delete
  const handleDelete = async (course: Course) => {
    if (window.confirm(`Are you sure you want to delete "${course.title}"?`)) {
      try {
        await deleteCourse(course.id);
        success(`Course "${course.title}" deleted successfully`);
      } catch (err: any) {
        showError(err.message || 'Failed to delete course');
      }
    }
  };

  // Handle publish
  const handlePublish = async (course: Course) => {
    try {
      await publishCourse(course.id);
      success(`Course "${course.title}" published successfully`);
    } catch (err: any) {
      showError(err.message || 'Failed to publish course');
    }
  };

  // Load user enrollments for non-student roles
  useEffect(() => {
    const loadEnrollments = async () => {
      if (profile?.id && role !== 'student') {
        try {
          const response = await enrollmentsApi.getByStudent(profile.id);
          const enrolledCourseIds = new Set<string>();
          const enrollmentMap = new Map<string, { progress: number; status: string }>();
          
          response.data?.forEach((enrollment: any) => {
            enrolledCourseIds.add(enrollment.course_id);
            enrollmentMap.set(enrollment.course_id, {
              progress: enrollment.progress_percentage || 0,
              status: enrollment.status || 'active'
            });
          });
          
          setUserEnrollments(enrolledCourseIds);
          setEnrollmentData(enrollmentMap);
        } catch (error) {
          console.error('Failed to load enrollments:', error);
        }
      }
    };
    
    loadEnrollments();
  }, [profile?.id, role]);

  // Temporarily allow all actions for testing
  const canCreate = true; // Was: ['super_admin', 'school_admin', 'instructor'].includes(role);
  const canEdit = true; // Was: ['super_admin', 'school_admin', 'instructor'].includes(role);
  const canDelete = true; // Was: ['super_admin', 'school_admin'].includes(role);

  return (
    <>
      <PageLayout
        title="Courses"
        breadcrumbs={[{ label: 'Courses' }]}
        actions={
          canCreate ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm"
            >
              <Plus size={20} className="mr-2" />
              Create Course
            </button>
          ) : undefined
        }
      >
        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              title="Filter by status"
              aria-label="Filter courses by status"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">Error loading courses: {error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-red-600 hover:text-red-700 underline text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredCourses.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No courses found' : 'No courses yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Get started by creating your first course'}
            </p>
            {canCreate && !searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus size={20} className="mr-2" />
                Create First Course
              </button>
            )}
          </div>
        )}

        {/* Info Message for Students */}
        {!loading && !error && !canCreate && (
          <div className="mb-4 bg-primary-50 border border-primary-200 rounded-lg p-4">
            <p className="text-sm text-primary-800">
              <strong>Student View:</strong> Browse available courses. Contact your instructor or admin to enroll.
            </p>
          </div>
        )}

        {/* Courses Grid */}
        {!loading && !error && filteredCourses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-200 cursor-pointer group"
                onClick={() => navigate(`/school/courses/${course.id}`)}
              >
                {/* Thumbnail */}
                <div className="h-40 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="w-16 h-16 text-white opacity-50" />
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      course.status === 'published' ? 'bg-green-100 text-green-800' :
                      course.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                    </span>
                    
                    {/* Actions Menu */}
                    {canEdit || canDelete ? (
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(openDropdown === course.id ? null : course.id);
                          }}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          aria-label="Course actions menu"
                          title="Course actions"
                        >
                          <MoreVertical size={18} className="text-gray-400" />
                        </button>
                        
                        {/* Dropdown */}
                        {openDropdown === course.id && (
                          <>
                            {/* Backdrop to close dropdown */}
                            <div 
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenDropdown(null)}
                            />
                            
                            {/* Menu */}
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                              <div className="py-1">
                                {canEdit && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenDropdown(null);
                                      setEditingCourse(course);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                                  >
                                    <Edit size={16} className="mr-2" />
                                    Edit Course
                                  </button>
                                )}
                                {course.status === 'draft' && canEdit && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenDropdown(null);
                                      handlePublish(course);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                                  >
                                    <Eye size={16} className="mr-2" />
                                    Publish
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenDropdown(null);
                                      handleDelete(course);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
                                  >
                                    <Trash2 size={16} className="mr-2" />
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ) : null}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {course.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {course.description || 'No description provided'}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <Users size={16} className="mr-1" />
                      <span>{course.student_count || 0} students</span>
                    </div>
                    <div className="flex items-center">
                      <BookOpen size={16} className="mr-1" />
                      <span>{course.module_count || 0} modules</span>
                    </div>
                    {course.duration_weeks && (
                      <div className="flex items-center">
                        <Clock size={16} className="mr-1" />
                        <span>{course.duration_weeks}w</span>
                      </div>
                    )}
                  </div>

                  {/* Instructor */}
                  {course.instructor_name && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Instructor: <span className="text-gray-700 font-medium">{course.instructor_name}</span>
                      </p>
                    </div>
                  )}

                  {/* Enrollment Button for Non-Student Roles */}
                  {role !== 'student' && course.status === 'published' && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <UniversalEnrollmentButton
                        courseId={course.id}
                        courseTitle={course.title}
                        isEnrolled={userEnrollments.has(course.id)}
                        enrollmentProgress={enrollmentData.get(course.id)?.progress || 0}
                        enrollmentStatus={enrollmentData.get(course.id)?.status || 'active'}
                        onEnrollmentChange={() => {
                          // Refresh enrollments
                          const loadEnrollments = async () => {
                            if (profile?.id) {
                              try {
                                const response = await enrollmentsApi.getByStudent(profile.id);
                                const enrolledCourseIds = new Set<string>();
                                const enrollmentMap = new Map<string, { progress: number; status: string }>();
                                
                                response.data?.forEach((enrollment: any) => {
                                  enrolledCourseIds.add(enrollment.course_id);
                                  enrollmentMap.set(enrollment.course_id, {
                                    progress: enrollment.progress_percentage || 0,
                                    status: enrollment.status || 'active'
                                  });
                                });
                                
                                setUserEnrollments(enrolledCourseIds);
                                setEnrollmentData(enrollmentMap);
                              } catch (error) {
                                console.error('Failed to load enrollments:', error);
                              }
                            }
                          };
                          loadEnrollments();
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results Count */}
        {!loading && !error && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Showing {filteredCourses.length} of {courses.length} courses
          </div>
        )}
      </PageLayout>

      {/* Create Course Modal */}
      {showCreateModal && (
        <CreateCourseModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Edit Course Modal */}
      {editingCourse && (
        <EditCourseModal
          isOpen={!!editingCourse}
          course={editingCourse}
          onClose={() => setEditingCourse(null)}
        />
      )}
    </>
  );
};

export default CoursesPage;

