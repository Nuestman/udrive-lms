// Course Details Page - View course structure with modules and lessons
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, BookOpen, Clock, Users, Edit, Trash2, GripVertical, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { useModules } from '../../hooks/useModules';
import { useLessons } from '../../hooks/useLessons';
import api from '../../lib/api';
import PageLayout from '../ui/PageLayout';
import LessonEditorModal from '../lessons/LessonEditorModal';

const CourseDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { modules, loading: modulesLoading, createModule, deleteModule } = useModules(id);
  
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModule, setShowAddModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const response = await api.get(`/courses/${id}`);
      if (response.success) {
        setCourse(response.data);
      }
    } catch (err) {
      console.error('Error fetching course:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;

    try {
      await createModule({
        title: newModuleTitle,
        description: ''
      });
      setNewModuleTitle('');
      setShowAddModule(false);
    } catch (err: any) {
      alert(err.message || 'Failed to create module');
    }
  };

  const handleDeleteModule = async (moduleId: string, moduleName: string) => {
    if (window.confirm(`Delete module "${moduleName}"?`)) {
      try {
        await deleteModule(moduleId);
      } catch (err: any) {
        alert(err.message || 'Failed to delete module');
      }
    }
  };

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const handleAddLesson = async (moduleId: string) => {
    if (!newLessonTitle.trim()) return;

    try {
      const response = await api.post('/lessons', {
        module_id: moduleId,
        title: newLessonTitle,
        content: '',
        lesson_type: 'text'
      });
      
      if (response.success) {
        setNewLessonTitle('');
        setShowAddLesson(false);
        setSelectedModule(null);
        // Refresh will happen via useLessons hook in child component
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create lesson');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!course) {
    return <div className="p-6 text-center text-gray-600">Course not found</div>;
  }

  return (
    <PageLayout
      title={course.title}
      breadcrumbs={[
        { label: 'Courses', href: '/school/courses' },
        { label: course.title }
      ]}
      actions={
        <button
          onClick={() => navigate('/school/courses')}
          className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Courses
        </button>
      }
    >
      {/* Course Info */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <span className={`mt-1 inline-flex px-3 py-1 rounded-full text-sm font-medium ${
              course.status === 'published' ? 'bg-green-100 text-green-800' :
              course.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-600">Students Enrolled</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{course.student_count || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Duration</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {course.duration_weeks || 'N/A'} {course.duration_weeks && 'weeks'}
            </p>
          </div>
        </div>
        {course.description && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-gray-700">{course.description}</p>
          </div>
        )}
      </div>

      {/* Modules Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Course Modules</h2>
          <button
            onClick={() => setShowAddModule(!showAddModule)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus size={18} className="mr-2" />
            Add Module
          </button>
        </div>

        {/* Add Module Form */}
        {showAddModule && (
          <form onSubmit={handleAddModule} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Module title..."
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddModule(false);
                  setNewModuleTitle('');
                }}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Modules List */}
        {modulesLoading ? (
          <div className="text-center py-8 text-gray-500">Loading modules...</div>
        ) : modules.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No modules yet. Add your first module to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {modules.map((module, index) => (
              <ModuleWithLessons
                key={module.id}
                module={module}
                index={index}
                isExpanded={expandedModules.has(module.id)}
                onToggle={() => toggleModule(module.id)}
                onDelete={() => handleDeleteModule(module.id, module.title)}
              />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

// Module with Lessons Component
interface ModuleWithLessonsProps {
  module: any;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

const ModuleWithLessons: React.FC<ModuleWithLessonsProps> = ({ module, index, isExpanded, onToggle, onDelete }) => {
  const { lessons, loading, createLesson, updateLesson, deleteLesson } = useLessons(isExpanded ? module.id : undefined);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [editingLesson, setEditingLesson] = useState<any>(null);

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonTitle.trim()) return;

    try {
      const newLesson = await createLesson({
        module_id: module.id,
        title: newLessonTitle,
        content: [],  // Valid JSON array, not empty string!
        lesson_type: 'text'
      });
      setNewLessonTitle('');
      setShowAddLesson(false);
      
      // Automatically open the TinyMCE editor for the new lesson
      if (newLesson) {
        setEditingLesson(newLesson);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create lesson');
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg hover:border-primary-300 transition-all">
      {/* Module Header */}
      <div className="flex items-center justify-between p-4 group">
        <div className="flex items-center flex-1 cursor-pointer" onClick={onToggle}>
          <GripVertical className="text-gray-400 mr-3 cursor-move" size={20} />
          {isExpanded ? <ChevronDown size={20} className="mr-2 text-gray-600" /> : <ChevronRight size={20} className="mr-2 text-gray-600" />}
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">
              Module {index + 1}: {module.title}
            </h3>
            {module.description && (
              <p className="text-sm text-gray-600 mt-1">{module.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>
                {isExpanded ? lessons.length : (module.lesson_count || 0)} lesson{(isExpanded ? lessons.length : (module.lesson_count || 0)) !== 1 ? 's' : ''}
              </span>
              {module.estimated_duration_minutes && (
                <span className="flex items-center">
                  <Clock size={14} className="mr-1" />
                  {module.estimated_duration_minutes} min
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              alert('Edit module - coming soon!');
            }}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
            aria-label="Edit module"
            title="Edit module"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded"
            aria-label="Delete module"
            title="Delete module"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Lessons List (Expanded) */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          {loading ? (
            <div className="text-center py-4 text-sm text-gray-500">Loading lessons...</div>
          ) : (
            <>
              {lessons.length === 0 ? (
                <div className="text-center py-4">
                  <FileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">No lessons yet</p>
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  {lessons.map((lesson, idx) => (
                    <div key={lesson.id} className="flex items-center justify-between p-3 bg-white rounded border border-gray-200 hover:border-primary-200 transition-colors group cursor-pointer"
                      onClick={() => setEditingLesson(lesson)}
                    >
                      <div className="flex items-center flex-1">
                        <FileText size={16} className="text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Lesson {idx + 1}: {lesson.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="capitalize">{lesson.lesson_type}</span>
                            {lesson.estimated_duration_minutes && (
                              <span className="flex items-center">
                                <Clock size={12} className="mr-1" />
                                {lesson.estimated_duration_minutes} min
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingLesson(lesson);
                          }}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          aria-label={`Edit lesson: ${lesson.title}`}
                          title="Edit lesson"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete lesson "${lesson.title}"?`)) {
                              try {
                                await deleteLesson(lesson.id);
                              } catch (err: any) {
                                alert(err.message || 'Failed to delete lesson');
                              }
                            }
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          aria-label={`Delete lesson: ${lesson.title}`}
                          title="Delete lesson"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Lesson Form */}
              {showAddLesson ? (
                <form onSubmit={handleAddLesson} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Lesson title..."
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddLesson(false);
                      setNewLessonTitle('');
                    }}
                    className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setShowAddLesson(true)}
                  className="w-full py-2 text-sm text-primary-600 border border-dashed border-primary-300 rounded hover:bg-primary-50 transition-colors"
                >
                  + Add Lesson
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Lesson Editor Modal */}
      {editingLesson && (
        <LessonEditorModal
          isOpen={!!editingLesson}
          lesson={editingLesson}
          onClose={() => setEditingLesson(null)}
          onSave={async (lessonId, updates) => {
            try {
              await updateLesson(lessonId, updates);
              setEditingLesson(null);
            } catch (err) {
              throw err;
            }
          }}
        />
      )}
    </div>
  );
};

export default CourseDetailsPage;

