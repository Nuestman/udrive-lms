// Course Details Page - View course structure with modules and lessons
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, BookOpen, Clock, Users, Edit, Trash2, GripVertical, ChevronDown, ChevronRight, FileText, Play, Eye } from 'lucide-react';
import { useModules } from '../../hooks/useModules';
import { useLessons } from '../../hooks/useLessons';
import api, { quizzesApi } from '../../lib/api';
import PageLayout from '../ui/PageLayout';
import LessonEditorModal from '../lessons/LessonEditorModal';
import QuizBuilderModal from '../quiz/QuizBuilderModal';
import QuizEditModal from '../quiz/QuizEditModal';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

const CourseDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { modules, loading: modulesLoading, createModule, deleteModule } = useModules(id);
  
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModule, setShowAddModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonStatus, setNewLessonStatus] = useState<'draft' | 'published'>('draft');

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
      showToast('Module created', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to create module', 'error');
    }
  };

  const handleDeleteModule = async (moduleId: string, moduleName: string) => {
    if (window.confirm(`Delete module "${moduleName}"?`)) {
      try {
        await deleteModule(moduleId);
        showToast('Module deleted', 'success');
      } catch (err: any) {
        showToast(err.message || 'Failed to delete module', 'error');
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
      showToast(err.message || 'Failed to create lesson', 'error');
    }
  };

  const handleStudentView = async () => {
    try {
      // Get course modules and navigate to first lesson
      if (modules && modules.length > 0) {
        const firstModule = modules[0];
        
        // Fetch lessons for the first module
        try {
          const lessonsResponse = await api.get(`/lessons/module/${firstModule.id}`);
          if (lessonsResponse.success && lessonsResponse.data.length > 0) {
            const firstLesson = lessonsResponse.data[0];
            const slug = (firstLesson.title || '').toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
            
            // Navigate based on user role
            const basePath = user?.role === 'student' ? '/student' : 
                            user?.role === 'school_admin' ? '/school' : 
                            user?.role === 'super_admin' ? '/admin' : 
                            user?.role === 'instructor' ? '/instructor' : '/school';
            
            const lessonPath = `${basePath}/courses/${id}/lessons/${slug}-${firstLesson.id}`;
            navigate(lessonPath);
            return;
          }
        } catch (lessonError) {
          console.error('Error fetching lessons for module:', lessonError);
        }
      }
      
      // Fallback to course overview or show message
      if (!modules || modules.length === 0) {
        showToast('This course has no modules yet. Please add modules and lessons first.', 'error');
        return;
      }
      
      showToast('This course has no lessons yet. Please add lessons to the modules first.', 'error');
    } catch (error: any) {
      console.error('Error navigating to student view:', error);
      showToast('Failed to navigate to student view', 'error');
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
        { 
          label: 'Courses', 
          href: user?.role === 'student' ? '/student/courses' : 
                user?.role === 'instructor' ? '/instructor/courses' :
                user?.role === 'super_admin' ? '/school/courses' : '/school/courses'
        },
        { label: course.title }
      ]}
      actions={
        <div className="flex gap-3">
          <button
            onClick={handleStudentView}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Take this course as a student"
            disabled={!course || loading}
          >
            <Play size={18} className="mr-2" />
            {loading ? 'Loading...' : 'Student View'}
          </button>
          <button
            onClick={() => {
              const backPath = user?.role === 'student' ? '/student/courses' : 
                              user?.role === 'instructor' ? '/instructor/courses' :
                              user?.role === 'super_admin' ? '/school/courses' : '/school/courses';
              navigate(backPath);
            }}
            className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Courses
          </button>
        </div>
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
  const { showToast } = useToast();
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonStatus, setNewLessonStatus] = useState<'draft' | 'published'>('draft');
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const [isEditingModule, setIsEditingModule] = useState(false);
  const [moduleTitleDraft, setModuleTitleDraft] = useState(module.title);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonTitle.trim()) return;

    try {
      const newLesson = await createLesson({
        module_id: module.id,
        title: newLessonTitle,
        content: [],  // Valid JSON array, not empty string!
        lesson_type: 'text',
        status: newLessonStatus,
      });
      setNewLessonTitle('');
      setNewLessonStatus('draft');
      setShowAddLesson(false);
      showToast('Lesson created', 'success');
      // Automatically open the TinyMCE editor for the new lesson
      if (newLesson) {
        setEditingLesson(newLesson);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create lesson', 'error');
    }
  };

  // Load quizzes when expanded
  useEffect(() => {
    const loadQuizzes = async () => {
      if (!isExpanded) return;
      try {
        setLoadingQuizzes(true);
        const res = await quizzesApi.listByModule(module.id);
        if ((res as any).success) {
          setQuizzes((res as any).data || []);
        }
      } catch (e: any) {
        // silent
      } finally {
        setLoadingQuizzes(false);
      }
    };
    loadQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded, module.id, showQuizBuilder]);

  const handleSaveModuleTitle = async () => {
    try {
      // naive inline update through modules API via useModules hook is not available here; use raw api
      await api.put(`/modules/${module.id}`, { title: moduleTitleDraft });
      showToast('Module updated', 'success');
      setIsEditingModule(false);
    } catch (e: any) {
      showToast(e.message || 'Failed to update module', 'error');
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
              setModuleTitleDraft(module.title);
              setIsEditingModule(true);
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
            setShowQuizBuilder(true);
          }}
          className="p-2 text-primary-600 hover:bg-primary-50 rounded"
          aria-label="Add quiz"
          title="Add quiz"
        >
          <Plus size={18} />
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
          {/* Inline Module Edit */}
          {isEditingModule && (
            <div className="mb-4 flex flex-col sm:flex-row gap-2">
              <input
                value={moduleTitleDraft}
                onChange={(e) => setModuleTitleDraft(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Module title"
              />
              <button onClick={handleSaveModuleTitle} className="px-3 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700">Save</button>
              <button onClick={() => setIsEditingModule(false)} className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
            </div>
          )}

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
                                showToast('Lesson deleted', 'success');
                              } catch (err: any) {
                                showToast(err.message || 'Failed to delete lesson', 'error');
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
                <form onSubmit={handleAddLesson} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Lesson title..."
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                  />
                  <select
                    value={newLessonStatus}
                    onChange={(e) => setNewLessonStatus(e.target.value as 'draft' | 'published')}
                    className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                    title="Lesson status"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
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
                      setNewLessonStatus('draft');
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

              {/* Quizzes section */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-800">Quizzes</h4>
                  <button
                    onClick={() => setShowQuizBuilder(true)}
                    className="text-sm px-2 py-1 bg-primary-600 text-white rounded hover:bg-primary-700"
                  >
                    + New Quiz
                  </button>
                </div>
                {loadingQuizzes ? (
                  <div className="text-sm text-gray-500">Loading quizzes...</div>
                ) : quizzes.length === 0 ? (
                  <div className="text-sm text-gray-500">No quizzes yet</div>
                ) : (
                  <div className="space-y-2">
                    {quizzes.map((q) => (
                      <div key={q.id} className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{q.title}</div>
                          <div className="text-xs text-gray-500">
                            Passing: {q.passing_score ?? 70}% · Status: {q.status}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
                            onClick={() => setEditingQuizId(q.id)}
                          >
                            Edit
                          </button>
                          <button
                            className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
                            onClick={async () => {
                              const newStatus = q.status === 'published' ? 'draft' : 'published';
                              try {
                                await quizzesApi.update(q.id, { status: newStatus });
                                setQuizzes((prev) => prev.map((it) => it.id === q.id ? { ...it, status: newStatus } : it));
                                showToast(`Quiz ${newStatus}`, 'success');
                              } catch (e: any) {
                                showToast(e.message || 'Failed to update quiz', 'error');
                              }
                            }}
                          >
                            {q.status === 'published' ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                            onClick={async () => {
                              if (!confirm('Delete this quiz?')) return;
                              try {
                                await quizzesApi.delete(q.id);
                                setQuizzes((prev) => prev.filter((it) => it.id !== q.id));
                                showToast('Quiz deleted', 'success');
                              } catch (e: any) {
                                showToast(e.message || 'Failed to delete quiz', 'error');
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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

      {/* Quiz Builder Modal */}
      {showQuizBuilder && (
        <QuizBuilderModal
          isOpen={showQuizBuilder}
          moduleId={module.id}
          onClose={() => setShowQuizBuilder(false)}
          onCreated={() => {
            // no-op for now; quizzes count may be reflected elsewhere via backend
          }}
        />
      )}
      {editingQuizId && (
        <QuizEditModal
          isOpen={!!editingQuizId}
          quizId={editingQuizId}
          onClose={() => setEditingQuizId(null)}
          onSaved={(updated) => {
            setQuizzes((prev) => prev.map((q) => q.id === updated.id ? updated : q));
          }}
        />
      )}
    </div>
  );
};

export default CourseDetailsPage;

