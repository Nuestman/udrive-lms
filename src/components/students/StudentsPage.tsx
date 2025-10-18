// Students Management Page - Real Database Integration
import React, { useState } from 'react';
import { Plus, Search, Users, Mail, Phone, MoreVertical, Edit, Trash2, BookOpen } from 'lucide-react';
import { useStudents } from '../../hooks/useStudents';
import { useToast } from '../../contexts/ToastContext';
import PageLayout from '../ui/PageLayout';
import AddStudentModal from './AddStudentModal';
import EditStudentModal from './EditStudentModal';
import type { UserProfile } from '../../types/database.types';

const StudentsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<UserProfile | null>(null);
  const { success, error: showError } = useToast();
  
  const { students, loading, error, createStudent, deleteStudent, refreshStudents } = useStudents({
    search: searchTerm,
    status: statusFilter
  });

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleAddStudent = async (studentData: any) => {
    try {
      await createStudent(studentData);
      setShowAddModal(false);
      success(`Student ${studentData.first_name} ${studentData.last_name} added successfully`);
    } catch (err: any) {
      throw err; // Re-throw to be handled by the modal
    }
  };

  const handleDelete = async (student: UserProfile) => {
    if (window.confirm(`Deactivate ${student.first_name} ${student.last_name}?`)) {
      try {
        await deleteStudent(student.id);
        success(`Student ${student.first_name} ${student.last_name} deactivated successfully`);
      } catch (err: any) {
        showError(err.message || 'Failed to deactivate student');
      }
    }
  };

  return (
    <PageLayout
      title="Students"
      breadcrumbs={[{ label: 'Students' }]}
      actions={
        <button
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={20} className="mr-2" />
          Add Student
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
              placeholder="Search students..."
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
            aria-label="Filter students by status"
          >
            <option value="all">All Students</option>
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

      {!loading && !error && students.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
          <p className="text-gray-600">Start by adding your first student</p>
        </div>
      )}

      {!loading && !error && students.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm overflow-visible">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enrollments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={student.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${student.first_name} ${student.last_name}`)}&background=0D8ABC&color=fff`}
                        alt={`${student.first_name} ${student.last_name}`}
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {student.first_name} {student.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      {student.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail size={14} className="mr-1" />
                          {student.email}
                        </div>
                      )}
                      {student.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone size={14} className="mr-1" />
                          {student.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm">
                      <BookOpen size={16} className="mr-1 text-gray-400" />
                      <span>{(student as any).courses_enrolled || 0} courses</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${(student as any).overall_progress || 0}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">
                        {Math.round((student as any).overall_progress || 0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      student.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {student.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative inline-block">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(openDropdown === student.id ? null : student.id);
                          }}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          aria-label="Student actions menu"
                          title="Student actions"
                        >
                        <MoreVertical size={18} className="text-gray-400" />
                      </button>
                      
                      {openDropdown === student.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenDropdown(null)}
                          />
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setOpenDropdown(null);
                                  setEditingStudent(student);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                              >
                                <Edit size={16} className="mr-2" />
                                Edit Student
                              </button>
                              <button
                                onClick={() => {
                                  setOpenDropdown(null);
                                  handleDelete(student);
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {!loading && !error && students.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-600">
          Showing {students.length} student(s)
        </div>
      )}

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddStudent}
      />

      {/* Edit Student Modal */}
      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSuccess={() => {
            refreshStudents();
            setEditingStudent(null);
          }}
        />
      )}
    </PageLayout>
  );
};

export default StudentsPage;

