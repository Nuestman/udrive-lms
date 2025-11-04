// Instructor Details Modal
import React from 'react';
import { X, BookOpen, Users, Award, TrendingUp } from 'lucide-react';
import { useInstructorCourses } from '../../hooks/useInstructors';

interface InstructorDetailsModalProps {
  instructor: any;
  onClose: () => void;
}

const InstructorDetailsModal: React.FC<InstructorDetailsModalProps> = ({ instructor, onClose }) => {
  const { courses, loading } = useInstructorCourses(instructor.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Instructor Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile */}
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 bg-primary-100 rounded-full flex items-center justify-center">
              {instructor.avatar_url ? (
                <img src={instructor.avatar_url} alt={instructor.email} className="h-20 w-20 rounded-full" />
              ) : (
                <span className="text-3xl text-primary-600 font-semibold">
                  {instructor.first_name?.[0] || instructor.email[0].toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{instructor.first_name} {instructor.last_name}</h3>
              <p className="text-gray-600">{instructor.email}</p>
              {instructor.phone && <p className="text-gray-600">{instructor.phone}</p>}
              <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${instructor.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {instructor.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-primary-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-medium text-primary-900">Courses</span>
              </div>
              <p className="text-2xl font-bold text-primary-900">{instructor.courses_count || 0}</p>
              <p className="text-xs text-primary-700">{instructor.published_courses || 0} published</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">Students</span>
              </div>
              <p className="text-2xl font-bold text-green-900">{instructor.total_students || 0}</p>
              <p className="text-xs text-green-700">{instructor.active_enrollments || 0} active</p>
            </div>

            <div className="bg-primary-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-medium text-primary-900">Avg Progress</span>
              </div>
              <p className="text-2xl font-bold text-primary-900">{instructor.avg_student_progress || 0}%</p>
              <p className="text-xs text-primary-700">Student progress</p>
            </div>

            <div className="bg-accent-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-accent-600" />
                <span className="text-sm font-medium text-accent-900">Completed</span>
              </div>
              <p className="text-2xl font-bold text-accent-900">{instructor.completed_enrollments || 0}</p>
              <p className="text-xs text-accent-700">Enrollments</p>
            </div>
          </div>

          {/* Courses */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Courses</h3>
            {loading ? (
              <div className="text-center py-4 text-gray-500">Loading courses...</div>
            ) : courses.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No courses yet</div>
            ) : (
              <div className="space-y-3">
                {courses.map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{course.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span>{course.module_count || 0} modules</span>
                          <span>{course.student_count || 0} students</span>
                          <span className={`px-2 py-0.5 rounded ${course.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {course.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{course.avg_progress || 0}%</div>
                      <div className="text-xs text-gray-500">Avg Progress</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorDetailsModal;

