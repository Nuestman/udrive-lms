// Students Management Page - Real Database Integration
import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Users, 
  Mail, 
  Phone, 
  MoreVertical, 
  Edit, 
  Trash2, 
  BookOpen, 
  TrendingUp, 
  Award, 
  Calendar,
  Filter,
  Download,
  Eye,
  UserCheck,
  UserX,
  Clock,
  BarChart3,
  Grid,
  List,
  ChevronDown,
  X
} from 'lucide-react';
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
  const [viewingStudent, setViewingStudent] = useState<UserProfile | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'progress' | 'enrollment'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const { success, error: showError } = useToast();
  
  const { students, loading, error, createStudent, deleteStudent, refreshStudents } = useStudents({
    search: searchTerm,
    status: statusFilter
  });


  // Calculate statistics
  const stats = useMemo(() => {
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.is_active).length;
    const inactiveStudents = students.filter(s => !s.is_active).length;
    const avgProgress = students.length > 0 
      ? Math.round(students.reduce((acc, s) => acc + ((s as any).overall_progress || 0), 0) / students.length)
      : 0;
    const totalEnrollments = students.reduce((acc, s) => acc + ((s as any).courses_enrolled || 0), 0);
    const completedCourses = students.reduce((acc, s) => acc + ((s as any).courses_completed || 0), 0);
    
    return {
      totalStudents,
      activeStudents,
      inactiveStudents,
      avgProgress,
      totalEnrollments,
      completedCourses
    };
  }, [students]);

  // Filter and sort students
  const filteredAndSortedStudents = useMemo(() => {
    let filtered = students.filter(student => {
      const matchesSearch = 
        student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && student.is_active) ||
        (statusFilter === 'inactive' && !student.is_active);
      
      return matchesSearch && matchesStatus;
    });

    // Sort students
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = `${a.first_name} ${a.last_name}`.toLowerCase();
          bValue = `${b.first_name} ${b.last_name}`.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'progress':
          aValue = (a as any).overall_progress || 0;
          bValue = (b as any).overall_progress || 0;
          break;
        case 'enrollment':
          aValue = new Date(a.created_at || '').getTime();
          bValue = new Date(b.created_at || '').getTime();
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [students, searchTerm, statusFilter, sortBy, sortOrder]);

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

  const handleBulkDelete = async () => {
    if (selectedStudents.length === 0) return;
    
    const confirmMessage = `Are you sure you want to deactivate ${selectedStudents.length} student(s)?`;
    if (window.confirm(confirmMessage)) {
      try {
        await Promise.all(selectedStudents.map(id => deleteStudent(id)));
        setSelectedStudents([]);
        success(`${selectedStudents.length} student(s) deactivated successfully`);
      } catch (err: any) {
        showError(err.message || 'Failed to deactivate students');
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredAndSortedStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredAndSortedStudents.map(s => s.id));
    }
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleExport = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Status', 'Progress', 'Courses Enrolled', 'Courses Completed', 'Enrollment Date'],
      ...filteredAndSortedStudents.map(student => [
        `${student.first_name} ${student.last_name}`,
        student.email,
        student.phone || '',
        student.is_active ? 'Active' : 'Inactive',
        `${(student as any).overall_progress || 0}%`,
        (student as any).courses_enrolled || 0,
        (student as any).courses_completed || 0,
        new Date(student.created_at || '').toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleSort = (field: 'name' | 'email' | 'progress' | 'enrollment') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };


  return (
    <PageLayout
      title="Students"
      breadcrumbs={[{ label: 'Students' }]}
      actions={
        <div className="flex items-center gap-3">
          <button
            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={handleExport}
            title="Export to CSV"
          >
            <Download size={18} className="mr-2" />
            Export
          </button>
        <button
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={20} className="mr-2" />
          Add Student
        </button>
        </div>
      }
    >
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeStudents}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Progress</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgProgress}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Award className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Enrollments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEnrollments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters and Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
                placeholder="Search students by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
            <div className="flex items-center gap-3">
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
              
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Filter size={18} className="mr-2" />
                  Sort
                  <ChevronDown size={16} className="ml-1" />
                </button>
                
                {showFilters && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <div className="py-1">
                      <button
                        onClick={() => handleSort('name')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                      >
                        Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </button>
                      <button
                        onClick={() => handleSort('email')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                      >
                        Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </button>
                      <button
                        onClick={() => handleSort('progress')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                      >
                        Progress {sortBy === 'progress' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </button>
                      <button
                        onClick={() => handleSort('enrollment')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                      >
                        Enrollment Date {sortBy === 'enrollment' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {selectedStudents.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{selectedStudents.length} selected</span>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} className="mr-1" />
                  Deactivate
                </button>
              </div>
            )}
            
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 ${viewMode === 'table' ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Table view"
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 ${viewMode === 'cards' ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Card view"
              >
                <Grid size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">Error: {error.message}</p>
        </div>
      )}

      {!loading && !error && filteredAndSortedStudents.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Start by adding your first student.'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus size={20} className="mr-2" />
              Add Student
            </button>
          )}
        </div>
      )}

      {!loading && !error && filteredAndSortedStudents.length > 0 && (
        <>
          {viewMode === 'table' ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="overflow-x-auto overflow-y-visible">
                <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                      <th className="px-6 py-4 text-left">
                        <input
                          type="checkbox"
                          checked={selectedStudents.length === filteredAndSortedStudents.length && filteredAndSortedStudents.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enrollments
                </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-6 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={() => handleSelectStudent(student.id)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap">
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
                        <td className="px-6 py-6 whitespace-nowrap">
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
                        <td className="px-6 py-6 whitespace-nowrap">
                    <div className="flex items-center text-sm">
                      <BookOpen size={16} className="mr-1 text-gray-400" />
                      <span>{(student as any).courses_enrolled || 0} courses</span>
                    </div>
                  </td>
                        <td className="px-6 py-6 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(student as any).overall_progress || 0}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">
                        {Math.round((student as any).overall_progress || 0)}%
                      </span>
                    </div>
                  </td>
                        <td className="px-6 py-6 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      student.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {student.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                        <td className="px-6 py-6 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setViewingStudent(student)}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                              title="View details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => setEditingStudent(student)}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                              title="Edit student"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(student)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                              title="Deactivate student"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedStudents.map((student) => (
                <div key={student.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <img
                        className="h-12 w-12 rounded-full"
                        src={student.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${student.first_name} ${student.last_name}`)}&background=0D8ABC&color=fff`}
                        alt={`${student.first_name} ${student.last_name}`}
                      />
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {student.first_name} {student.last_name}
                        </h3>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleSelectStudent(student.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    {student.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone size={16} className="mr-2" />
                        {student.phone}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <BookOpen size={16} className="mr-2" />
                      {(student as any).courses_enrolled || 0} courses enrolled
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Award size={16} className="mr-2" />
                      {(student as any).courses_completed || 0} completed
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar size={16} className="mr-2" />
                      Enrolled: {new Date(student.created_at || '').toLocaleDateString()}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Overall Progress</span>
                      <span>{Math.round((student as any).overall_progress || 0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(student as any).overall_progress || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      student.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {student.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewingStudent(student)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => setEditingStudent(student)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                        title="Edit student"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(student)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                        title="Deactivate student"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
            <div>
              Showing {filteredAndSortedStudents.length} of {students.length} students
            </div>
            <div className="flex items-center gap-4">
              <span>Sort by: {sortBy} ({sortOrder})</span>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="flex items-center text-primary-600 hover:text-primary-800"
                >
                  <X size={16} className="mr-1" />
                  Clear search
                </button>
              )}
            </div>
        </div>
        </>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <AddStudentModal
              isOpen={showAddModal}
              onClose={() => setShowAddModal(false)}
              onSubmit={handleAddStudent}
            />
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setEditingStudent(null)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <EditStudentModal
              student={editingStudent}
              onClose={() => setEditingStudent(null)}
              onSuccess={() => {
                refreshStudents();
                setEditingStudent(null);
              }}
            />
          </div>
        </div>
      )}


      {/* Student Detail View Modal */}
      {viewingStudent && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingStudent(null)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Student Details</h2>
                <button
                  onClick={() => setViewingStudent(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Student Info */}
                <div className="flex items-center space-x-4">
                  <img
                    className="h-20 w-20 rounded-full"
                    src={viewingStudent.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${viewingStudent.first_name} ${viewingStudent.last_name}`)}&background=0D8ABC&color=fff`}
                    alt={`${viewingStudent.first_name} ${viewingStudent.last_name}`}
                  />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {viewingStudent.first_name} {viewingStudent.last_name}
                    </h3>
                    <p className="text-gray-600">{viewingStudent.email}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                      viewingStudent.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {viewingStudent.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail size={16} className="mr-2" />
                        {viewingStudent.email}
                      </div>
                      {viewingStudent.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone size={16} className="mr-2" />
                          {viewingStudent.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Enrollment Details</h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar size={16} className="mr-2" />
                        Enrolled: {new Date(viewingStudent.created_at || '').toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <BookOpen size={16} className="mr-2" />
                        {(viewingStudent as any).courses_enrolled || 0} courses enrolled
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-4">Learning Progress</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span>Overall Progress</span>
                        <span>{Math.round((viewingStudent as any).overall_progress || 0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${(viewingStudent as any).overall_progress || 0}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {(viewingStudent as any).courses_enrolled || 0}
                        </div>
                        <div className="text-sm text-gray-600">Courses Enrolled</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {(viewingStudent as any).courses_completed || 0}
                        </div>
                        <div className="text-sm text-gray-600">Courses Completed</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setViewingStudent(null);
                      setEditingStudent(viewingStudent);
                    }}
                    className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Edit size={16} className="mr-2" />
                    Edit Student
                  </button>
                  <button
                    onClick={() => {
                      setViewingStudent(null);
                      handleDelete(viewingStudent);
                    }}
                    className="flex items-center px-4 py-2 text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Deactivate
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default StudentsPage;

