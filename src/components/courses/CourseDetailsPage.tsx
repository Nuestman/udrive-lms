// Course Details Page - View course structure with modules and lessons
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, BookOpen, Clock, Users, Edit, Trash2, GripVertical, ChevronDown, ChevronRight, FileText, Eye, MessageSquareHeart, Sparkles, Loader2, CheckCircle2, Megaphone, Pin as PinIcon, X } from 'lucide-react';
import { useModules } from '../../hooks/useModules';
import { useLessons } from '../../hooks/useLessons';
import api, { quizzesApi } from '../../lib/api';
import PageLayout from '../ui/PageLayout';
import LessonEditorModal from '../lessons/LessonEditorModal';
import QuizBuilderModal from '../quiz/QuizBuilderModal';
import QuizEditModal from '../quiz/QuizEditModal';
import EditCourseModal from './EditCourseModal';
import { useToast } from '../../contexts/ToastContext';
import ConfirmationModal from '../ui/ConfirmationModal';
import { useAuth } from '../../contexts/AuthContext';
import { useCourses } from '../../hooks/useCourses';
import {
  CourseReviewSettings,
  getCourseReviewSettings,
  updateCourseReviewSettings,
} from '../../services/reviewSettings.service';
import { Announcement, AnnouncementPayload, fetchAnnouncements, createAnnouncement } from '../../services/announcements.service';
import AnnouncementEditorModal from '../announcements/AnnouncementEditorModal';
import { formatDistanceToNow } from 'date-fns';
import { formatFileSize } from '../../utils/upload.utils';

