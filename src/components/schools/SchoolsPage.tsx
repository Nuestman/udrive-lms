// Schools Management Page - Super Admin Only
import React, { useState } from 'react';
import { Plus, Search, Building2, Users, BookOpen, TrendingUp, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useSchools } from '../../hooks/useSchools';
import { useToast } from '../../contexts/ToastContext';
import PageLayout from '../ui/PageLayout';
import CreateSchoolModal from './CreateSchoolModal';
import EditSchoolModal from './EditSchoolModal';

const SchoolsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<any>(null);
  const { success, error: showError } = useToast();
  
  const { schools, loading, error, deleteSchool } = useSchools();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleEdit = (school: any) => {
    setSelectedSchool(school);
    setShowEditModal(true);
    setOpenDropdown(null);
  };

  const handleDelete = async (school: any) => {
    if (window.confirm(`Deactivate school "${school.name}"? This will affect all users in this school.`)) {
      try {
        await deleteSchool(school.id);
        success(`School "${school.name}" deactivated successfully`);
      } catch (err: any) {
        showError(err.message || 'Failed to deactivate school');
      }
    }
  };

  const filteredSchools = schools.filter((school) => {
    const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         school.subdomain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && school.is_active) ||
                         (statusFilter === 'inactive' && !school.is_active);
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <PageLayout
        title="Schools Management"
        breadcrumbs={[{ label: 'Schools' }]}
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm"
          >
            <Plus size={20} className="mr-2" />
            Create School
          </button>
        }
      >
        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search schools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              title="Filter by status"
              aria-label="Filter schools by status"
            >
              <option value="all">All Schools</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error: {error.message}</p>
          </div>
        )}

        {!loading && !error && filteredSchools.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No schools found</h3>
            <p className="text-gray-600">Create your first driving school</p>
          </div>
        )}

        {!loading && !error && filteredSchools.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchools.map((school) => (
              <div
                key={school.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-200"
              >
                {/* School Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {school.logo_url ? (
                          <img
                            src={school.logo_url}
                            alt={`${school.name} logo`}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <Building2 className="h-6 w-6 text-primary-600" />
                        )}
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-semibold text-gray-900">{school.name}</h3>
                        <p className="text-sm text-gray-500">{school.subdomain}.sunlms.com</p>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdown(openDropdown === school.id ? null : school.id);
                        }}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        aria-label="School actions"
                      >
                        <MoreVertical size={18} className="text-gray-400" />
                      </button>

                      {openDropdown === school.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenDropdown(null)}
                          />
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                            <div className="py-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(school);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                              >
                                <Edit size={16} className="mr-2" />
                                Edit School
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdown(null);
                                  handleDelete(school);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                              >
                                <Trash2 size={16} className="mr-2" />
                                Deactivate
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    school.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {school.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* School Stats */}
                <div className="p-6 bg-gray-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Users size={14} className="mr-1" />
                        Students
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{school.student_count || 0}</p>
                    </div>
                    <div>
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <BookOpen size={14} className="mr-1" />
                        Courses
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{school.course_count || 0}</p>
                    </div>
                    <div>
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Users size={14} className="mr-1" />
                        Instructors
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{school.instructor_count || 0}</p>
                    </div>
                    <div>
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <TrendingUp size={14} className="mr-1" />
                        Enrollments
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{school.enrollment_count || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                {(school.contact_email || school.contact_phone) && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    {school.contact_email && (
                      <p className="text-sm text-gray-600">📧 {school.contact_email}</p>
                    )}
                    {school.contact_phone && (
                      <p className="text-sm text-gray-600 mt-1">📞 {school.contact_phone}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && !error && filteredSchools.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Showing {filteredSchools.length} school(s)
          </div>
        )}
      </PageLayout>

      {/* Create School Modal */}
      <CreateSchoolModal 
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          // Refresh schools list to show newly created school
        }}
      />

      <EditSchoolModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedSchool(null);
        }}
        school={selectedSchool}
      />
    </>
  );
};

export default SchoolsPage;

