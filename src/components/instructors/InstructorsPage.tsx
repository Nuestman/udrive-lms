// Advanced Instructor Management Page with Analytics
import React, { useState } from 'react';
import { 
  GraduationCap, 
  UserPlus, 
  Search, 
  Download,
  TrendingUp,
  BookOpen,
  Users,
  MoreVertical,
  Edit,
  Eye,
  Award
} from 'lucide-react';
import { useInstructors, useInstructorStatistics, useInstructorActivity, useTopInstructors } from '../../hooks/useInstructors';
import { useNavigate } from 'react-router-dom';
import CreateInstructorModal from './CreateInstructorModal';
import EditInstructorModal from './EditInstructorModal';
import InstructorDetailsModal from './InstructorDetailsModal';
import InstructorActivityChart from './InstructorActivityChart';
import InstructorPerformanceChart from './InstructorPerformanceChart';

const InstructorsPage: React.FC = () => {
  const navigate = useNavigate();
  const { instructors, loading, pagination, filters, updateFilters, goToPage, refresh } = useInstructors();
  const { statistics, loading: statsLoading } = useInstructorStatistics();
  const { activity, loading: activityLoading } = useInstructorActivity(30);
  const { topInstructors, loading: topLoading } = useTopInstructors(5);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<any>(null);
  const [viewingInstructor, setViewingInstructor] = useState<any>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ search: e.target.value });
  };

  const handleStatusFilter = (status: string) => {
    updateFilters({ status: status === filters.status ? undefined : status });
  };

  const exportInstructors = () => {
    const csv = [
      ['Email', 'Name', 'Courses', 'Students', 'Avg Progress', 'Status', 'Created At'].join(','),
      ...instructors.map(instructor => [
        instructor.email,
        `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim(),
        instructor.courses_count || 0,
        instructor.total_students || 0,
        instructor.avg_student_progress || 0,
        instructor.is_active ? 'Active' : 'Inactive',
        new Date(instructor.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `instructors-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading && !instructors.length) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instructor Management</h1>
          <p className="text-gray-600">Manage instructors and view performance analytics</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Add Instructor
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Instructors</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {statsLoading ? '...' : statistics?.total_instructors || 0}
              </p>
              <p className="text-sm text-green-600 mt-1">
                +{statistics?.new_instructors_month || 0} this month
              </p>
            </div>
            <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Courses</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {statsLoading ? '...' : statistics?.total_courses || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {statistics?.published_courses || 0} published
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {statsLoading ? '...' : statistics?.total_students || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Across all courses
              </p>
            </div>
            <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Courses/Instructor</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {statsLoading ? '...' : statistics?.avg_courses_per_instructor || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Per instructor
              </p>
            </div>
            <div className="h-12 w-12 bg-accent-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-accent-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <InstructorPerformanceChart topInstructors={topInstructors} loading={topLoading} />
        </div>
        <div>
          <InstructorActivityChart activity={activity} loading={activityLoading} />
        </div>
      </div>

      {/* Top Instructors */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Top Performing Instructors</h2>
        </div>
        <div className="p-6">
          {topLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading top instructors...</p>
            </div>
          ) : topInstructors && topInstructors.length > 0 ? (
            <div className="space-y-3">
              {topInstructors.map((instructor, index) => (
                <div key={instructor.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                      {instructor.avatar_url ? (
                        <img src={instructor.avatar_url} alt={instructor.email} className="h-12 w-12 rounded-full object-cover" />
                      ) : (
                        <span className="text-primary-600 font-semibold text-lg">
                          {instructor.first_name?.[0] || instructor.email[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">
                        {instructor.first_name} {instructor.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{instructor.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-gray-900 text-lg">{instructor.courses_count || 0}</div>
                      <div className="text-gray-500 text-xs">Courses</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-900 text-lg">{instructor.total_students || 0}</div>
                      <div className="text-gray-500 text-xs">Students</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-900 text-lg">{instructor.avg_student_progress || 0}%</div>
                      <div className="text-gray-500 text-xs">Avg Progress</div>
                    </div>
                    <div className="flex items-center gap-1">
                      {index === 0 && <Award className="w-5 h-5 text-yellow-500" />}
                      {index === 1 && <Award className="w-5 h-5 text-gray-400" />}
                      {index === 2 && <Award className="w-5 h-5 text-amber-600" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No instructor data available</p>
              <p className="text-sm text-gray-400 mt-1">Instructors will appear here once they start creating courses</p>
            </div>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search instructors by name or email..."
                value={filters.search || ''}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleStatusFilter('active')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filters.status === 'active'
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => handleStatusFilter('inactive')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filters.status === 'inactive'
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Inactive
            </button>
          </div>

          <button
            onClick={exportInstructors}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Instructors Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Instructor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Courses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {instructors.map((instructor) => (
                <tr key={instructor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        {instructor.avatar_url ? (
                          <img src={instructor.avatar_url} alt={instructor.email} className="h-10 w-10 rounded-full" />
                        ) : (
                          <span className="text-primary-600 font-semibold">
                            {instructor.first_name?.[0] || instructor.email[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {instructor.first_name} {instructor.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{instructor.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{instructor.courses_count || 0}</span>
                      <span className="text-xs text-gray-500">
                        ({instructor.published_courses || 0} pub)
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{instructor.total_students || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[80px]">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(instructor.avg_student_progress || 0, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">{instructor.avg_student_progress || 0}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      instructor.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {instructor.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(instructor.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative">
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === instructor.id ? null : instructor.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        aria-label="Instructor actions menu"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      
                      {activeDropdown === instructor.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                          <button
                            onClick={() => {
                              setViewingInstructor(instructor);
                              setActiveDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                          <button
                            onClick={() => {
                              setEditingInstructor(instructor);
                              setActiveDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Edit Instructor
                          </button>
                          <button
                            onClick={() => {
                              navigate(`/school/courses`);
                              setActiveDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Award className="w-4 h-4" />
                            View Courses
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} instructors
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      pagination.page === page
                        ? 'bg-primary-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateInstructorModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={refresh}
        />
      )}

      {editingInstructor && (
        <EditInstructorModal
          instructor={editingInstructor}
          onClose={() => setEditingInstructor(null)}
          onSuccess={refresh}
        />
      )}

      {viewingInstructor && (
        <InstructorDetailsModal
          instructor={viewingInstructor}
          onClose={() => setViewingInstructor(null)}
        />
      )}
    </div>
  );
};

export default InstructorsPage;

