/* eslint-disable @typescript-eslint/no-explicit-any */
// Student Lesson Viewer - View and complete lessons
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Circle, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useProgress } from '../../hooks/useProgress';
import { useAuth } from '../../contexts/AuthContext';
import { useEnrollments } from '../../hooks/useEnrollments';
import { useToast } from '../../contexts/ToastContext';
import api from '../../lib/api';
import PageLayout from '../ui/PageLayout';
import { cleanLessonContent, convertYouTubeUrls, fixIframeAttributes } from '../../utils/htmlUtils';
import CelebrationModal from '../ui/CelebrationModal';

const StudentLessonViewer: React.FC = () => {
  const { courseId: courseSlugOrId, lessonId: lessonParam } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [allLessons, setAllLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isNavigatingNext, setIsNavigatingNext] = useState(false);
  const [resolvedCourseId, setResolvedCourseId] = useState<string | null>(null);
  const [resolvedLessonId, setResolvedLessonId] = useState<string | null>(null);
  
  // Celebration modal state
  const [celebrationModal, setCelebrationModal] = useState<{
    isOpen: boolean;
    type: 'module' | 'course';
    title: string;
    message: string;
    hasNextModule: boolean;
  }>({
    isOpen: false,
    type: 'module',
    title: '',
    message: '',
    hasNextModule: false
  });
  
  const { progress, markLessonComplete, markLessonIncomplete, refresh: refreshProgress } = useProgress(profile?.id, resolvedCourseId || undefined);
  const enrollmentFilters = useMemo(() => (resolvedCourseId ? { course_id: resolvedCourseId } : undefined), [resolvedCourseId]);
  const { enrollments, refreshEnrollments } = useEnrollments(enrollmentFilters as any);
  const { info, success } = useToast();

  useEffect(() => {
    if (courseSlugOrId) {
      fetchCourseData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseSlugOrId]);

  useEffect(() => {
    if (resolvedLessonId && allLessons.length > 0) {
      const lesson = allLessons.find(l => l.id === resolvedLessonId);
      setCurrentLesson(lesson);
    }
  }, [resolvedLessonId, allLessons]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      
      // Fetch course details
      // Resolve course by slug or id
      let resolvedId = courseSlugOrId;
      const isUuidParam = /^[0-9a-fA-F-]{36}$/.test(courseSlugOrId || '');
      if (courseSlugOrId && !isUuidParam) {
        const bySlug = await api.get(`/courses/slug/${courseSlugOrId}`);
        if (bySlug.success && bySlug.data?.id) {
          resolvedId = bySlug.data.id;
        }
      }
      const courseRes = await api.get(`/courses/${resolvedId}`);
      if (courseRes.success) {
        setCourse(courseRes.data);
        setResolvedCourseId(resolvedId);
        // Resolve lesson param (supports slug-uuid like slug-<uuid>)
        let lessonUuid: string | null = null;
        if (lessonParam) {
          const match = lessonParam.match(/[0-9a-fA-F-]{36}$/);
          lessonUuid = match ? match[0] : (/[0-9a-fA-F-]{36}/.test(lessonParam) ? lessonParam : null);
        }
        if (lessonUuid) setResolvedLessonId(lessonUuid);

        // If course param is UUID but slug exists, redirect to pretty course slug, keeping lesson param as is
        if (isUuidParam && courseRes.data?.slug) {
          navigate(`/student/courses/${courseRes.data.slug}/lessons/${lessonParam || ''}`.replace(/\/$/, ''), { replace: true });
        }
      }

      // Fetch modules with lessons
      const modulesRes = await api.get(`/modules/course/${resolvedId}`);
      if (modulesRes.success) {
        const mods = modulesRes.data;
        setModules(mods);

        // Fetch lessons for each module
        const lessonsPromises = mods.map((mod: any) =>
          api.get(`/lessons/module/${mod.id}`)
        );
        
        const lessonsResults = await Promise.all(lessonsPromises);
        const allLessonsFlat: any[] = [];
        
        mods.forEach((mod: any, idx: number) => {
          if (lessonsResults[idx].success) {
            lessonsResults[idx].data.forEach((lesson: any) => {
              allLessonsFlat.push({
                ...lesson,
                module_title: mod.title,
                module_id: mod.id
              });
            });
          }
        });
        
        setAllLessons(allLessonsFlat);
        
        // If no lesson selected, show first lesson
        if (!lessonParam && allLessonsFlat.length > 0) {
          const first = allLessonsFlat[0];
          const slug = (first.title || '').toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
          navigate(`/student/courses/${courseSlugOrId}/lessons/${slug}-${first.id}`, { replace: true });
        }
      }
    } catch (err) {
      console.error('Error fetching course data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (options?: { silent?: boolean }) => {
    if (!currentLesson) return;

    try {
      setIsCompleting(true);
      const isCompleted = isLessonCompleted(currentLesson.id);
      
      if (isCompleted) {
        await markLessonIncomplete(currentLesson.id);
        await refreshProgress();
        await refreshEnrollments(); // Refresh enrollments for dashboard
      } else {
        // Mark lesson complete and get response
        const response = await markLessonComplete(currentLesson.id);
        await refreshProgress();
        await refreshEnrollments(); // Refresh enrollments for dashboard
        
        // Check if module or course completed (skip UI if silent)
        if (!options?.silent && response?.enrollment_progress) {
          const { moduleCompleted, courseCompleted, moduleId } = response.enrollment_progress;
          
          if (courseCompleted) {
            // Show course completion celebration
            setCelebrationModal({
              isOpen: true,
              type: 'course',
              title: 'Course Complete!',
              message: `Congratulations! You have completed "${course?.title}". You can now access your certificate.`,
              hasNextModule: false
            });

            // Attempt to generate certificate if not exists yet
            try {
              const enrollmentId = getEnrollmentIdForCourse();
              if (enrollmentId) {
                await api.post('/api/certificates/generate', { enrollment_id: enrollmentId });
              }
            } catch (e) {
              // Non-blocking: certificate may already exist
              console.warn('Certificate generation attempt skipped/failed:', e);
            }
          } else if (moduleCompleted) {
            // Check if there's a next module
            const currentModuleIndex = modules.findIndex(m => m.id === moduleId);
            const hasNextModule = currentModuleIndex >= 0 && currentModuleIndex < modules.length - 1;
            const nextModule = hasNextModule ? modules[currentModuleIndex + 1] : null;
            
            // Show module completion celebration
            setCelebrationModal({
              isOpen: true,
              type: 'module',
              title: 'Module Complete!',
              message: hasNextModule 
                ? `Great job! You have completed this module. Ready to start "${nextModule?.title}"?`
                : 'Great job! You have completed this module.',
              hasNextModule
            });
          }
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update progress');
    } finally {
      setIsCompleting(false);
    }
  };

  const getEnrollmentIdForCourse = () => {
    const enrollment = enrollments?.find((e: any) => e.course_id === resolvedCourseId);
    return enrollment?.id as string | undefined;
  };

  const navigateToCertificates = () => {
    const enrollmentId = getEnrollmentIdForCourse();
    if (enrollmentId) {
      navigate(`/student/certificates/${enrollmentId}`);
    } else {
      navigate('/student/certificates');
    }
  };

  const isCourseFullyCompleted = () => {
    if (!allLessons || allLessons.length === 0) return false;
    return allLessons.every((l) => isLessonCompleted(l.id));
  };

  const attemptCompleteCourse = () => {
    const total = allLessons.length;
    const done = allLessons.filter((l) => isLessonCompleted(l.id)).length;
    const remaining = total - done;

    if (remaining > 0) {
      info(`You still have ${remaining} lesson${remaining === 1 ? '' : 's'} to complete.`);
      return;
    }

    success('Course completed! Redirecting to your certificate...');
    navigateToCertificates();
  };

  const isLessonCompleted = (lessonId: string) => {
    if (!progress) return false;
    
    // Check if lesson is in completed lessons list
    for (const module of progress) {
      const lessons = module.lessons || [];
      const lesson = lessons.find((l: any) => l.lesson_id === lessonId);
      if (lesson?.completed) return true;
    }
    
    return false;
  };

  const getCurrentLessonIndex = () => {
    return allLessons.findIndex(l => l.id === resolvedLessonId);
  };

  const goToNextLesson = () => {
    const currentIndex = getCurrentLessonIndex();
    if (currentIndex < allLessons.length - 1) {
      const next = allLessons[currentIndex + 1];
      const slug = (next.title || '').toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
      navigate(`/student/courses/${courseSlugOrId}/lessons/${slug}-${next.id}`);
    }
  };

  const handleNextLessonClick = async () => {
    if (!currentLesson) return;
    const currentIndex = getCurrentLessonIndex();
    if (currentIndex >= allLessons.length - 1) return;
    try {
      setIsNavigatingNext(true);
      if (!isLessonCompleted(currentLesson.id)) {
        await handleToggleComplete({ silent: true });
      }
      goToNextLesson();
    } finally {
      setIsNavigatingNext(false);
    }
  };

  const goToNextModule = () => {
    if (!currentLesson) return;
    
    // Find current module
    const currentModuleIndex = modules.findIndex(m => m.id === currentLesson.module_id);
    
    if (currentModuleIndex >= 0 && currentModuleIndex < modules.length - 1) {
      // Get next module
      const nextModule = modules[currentModuleIndex + 1];
      
      // Find first lesson in next module
      const nextModuleLessons = allLessons.filter(l => l.module_id === nextModule.id);
      if (nextModuleLessons.length > 0) {
        const first = nextModuleLessons[0];
        const slug = (first.title || '').toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
        navigate(`/student/courses/${courseSlugOrId}/lessons/${slug}-${first.id}`);
      }
    }
  };

  const goToPreviousLesson = () => {
    const currentIndex = getCurrentLessonIndex();
    if (currentIndex > 0) {
      const prev = allLessons[currentIndex - 1];
      const slug = (prev.title || '').toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
      navigate(`/student/courses/${courseSlugOrId}/lessons/${slug}-${prev.id}`);
    }
  };

  const renderLessonContent = () => {
    if (!currentLesson) return null;

    // Extract and clean HTML content
    let htmlContent = cleanLessonContent(currentLesson.content);
    
    // Apply YouTube URL conversion again as a final step
    htmlContent = convertYouTubeUrls(htmlContent);
    
    // Fix iframe attributes for better embedding
    htmlContent = fixIframeAttributes(htmlContent);
    
    // Debug: Log the content to see what we're working with
    console.log('Raw lesson content:', currentLesson.content);
    console.log('Final HTML content:', htmlContent);

    return (
      <div className="prose max-w-none">
        {/* Video Lesson */}
        {currentLesson.lesson_type === 'video' && currentLesson.video_url && (
          <div className="mb-6">
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <iframe
                src={convertYouTubeUrls(currentLesson.video_url)}
                className="w-full h-full"
                frameBorder={0}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={currentLesson.title}
              />
            </div>
          </div>
        )}

        {/* Document Lesson */}
        {currentLesson.lesson_type === 'document' && currentLesson.document_url && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <a
              href={currentLesson.document_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              📄 Download/View Document →
            </a>
          </div>
        )}

        {/* Text Content */}
        <div 
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          className="lesson-content"
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!course || !currentLesson) {
    return (
      <div className="p-6 text-center text-gray-600">
        Lesson not found or you don't have access to this course.
      </div>
    );
  }

  const currentIndex = getCurrentLessonIndex();
  const isCompleted = isLessonCompleted(currentLesson.id);

  return (
    <>
      {/* Celebration Modal */}
      <CelebrationModal
        isOpen={celebrationModal.isOpen}
        onClose={() => setCelebrationModal({ ...celebrationModal, isOpen: false })}
        type={celebrationModal.type}
        title={celebrationModal.title}
        message={celebrationModal.message}
        onNext={celebrationModal.type === 'course' ? navigateToCertificates : (celebrationModal.hasNextModule ? goToNextModule : undefined)}
        onGoToDashboard={celebrationModal.type === 'course' ? () => navigate('/student/dashboard') : undefined}
        nextButtonText={celebrationModal.type === 'course' ? 'View Certificate' : (celebrationModal.hasNextModule ? 'Start Next Module' : undefined)}
      />

      <PageLayout
        title={course.title}
        breadcrumbs={[
          { label: 'My Courses', href: '/student/courses' },
          { label: course.title },
          { label: currentLesson.title }
        ]}
        actions={
          <button
            onClick={() => navigate('/student/courses')}
            className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Courses
          </button>
        }
      >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Course Structure */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-4">
            <h3 className="font-semibold text-gray-900 mb-4">Course Content</h3>
            <div className="space-y-3">
              {modules.map((module) => {
                const moduleLessons = allLessons.filter(l => l.module_id === module.id);
                const completedInModule = moduleLessons.filter(l => isLessonCompleted(l.id)).length;
                
                return (
                  <div key={module.id} className="space-y-1">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      {module.title}
                    </div>
                    {moduleLessons.map((lesson) => {
                      const completed = isLessonCompleted(lesson.id);
                      const isCurrent = lesson.id === resolvedLessonId;
                      
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => {
                            const slug = (lesson.title || '').toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
                            navigate(`/student/courses/${courseSlugOrId}/lessons/${slug}-${lesson.id}`);
                          }}
                          className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 transition-colors ${
                            isCurrent
                              ? 'bg-primary-50 text-primary-700 font-medium'
                              : completed
                              ? 'text-gray-700 hover:bg-gray-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {completed ? (
                            <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                          ) : (
                            <Circle size={16} className="text-gray-400 flex-shrink-0" />
                          )}
                          <span className="text-sm truncate">{lesson.title}</span>
                        </button>
                      );
                    })}
                    <div className="text-xs text-gray-500 mt-1 px-3">
                      {completedInModule}/{moduleLessons.length} completed
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content - Lesson Viewer */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Lesson Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-500 mb-1">{currentLesson.module_title}</div>
                  <h1 className="text-2xl font-bold text-gray-900">{currentLesson.title}</h1>
                  {currentLesson.estimated_duration_minutes && (
                    <div className="flex items-center text-sm text-gray-600 mt-2">
                      <Clock size={14} className="mr-1" />
                      {currentLesson.estimated_duration_minutes} minutes
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleToggleComplete()}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                    isCompleted
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                  disabled={isCompleting}
                >
                  <CheckCircle size={18} className="mr-2" />
                  {isCompleting ? (isCompleted ? 'Updating...' : 'Completing...') : (isCompleted ? 'Completed' : 'Mark as Complete')}
                </button>
              </div>
            </div>

            {/* Lesson Content */}
            <div className="p-6">
              {renderLessonContent()}
            </div>

            {/* Navigation */}
            <div className="p-6 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={goToPreviousLesson}
                disabled={currentIndex === 0}
                className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} className="mr-1" />
                Previous
              </button>

              <div className="text-sm text-gray-600">
                Lesson {currentIndex + 1} of {allLessons.length}
              </div>

              {currentIndex === allLessons.length - 1 ? (
                <button
                  onClick={isCourseFullyCompleted() ? navigateToCertificates : attemptCompleteCourse}
                  className="flex items-center px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                >
                  {isCourseFullyCompleted() ? 'View Certificate' : 'Complete Course'}
                  <ChevronRight size={18} className="ml-1" />
                </button>
              ) : (
                <button
                  onClick={handleNextLessonClick}
                  disabled={currentIndex === allLessons.length - 1 || isNavigatingNext || isCompleting}
                  className="flex items-center px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isNavigatingNext || isCompleting ? 'Completing...' : 'Next'}
                  <ChevronRight size={18} className="ml-1" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      </PageLayout>
    </>
  );
};

export default StudentLessonViewer;