const buildDefaultReviewSettings = (courseId?: string): CourseReviewSettings =>
  ({
    course_id: courseId ?? '',
    trigger_type: 'percentage',
    trigger_value: 20,
    cooldown_days: 30,
    allow_multiple: false,
    manual_trigger_enabled: false,
    prompt_message: '',
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as CourseReviewSettings);

const CourseDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { updateCourse, publishCourse } = useCourses();
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
  const [reviewSettings, setReviewSettings] = useState<CourseReviewSettings | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<CourseReviewSettings>(() =>
    buildDefaultReviewSettings(id)
  );
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [resolvedCourseId, setResolvedCourseId] = useState<string | null>(null);
  const [showCourseAnnouncementModal, setShowCourseAnnouncementModal] = useState(false);
  const [courseAnnouncements, setCourseAnnouncements] = useState<Announcement[]>([]);
  const [courseAnnouncementsLoading, setCourseAnnouncementsLoading] = useState(false);
  const [courseAnnouncementsError, setCourseAnnouncementsError] = useState<string | null>(null);
  const [courseAnnouncementSubmitting, setCourseAnnouncementSubmitting] = useState(false);
  const [announcementsExpanded, setAnnouncementsExpanded] = useState(false);
  const [reviewSettingsExpanded, setReviewSettingsExpanded] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [scormPackage, setScormPackage] = useState<any>(null);
  const [scormScos, setScormScos] = useState<any[]>([]);
  const [loadingScormInfo, setLoadingScormInfo] = useState(false);

  useEffect(() => {
    setSettingsDraft(buildDefaultReviewSettings(id));
    fetchCourse();
    loadReviewSettings();
  }, [id]);

  useEffect(() => {
    if (course?.is_scorm && course?.id) {
      fetchScormPackageInfo();
    }
  }, [course?.is_scorm, course?.id]);

  const fetchScormPackageInfo = async () => {
    if (!course?.id) return;
    try {
      setLoadingScormInfo(true);
      const response = await api.scorm.getPackageByCourseId(course.id);
      if (response.success) {
        if (response.data) {
          setScormPackage(response.data.package);
          setScormScos(response.data.scos || []);
        } else {
          setScormPackage(null);
          setScormScos([]);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch SCORM package info:', err);
    } finally {
      setLoadingScormInfo(false);
    }
  };

  const fetchCourse = async () => {
    if (!id) {
      showToast('Invalid course ID', 'error');
      setTimeout(() => navigate('/school/courses'), 2000);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get(`/courses/${id}`);
      if (response.success && response.data) {
        setCourse(response.data);
        if (response.data?.id) {
          setResolvedCourseId(response.data.id);
        }
      } else {
        // Course not found or invalid response
        const errorMsg = response.error || response.message || 'Course not found or you do not have access to it';
        console.error('Course fetch failed:', { response, id });
        showToast(errorMsg, 'error');
        setTimeout(() => navigate('/school/courses'), 2000);
      }
    } catch (err: any) {
      console.error('Error fetching course:', err);
      const errorMessage = err?.message || err?.error || err?.toString() || 'Failed to load course';
      showToast(errorMessage, 'error');
      setTimeout(() => navigate('/school/courses'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const loadReviewSettings = async () => {
    if (!id) return;
    try {
      setSettingsLoading(true);
      setSettingsError(null);
      const response = await getCourseReviewSettings(id);
      const normalizedResponse = response
        ? {
            ...response,
            metadata:
              typeof response.metadata === 'string'
                ? (() => {
                    try {
                      return JSON.parse(response.metadata);
                    } catch (error) {
                      console.warn(
                        'Failed to parse review settings metadata; defaulting to empty object.',
                        error
                      );
                      return {};
                    }
                  })()
                : response.metadata ?? {},
          }
        : null;

      setReviewSettings(normalizedResponse);
      if (normalizedResponse) {
        setSettingsDraft(normalizedResponse);
      } else {
        setSettingsDraft(buildDefaultReviewSettings(id));
      }
    } catch (err: any) {
      console.error('Failed to load review settings:', err);
      setSettingsError(err.message || 'Unable to load review settings.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSaveReviewSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id) return;
    try {
      setSettingsSaving(true);
      setSettingsError(null);
      let metadataPayload: Record<string, any> | undefined;
      if (settingsDraft.metadata !== undefined && settingsDraft.metadata !== null) {
        if (typeof settingsDraft.metadata === 'string') {
          try {
            metadataPayload = JSON.parse(settingsDraft.metadata);
          } catch (parseError) {
            console.warn('Unable to parse review settings metadata; defaulting to object.', parseError);
            metadataPayload = {};
          }
        } else {
          metadataPayload = settingsDraft.metadata;
        }
      }

      await updateCourseReviewSettings(id, {
        trigger_type: settingsDraft.trigger_type,
        trigger_value: settingsDraft.trigger_type === 'manual' ? null : settingsDraft.trigger_value,
        cooldown_days: settingsDraft.cooldown_days,
        allow_multiple: settingsDraft.allow_multiple,
        manual_trigger_enabled: settingsDraft.manual_trigger_enabled,
        prompt_message: settingsDraft.prompt_message || null,
        metadata: metadataPayload ?? {},
      });
      showToast('Review prompt settings updated', 'success');
      await loadReviewSettings();
    } catch (err: any) {
      console.error('Failed to save review settings:', err);
      const message = err?.message || 'Unable to update review settings.';
      setSettingsError(message);
      showToast(message, 'error');
    } finally {
      setSettingsSaving(false);
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

  const loadCourseAnnouncements = useCallback(async (courseUuid: string) => {
    if (!courseUuid) return;
    try {
      setCourseAnnouncementsLoading(true);
      setCourseAnnouncementsError(null);
      const data = await fetchAnnouncements({
        courseId: courseUuid,
        includeGlobal: false,
        status: 'all',
        includeExpired: true,
      });
      const relevant = (data || []).filter(
        (announcement) =>
          announcement.courseId === courseUuid &&
          announcement.audienceScope === 'course' &&
          announcement.contextType !== 'general'
      );
      setCourseAnnouncements(relevant);
    } catch (err: any) {
      console.error('Failed to load course announcements:', err);
      setCourseAnnouncementsError(err?.message || 'Unable to load course announcements right now.');
    } finally {
      setCourseAnnouncementsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (resolvedCourseId) {
      loadCourseAnnouncements(resolvedCourseId);
    }
  }, [resolvedCourseId, loadCourseAnnouncements]);

  const sortedCourseAnnouncements = useMemo(() => {
    const list = [...courseAnnouncements];
    list.sort((a, b) => {
      if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
        return Boolean(b.isPinned) ? 1 : -1;
      }
      const aDate = new Date(a.publishedAt || a.createdAt || 0).getTime();
      const bDate = new Date(b.publishedAt || b.createdAt || 0).getTime();
      return bDate - aDate;
    });
    return list;
  }, [courseAnnouncements]);

  const handleCreateCourseAnnouncement = async (payload: AnnouncementPayload) => {
    if (!resolvedCourseId) return;
    try {
      setCourseAnnouncementSubmitting(true);
      const finalPayload: AnnouncementPayload = {
        ...payload,
        audience_scope: 'course',
        course_id: resolvedCourseId,
        module_id: payload.module_id || null,
        lesson_id: payload.lesson_id || null,
        quiz_id: payload.quiz_id || null,
      };

      await createAnnouncement(finalPayload);
      showToast('Course announcement created', 'success');
      setShowCourseAnnouncementModal(false);
      await loadCourseAnnouncements(resolvedCourseId);
    } catch (err: any) {
      console.error('Failed to create course announcement:', err);
      const message = err?.message || 'Unable to create course announcement.';
      showToast(message, 'error');
      throw err;
    } finally {
      setCourseAnnouncementSubmitting(false);
    }
  };

  // Student view functionality removed: only students can take courses

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

  const handleCourseUpdate = async () => {
    await fetchCourse(); // Refresh course data after update
  };

  return (
    <>
      {course && (
        <EditCourseModal
          isOpen={showEditModal}
          course={course}
          onClose={() => {
            setShowEditModal(false);
            handleCourseUpdate();
          }}
        />
      )}
      <AnnouncementEditorModal
        open={showCourseAnnouncementModal}
        mode="create"
        onClose={() => {
          if (!courseAnnouncementSubmitting) {
            setShowCourseAnnouncementModal(false);
          }
        }}
        onSubmit={handleCreateCourseAnnouncement}
        submitting={courseAnnouncementSubmitting}
        audienceScopeOptions={['course']}
        lockedAudienceScope="course"
        lockedCourseId={resolvedCourseId || ''}
        disableAudienceSelection
      />
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
          {course.is_scorm && (
            <>
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Edit size={18} className="mr-2" />
                Edit Course
              </button>
              {course.status !== 'published' && (
                <button
                  onClick={async () => {
                    if (!course.id) return;
                    try {
                      setPublishing(true);
                      await publishCourse(course.id);
                      showToast('Course published successfully', 'success');
                      await fetchCourse(); // Refresh course data
                    } catch (err: any) {
                      showToast(err.message || 'Failed to publish course', 'error');
                    } finally {
                      setPublishing(false);
                    }
                  }}
                  disabled={publishing}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {publishing ? (
                    <>
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Megaphone size={18} className="mr-2" />
                      Publish Course
                    </>
                  )}
                </button>
              )}
            </>
          )}
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
        {course.is_scorm && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900">SCORM Package Information</h3>
            </div>
            {loadingScormInfo ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading package info...
              </div>
            ) : scormPackage ? (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Package:</span>{' '}
                  <span className="text-gray-600">{scormPackage.title}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Version:</span>{' '}
                  <span className="text-gray-600">{scormPackage.version || 'SCORM 1.2'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">SCOs:</span>{' '}
                  <span className="text-gray-600">{scormScos.length} content object(s)</span>
                </div>
                {scormPackage.created_at && (
                  <div>
                    <span className="font-medium text-gray-700">Uploaded:</span>{' '}
                    <span className="text-gray-600">
                      {new Date(scormPackage.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="font-medium mb-1">No SCORM package linked</p>
                <p className="text-xs">
                  This course was created as a SCORM course but no SCORM package is linked. 
                  Please upload a SCORM package and create a new course from it, or link an existing package.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modules Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
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
                course={course}
              />
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                <Megaphone size={14} />
                Course Announcements
              </div>
              <h2 className="mt-2 text-xl font-semibold text-gray-900">
                Keep enrolled learners in the loop
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Publish updates inside this course's lesson viewer. Only enrolled learners can see these messages.
              </p>
            </div>
            <button
              onClick={() => setShowCourseAnnouncementModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={courseAnnouncementSubmitting || !resolvedCourseId}
            >
              <Plus size={16} />
              New Course Announcement
            </button>
          </div>

          <button
            onClick={() => setAnnouncementsExpanded(!announcementsExpanded)}
            className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
          >
            {announcementsExpanded ? (
              <>
                <ChevronDown size={16} />
                Hide Announcements
              </>
            ) : (
              <>
                <ChevronRight size={16} />
                Show Announcements
              </>
            )}
          </button>

          {announcementsExpanded && (
            <>
              {courseAnnouncementsError && (
                <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {courseAnnouncementsError}
                </div>
              )}

              {courseAnnouncementsLoading ? (
                <div className="mt-6 flex items-center gap-3 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading course announcements...
                </div>
              ) : sortedCourseAnnouncements.length === 0 ? (
                <div className="mt-6 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                  No announcements yet. Click "New Course Announcement" to publish one.
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {sortedCourseAnnouncements.map((announcement) => {
                const metadata = (announcement.metadata || {}) as Record<string, any>;
                const ctaLink =
                  metadata?.ctaUrl || metadata?.cta_url || metadata?.link || undefined;
                const timestamp = (() => {
                  const rawDate =
                    announcement.publishedAt || announcement.updatedAt || announcement.createdAt;
                  if (!rawDate) return '';
                  const parsed = new Date(rawDate);
                  if (Number.isNaN(parsed.getTime())) return '';
                  return formatDistanceToNow(parsed, { addSuffix: true });
                })();

                return (
                  <article
                    key={announcement.id}
                    className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 shadow-sm transition hover:shadow-md md:p-6"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2 py-1 font-semibold text-primary-700">
                          {announcement.status}
                        </span>
                        {announcement.isPinned && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-700">
                            <PinIcon size={12} />
                            Pinned
                          </span>
                        )}
                        {timestamp && <span>{timestamp}</span>}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                      {announcement.summary && (
                        <p className="text-sm text-gray-600">{announcement.summary}</p>
                      )}
                      <div
                        className="prose prose-sm max-w-none text-gray-700"
                        dangerouslySetInnerHTML={{ __html: announcement.bodyHtml }}
                      />
                      {metadata && Object.keys(metadata).length > 0 && (
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                          {Array.isArray(metadata.changes) && metadata.changes.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-1 font-semibold text-primary-700">
                              Updates: {metadata.changes.join(', ')}
                            </span>
                          )}
                          {typeof metadata.moduleName === 'string' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-1 font-semibold text-primary-700">
                              Module: {metadata.moduleName}
                            </span>
                          )}
                          {typeof metadata.lessonName === 'string' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-1 font-semibold text-primary-700">
                              Lesson: {metadata.lessonName}
                            </span>
                          )}
                          {typeof metadata.quizTitle === 'string' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-1 font-semibold text-primary-700">
                              Quiz: {metadata.quizTitle}
                            </span>
                          )}
                        </div>
                      )}
                      {announcement.media && announcement.media.length > 0 && (
                        <div className="grid gap-2 md:grid-cols-2">
                          {announcement.media.map((media) => (
                            <a
                              key={media.id}
                              href={media.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition hover:border-primary-200 hover:text-primary-700"
                            >
                              <div className="flex items-center gap-2">
                                <PinIcon size={12} />
                                <span>{media.title || media.mediaType}</span>
                              </div>
                              <span className="text-[11px] text-gray-400">
                                {media.fileSize ? formatFileSize(media.fileSize) : media.mimeType || ''}
                              </span>
                            </a>
                          ))}
                        </div>
                      )}
                      {ctaLink && (
                        <a
                          href={ctaLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
                        >
                          View details →
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
                </div>
              )}
            </>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
              <MessageSquareHeart size={14} />
              Review Prompt Settings
            </div>
              <h2 className="mt-2 text-xl font-semibold text-gray-900">
                Control how and when students are prompted
              </h2>
            <p className="mt-1 text-sm text-gray-600">
                Configure the cadence for in-course review requests. Encourage timely feedback without disrupting learners.
            </p>
          </div>
          <button
            onClick={loadReviewSettings}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
          >
            <Sparkles className="h-4 w-4" />
            Reset draft
          </button>
        </div>

        <button
          onClick={() => setReviewSettingsExpanded(!reviewSettingsExpanded)}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
        >
          {reviewSettingsExpanded ? (
            <>
              <ChevronDown size={16} />
              Hide Settings
            </>
          ) : (
            <>
              <ChevronRight size={16} />
              Show Settings
            </>
          )}
        </button>

        {reviewSettingsExpanded && (
          <>
        {settingsError && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {settingsError}
          </div>
        )}

        <form onSubmit={handleSaveReviewSettings} className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Prompt trigger</label>
            <select
              value={settingsDraft.trigger_type}
            onChange={(event) => {
              const nextType = event.target.value as 'percentage' | 'lesson_count' | 'manual';
              setSettingsDraft((prev) => ({
                ...prev,
                trigger_type: nextType,
                trigger_value:
                  nextType === 'manual'
                    ? null
                    : prev.trigger_value ?? (nextType === 'percentage' ? 20 : 3),
              }));
            }}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              disabled={settingsLoading || settingsSaving}
            >
              <option value="percentage">Percentage of course progress</option>
              <option value="lesson_count">After completing N lessons</option>
              <option value="manual">Manual only</option>
            </select>
          </div>

          {settingsDraft.trigger_type !== 'manual' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                    {settingsDraft.trigger_type === 'percentage'
                      ? 'Progress percentage'
                      : 'Lessons completed'}
              </label>
              <input
                type="number"
                min={settingsDraft.trigger_type === 'percentage' ? 1 : 1}
                max={settingsDraft.trigger_type === 'percentage' ? 100 : undefined}
                value={settingsDraft.trigger_value ?? ''}
                onChange={(event) =>
                  setSettingsDraft((prev) => ({
                    ...prev,
                    trigger_value: event.target.value ? Number(event.target.value) : null,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                disabled={settingsLoading || settingsSaving}
                placeholder={settingsDraft.trigger_type === 'percentage' ? 'e.g. 20' : 'e.g. 3'}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Prompt cooldown (days)</label>
            <input
              type="number"
              min={0}
              value={settingsDraft.cooldown_days}
              onChange={(event) =>
                setSettingsDraft((prev) => ({
                  ...prev,
                  cooldown_days: Number(event.target.value),
                }))
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              disabled={settingsLoading || settingsSaving}
              placeholder="30"
            />
          </div>

          <div className="flex items-center gap-2 pt-6">
            <input
              id="allow-multiple"
              type="checkbox"
              checked={settingsDraft.allow_multiple}
              onChange={(event) =>
                setSettingsDraft((prev) => ({ ...prev, allow_multiple: event.target.checked }))
              }
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              disabled={settingsLoading || settingsSaving}
            />
            <label htmlFor="allow-multiple" className="text-sm text-gray-700">
              Allow learners to submit multiple reviews over time
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="manual-trigger"
              type="checkbox"
              checked={settingsDraft.manual_trigger_enabled}
              onChange={(event) =>
                setSettingsDraft((prev) => ({
                  ...prev,
                  manual_trigger_enabled: event.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              disabled={settingsLoading || settingsSaving}
            />
            <label htmlFor="manual-trigger" className="text-sm text-gray-700">
              Allow instructors to trigger prompts manually
            </label>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Optional message displayed in the prompt
            </label>
            <textarea
              rows={3}
              value={settingsDraft.prompt_message || ''}
              onChange={(event) =>
                setSettingsDraft((prev) => ({ ...prev, prompt_message: event.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="Share any context or highlight the type of feedback you're hoping for."
              disabled={settingsLoading || settingsSaving}
            />
          </div>

          <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={loadReviewSettings}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={settingsLoading || settingsSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
                  {settingsSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
              {settingsSaving ? 'Saving...' : 'Save settings'}
            </button>
          </div>
        </form>
          </>
        )}
        </div>
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
    </>
  );
};

// Module with Lessons Component
interface ModuleWithLessonsProps {
  module: any;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  course: any;
}

const ModuleWithLessons: React.FC<ModuleWithLessonsProps> = ({ module, index, isExpanded, onToggle, onDelete, course }) => {
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
  const [showScormModal, setShowScormModal] = useState(false);
  const [scormFile, setScormFile] = useState<File | null>(null);
  const [uploadingScorm, setUploadingScorm] = useState(false);
  const [scormScos, setScormScos] = useState<any[]>([]);
  const [scormPackage, setScormPackage] = useState<any | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<any | null>(null);

  const handleUploadScormAndCreateLesson = async (sco: any) => {
    try {
      const newLesson = await createLesson({
        module_id: module.id,
        title: sco.title || sco.identifier || 'SCORM Lesson',
        content: [],
        lesson_type: 'scorm',
        scorm_sco_id: sco.id,
        status: 'draft',
      });
      setShowScormModal(false);
      setScormFile(null);
      setScormScos([]);
      setScormPackage(null);
      showToast('SCORM lesson created', 'success');
      if (newLesson) {
        setEditingLesson(newLesson);
      }
    } catch (err: any) {
      console.error('Failed to create SCORM lesson', err);
      showToast(err.message || 'Failed to create SCORM lesson', 'error');
    }
  };

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
                          onClick={(e) => {
                            e.stopPropagation();
                            setLessonToDelete(lesson);
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

              {/* Add Lesson Actions */}
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
              {showAddLesson ? (
                  <form onSubmit={handleAddLesson} className="flex flex-1 flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Lesson title..."
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                  />
                  <label className="sr-only" htmlFor={`lesson-status-${module.id}`}>
                    Lesson status
                  </label>
                  <select
                    id={`lesson-status-${module.id}`}
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
                    className="flex-1 py-2 text-sm text-primary-600 border border-dashed border-primary-300 rounded hover:bg-primary-50 transition-colors"
                >
                  + Add Lesson
                </button>
              )}
                {/* SCORM lesson creation removed - use /school/courses/scorm to create SCORM courses */}
              </div>

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
          courseTitle={course?.title}
          courseSlug={course?.slug}
          courseId={course?.id}
          tenantName={course?.tenant?.name || course?.tenant_name || course?.school?.name}
          tenantSlug={course?.tenant?.slug || course?.tenant_slug}
          tenantId={course?.tenant_id}
        />
      )}
      {/* Lesson Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!lessonToDelete}
        onClose={() => setLessonToDelete(null)}
        onConfirm={async () => {
          if (!lessonToDelete) return;
          try {
            await deleteLesson(lessonToDelete.id);
            showToast('Lesson deleted', 'success');
          } catch (err: any) {
            showToast(err.message || 'Failed to delete lesson', 'error');
          } finally {
            setLessonToDelete(null);
          }
        }}
        title="Delete lesson?"
        message={
          lessonToDelete
            ? `Are you sure you want to delete the lesson "${lessonToDelete.title}"? This action cannot be undone.`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

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

      {/* SCORM Lesson Modal */}
      {showScormModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">
                Add SCORM Lesson to &quot;{module.title}&quot;
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (uploadingScorm) return;
                  setShowScormModal(false);
                  setScormFile(null);
                  setScormScos([]);
                  setScormPackage(null);
                }}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close SCORM lesson modal"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {!scormPackage && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-600">
                    Upload a SCORM 1.2 package (.zip). SunLMS will scan it for launchable SCOs and let you pick which one
                    should become a lesson in this module.
                  </p>
                  <input
                    type="file"
                    accept=".zip,application/zip,application/x-zip-compressed"
                    onChange={(e) => setScormFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-gray-700"
                    title="Select SCORM package zip file"
                  />
                  <button
                    type="button"
                    disabled={!scormFile || uploadingScorm}
                    className="inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={async () => {
                      if (!scormFile) return;
                      try {
                        setUploadingScorm(true);
                        const res = await api.scorm.uploadPackage(scormFile, course?.id);
                        if (!res.success || !res.data) {
                          throw new Error(res.message || 'Failed to upload SCORM package');
                        }
                        setScormPackage(res.data.package);
                        setScormScos(res.data.scos || []);
                      } catch (err: any) {
                        console.error('SCORM upload failed', err);
                        showToast(err.message || 'Failed to upload SCORM package', 'error');
                      } finally {
                        setUploadingScorm(false);
                      }
                    }}
                  >
                    {uploadingScorm ? 'Uploading…' : 'Upload & Scan Package'}
                  </button>
                </div>
              )}

              {scormPackage && (
                <div className="space-y-3">
                  <div className="text-xs text-gray-700">
                    <p className="font-semibold">Package: {scormPackage.title}</p>
                    <p className="text-gray-500">
                      Found {scormScos.length} SCO{scormScos.length === 1 ? '' : 's'}. Choose one to create a lesson.
                    </p>
                  </div>
                  <div className="max-h-64 overflow-y-auto border border-gray-200 rounded divide-y divide-gray-100">
                    {scormScos.map((sco) => (
                      <button
                        key={sco.id}
                        type="button"
                    className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 flex items-center justify-between"
                    title={`Use SCO ${sco.title || sco.identifier || ''} as lesson content`}
                        onClick={async () => {
                          try {
                            const newLesson = await createLesson({
                              module_id: module.id,
                              title: sco.title || sco.identifier || 'SCORM Lesson',
                              content: [],
                              lesson_type: 'scorm',
                              scorm_sco_id: sco.id,
                              status: 'draft',
                            });
                            setShowScormModal(false);
                            setScormFile(null);
                            setScormScos([]);
                            setScormPackage(null);
                            showToast('SCORM lesson created', 'success');
                            if (newLesson) {
                              setEditingLesson(newLesson);
                            }
                          } catch (err: any) {
                            console.error('Failed to create SCORM lesson', err);
                            showToast(err.message || 'Failed to create SCORM lesson', 'error');
                          }
                        }}
                      >
                        <div>
                          <div className="font-medium text-gray-900">
                            {sco.title || sco.identifier || 'Untitled SCO'}
                          </div>
                          <div className="text-[11px] text-gray-500 break-all">
                            {sco.launch_path}
                          </div>
                        </div>
                        {sco.is_entry_point && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                            Entry
                          </span>
                        )}
                      </button>
                    ))}
                    {scormScos.length === 0 && (
                      <div className="px-3 py-2 text-xs text-gray-500">
                        No launchable SCOs found in this package.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  if (uploadingScorm) return;
                  setShowScormModal(false);
                  setScormFile(null);
                  setScormScos([]);
                  setScormPackage(null);
                }}
                className="px-3 py-1.5 text-xs text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple SCORM modal and creation flow could be further extracted, but is kept inline for now.

export default CourseDetailsPage;

