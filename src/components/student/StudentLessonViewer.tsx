/* eslint-disable @typescript-eslint/no-explicit-any */
// Student Lesson Viewer - View and complete lessons
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Circle, ChevronLeft, ChevronRight, Clock, Menu, X } from 'lucide-react';
import { useProgress } from '../../hooks/useProgress';
import { useAuth } from '../../contexts/AuthContext';
import { useEnrollments } from '../../hooks/useEnrollments';
import { useToast } from '../../contexts/ToastContext';
import api, { quizzesApi } from '../../lib/api';
import PageLayout from '../ui/PageLayout';
import { cleanLessonContent, convertYouTubeUrls, fixIframeAttributes } from '../../utils/htmlUtils';
import CelebrationModal from '../ui/CelebrationModal';
import QuizEngine from '../quiz/QuizEngine';

const StudentLessonViewer: React.FC = () => {
  const { courseId: courseSlugOrId, lessonId: lessonParam } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [currentQuiz, setCurrentQuiz] = useState<any>(null);
  const [allLessons, setAllLessons] = useState<any[]>([]);
  const [allQuizzes, setAllQuizzes] = useState<any[]>([]);
  const [allContent, setAllContent] = useState<any[]>([]);
  const [quizCompletionStatus, setQuizCompletionStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isNavigatingNext, setIsNavigatingNext] = useState(false);
  const [resolvedCourseId, setResolvedCourseId] = useState<string | null>(null);
  const [resolvedLessonId, setResolvedLessonId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
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
  const { info, success, error } = useToast();

  useEffect(() => {
    if (courseSlugOrId) {
      fetchCourseData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseSlugOrId]);

  // Combine lessons and quizzes into a single content array
  useEffect(() => {
    const combinedContent = [...allLessons, ...allQuizzes].sort((a, b) => {
      // Sort by module order first
      if (a.module_id !== b.module_id) {
        const aModule = modules.find(m => m.id === a.module_id);
        const bModule = modules.find(m => m.id === b.module_id);
        return (aModule?.order_index || 0) - (bModule?.order_index || 0);
      }
      
      // Within the same module, lessons should come before quizzes
      // Lessons don't have a 'type' property, quizzes do
      const aIsQuiz = 'type' in a && a.type === 'quiz';
      const bIsQuiz = 'type' in b && b.type === 'quiz';
      
      if (aIsQuiz && !bIsQuiz) return 1; // Quiz comes after lesson
      if (!aIsQuiz && bIsQuiz) return -1; // Lesson comes before quiz
      
      // If both are same type, sort by creation date
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
    setAllContent(combinedContent);
  }, [allLessons, allQuizzes, modules]);

  // Fetch quiz completion status when quizzes are loaded
  useEffect(() => {
    if (allQuizzes.length > 0 && profile?.id) {
      allQuizzes.forEach(quiz => {
        fetchQuizCompletionStatus(quiz.id);
      });
    }
  }, [allQuizzes, profile?.id]);

  useEffect(() => {
    if (resolvedLessonId && allContent.length > 0) {
      const content = allContent.find(item => item.id === resolvedLessonId);
      if (content?.type === 'quiz') {
        setCurrentQuiz(content);
        setCurrentLesson(null);
      } else {
        setCurrentLesson(content);
        setCurrentQuiz(null);
      }
    }
  }, [resolvedLessonId, allContent]);

  // Update resolvedLessonId when the lesson route param changes (e.g., via sidebar clicks)
  useEffect(() => {
    if (!lessonParam) return;
    const match = lessonParam.match(/[0-9a-fA-F-]{36}$/);
    const lessonUuid = match ? match[0] : (/[0-9a-fA-F-]{36}/.test(lessonParam) ? lessonParam : null);
    if (lessonUuid && lessonUuid !== resolvedLessonId) {
      setResolvedLessonId(lessonUuid);
    }
  }, [lessonParam, resolvedLessonId]);

  // Reset scroll position on lesson change so new page starts at top
  useEffect(() => {
    if (!resolvedLessonId) return;
    // Try scrolling the main content into view first
    const contentEl = document.querySelector('.lesson-content');
    if (contentEl && 'scrollIntoView' in contentEl) {
      (contentEl as HTMLElement).scrollIntoView({ behavior: 'instant', block: 'start' });
    }
    // Fallback to window scroll
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [resolvedLessonId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      
      // Fetch course details
      // Resolve course by slug or id
      let resolvedId: string = (courseSlugOrId as string);
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
          api.get(`/lessons/module/${mod.id}?audience=student`)
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

        // Fetch quizzes for each module
        const quizzesPromises = mods.map((mod: any) =>
          quizzesApi.listByModule(mod.id)
        );
        
        const quizzesResults = await Promise.all(quizzesPromises);
        const allQuizzesFlat: any[] = [];
        
        // Fetch full quiz data with questions for each quiz
        for (let idx = 0; idx < mods.length; idx++) {
          const mod = mods[idx];
          if (quizzesResults[idx].success) {
            for (const quiz of quizzesResults[idx].data) {
              try {
                // Fetch full quiz data with questions for student audience
                const fullQuizRes = await api.get(`/quizzes/${quiz.id}?audience=student`);
                if (fullQuizRes.success) {
                  allQuizzesFlat.push({
                    ...fullQuizRes.data,
                    module_title: mod.title,
                    module_id: mod.id,
                    type: 'quiz'
                  });
                }
              } catch (error) {
                console.warn(`Failed to fetch quiz ${quiz.id}:`, error);
                // Still add the basic quiz data
                allQuizzesFlat.push({
                  ...quiz,
                  module_title: mod.title,
                  module_id: mod.id,
                  type: 'quiz'
                });
              }
            }
          }
        }
        
        setAllQuizzes(allQuizzesFlat);
        
        // If no lesson selected, show first content (lesson or quiz)
        if (!lessonParam && (allLessonsFlat.length > 0 || allQuizzesFlat.length > 0)) {
          const allContent = [...allLessonsFlat, ...allQuizzesFlat].sort((a, b) => {
            // Sort by module order first
            if (a.module_id !== b.module_id) {
              const aModule = mods.find((m: any) => m.id === a.module_id);
              const bModule = mods.find((m: any) => m.id === b.module_id);
              return (aModule?.order_index || 0) - (bModule?.order_index || 0);
            }
            
            // Within the same module, lessons should come before quizzes
            const aIsQuiz = 'type' in a && a.type === 'quiz';
            const bIsQuiz = 'type' in b && b.type === 'quiz';
            
            if (aIsQuiz && !bIsQuiz) return 1; // Quiz comes after lesson
            if (!aIsQuiz && bIsQuiz) return -1; // Lesson comes before quiz
            
            // If both are same type, sort by creation date
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          });
          
          const first = allContent[0];
          const slug = (first.title || '').toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
          const courseSlug = courseRes.data?.slug || courseSlugOrId;
          navigate(`/student/courses/${courseSlug}/lessons/${slug}-${first.id}`, { replace: true });
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
      error(err.message || 'Failed to update progress');
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
    if (!allContent || allContent.length === 0) return false;
    return allContent.every((item) => isLessonCompleted(item.id));
  };

  const attemptCompleteCourse = () => {
    const total = allContent.length;
    const done = allContent.filter((item) => isLessonCompleted(item.id)).length;
    const remaining = total - done;

    if (remaining > 0) {
      info(`You still have ${remaining} item${remaining === 1 ? '' : 's'} to complete.`);
      return;
    }

    success('Course completed! Redirecting to your certificate...');
    navigateToCertificates();
  };

  const fetchQuizCompletionStatus = async (quizId: string) => {
    try {
      const result = await api.get(`/quizzes/${quizId}/attempts`);
      if (result.success) {
        const hasCompletedAttempt = result.data.some((attempt: any) => attempt.status === 'completed');
        setQuizCompletionStatus(prev => ({
          ...prev,
          [quizId]: hasCompletedAttempt
        }));
        return hasCompletedAttempt;
      }
    } catch (error) {
      console.warn(`Failed to fetch quiz completion status for ${quizId}:`, error);
    }
    return false;
  };

  const isLessonCompleted = (contentId: string) => {
    if (!progress) return false;
    
    // Check if it's a quiz by looking in allQuizzes
    const isQuiz = allQuizzes.some(quiz => quiz.id === contentId);
    
    if (isQuiz) {
      // Check cached quiz completion status
      return quizCompletionStatus[contentId] || false;
    }
    
    // Check if lesson is in completed lessons list
    for (const module of progress) {
      const lessons = module.lessons || [];
      const lesson = lessons.find((l: any) => l.lesson_id === contentId);
      if (lesson?.completed) return true;
    }
    
    return false;
  };

  const getCurrentContentIndex = () => {
    return allContent.findIndex(item => item.id === resolvedLessonId);
  };

  const goToNextContent = () => {
    const currentIndex = getCurrentContentIndex();
    if (currentIndex < allContent.length - 1) {
      const next = allContent[currentIndex + 1];
      const slug = (next.title || '').toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
      const courseSlug = course?.slug || courseSlugOrId;
      navigate(`/student/courses/${courseSlug}/lessons/${slug}-${next.id}`);
    }
  };

  const handleNextContentClick = async () => {
    const currentContent = currentLesson || currentQuiz;
    if (!currentContent) return;
    const currentIndex = getCurrentContentIndex();
    if (currentIndex >= allContent.length - 1) return;
    try {
      setIsNavigatingNext(true);
      // If not completed, confirm with the user before proceeding
      if (!isLessonCompleted(currentContent.id)) {
        const proceed = window.confirm(`You have not marked this ${currentContent.type === 'quiz' ? 'quiz' : 'lesson'} as complete. Continue to next item?`);
        if (!proceed) return;
      }
      goToNextContent();
    } finally {
      setIsNavigatingNext(false);
    }
  };

  const goToNextModule = () => {
    const currentContent = currentLesson || currentQuiz;
    if (!currentContent) return;
    
    // Find current module
    const currentModuleIndex = modules.findIndex(m => m.id === currentContent.module_id);
    
    if (currentModuleIndex >= 0 && currentModuleIndex < modules.length - 1) {
      // Get next module
      const nextModule = modules[currentModuleIndex + 1];
      
      // Find first content (lesson or quiz) in next module
      const nextModuleContent = allContent.filter(item => item.module_id === nextModule.id);
      if (nextModuleContent.length > 0) {
        const first = nextModuleContent[0];
        const slug = (first.title || '').toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
        const courseSlug = course?.slug || courseSlugOrId;
        navigate(`/student/courses/${courseSlug}/lessons/${slug}-${first.id}`);
      }
    }
  };

  const goToPreviousContent = () => {
    const currentIndex = getCurrentContentIndex();
    if (currentIndex > 0) {
      const prev = allContent[currentIndex - 1];
      const slug = (prev.title || '').toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
      const courseSlug = course?.slug || courseSlugOrId;
      navigate(`/student/courses/${courseSlug}/lessons/${slug}-${prev.id}`);
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

  const renderQuizContent = () => {
    if (!currentQuiz) return null;

    // Transform quiz data to match QuizEngine interface
    const questions = currentQuiz.questions?.map((q: any) => ({
      id: q.id,
      type: q.question_type,
      text: q.question_text,
      options: q.options,
      correctAnswer: q.correct_answer,
      points: q.points || 1,
      explanation: q.explanation
    })) || [];

    const handleQuizComplete = async (score: number, answers: Record<string, any>) => {
      try {
        // Submit quiz attempt
        const result = await quizzesApi.submit(currentQuiz.id, { answers });
        if (result.success) {
          success(`Quiz completed! Score: ${score}%`);
          // Update quiz completion status
          setQuizCompletionStatus(prev => ({
            ...prev,
            [currentQuiz.id]: true
          }));
          // Refresh progress to update completion status
          await refreshProgress();
          await refreshEnrollments();
          
          // Check for module/course completion celebrations (same as lesson completion)
          if (result.data?.progressUpdate) {
            const { moduleCompleted, courseCompleted, moduleId } = result.data.progressUpdate;
            
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
      } catch (error: any) {
        error(error.message || 'Failed to submit quiz');
      }
    };

    return (
      <div className="prose max-w-none">
        <div className="mb-6">
          <p className="text-gray-600">{currentQuiz.description}</p>
        </div>
        
        <QuizEngine
          questions={questions}
          timeLimit={currentQuiz.time_limit_minutes}
          passingScore={currentQuiz.passing_score || 70}
          showFeedback={currentQuiz.show_feedback !== 'never'}
          onComplete={handleQuizComplete}
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

  if (!course || (!currentLesson && !currentQuiz)) {
    return (
      <div className="p-6 text-center text-gray-600">
        Content not found or you don't have access to this course.
      </div>
    );
  }

  const currentContent = currentLesson || currentQuiz;
  const isCompleted = currentContent ? isLessonCompleted(currentContent.id) : false;

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
          { label: currentLesson?.title || currentQuiz?.title || 'Content' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            {/* Mobile sidebar toggle button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden flex items-center px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 active:scale-95"
              aria-label="Toggle course navigation"
              title="Toggle course navigation"
            >
              <Menu size={18} className={`transition-transform duration-200 ${isSidebarOpen ? 'rotate-90' : 'rotate-0'}`} />
            </button>
            
            <button
              onClick={() => navigate('/student/courses')}
              className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft size={18} className="mr-2" />
              <span className="hidden sm:inline">Back to Courses</span>
              <span className="sm:hidden">Back</span>
            </button>
          </div>
        }
      >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Mobile sidebar overlay */}
        <div 
          className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300 ${
            isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setIsSidebarOpen(false)}
        />
        
        {/* Sidebar - Course Structure */}
        <div className={`lg:col-span-1 ${
          isSidebarOpen 
            ? 'fixed inset-y-0 left-0 w-80 bg-white shadow-xl z-50 lg:relative lg:shadow-sm lg:inset-auto lg:w-auto transform transition-transform duration-300 ease-in-out translate-x-0' 
            : 'fixed inset-y-0 left-0 w-80 bg-white shadow-xl z-50 lg:relative lg:shadow-sm lg:inset-auto lg:w-auto transform transition-transform duration-300 ease-in-out -translate-x-full lg:translate-x-0 lg:block'
        }`}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-4 h-full lg:h-auto overflow-y-auto">
            {/* Mobile close button */}
            <div className="flex justify-between items-center mb-4 lg:hidden">
              <h3 className="font-semibold text-gray-900">Course Navigation</h3>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 text-gray-500 hover:text-gray-700 transition-colors duration-200 hover:bg-gray-100 rounded"
                aria-label="Close navigation"
                title="Close navigation"
              >
                <X size={20} className="transition-transform duration-200 hover:scale-110" />
              </button>
            </div>
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Course Progress</h3>
              {(() => {
                const totalContent = allContent.length;
                const completedContent = allContent.filter(item => isLessonCompleted(item.id)).length;
                const progressPercentage = totalContent > 0 ? Math.round((completedContent / totalContent) * 100) : 0;
                
                return (
                  <div>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Overall Progress</span>
                      <span className="font-medium">{progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {completedContent} of {totalContent} lessons completed
                    </div>
                  </div>
                );
              })()}
            </div>
            <h3 className="font-semibold text-gray-900 mb-4">Course Content</h3>
            <div className="space-y-3">
              {modules.map((module) => {
                const moduleContent = allContent.filter(item => item.module_id === module.id);
                const completedInModule = moduleContent.filter(item => isLessonCompleted(item.id)).length;
                
                return (
                  <div key={module.id} className="space-y-1">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      {module.title}
                    </div>
                    {moduleContent.map((content) => {
                      const completed = isLessonCompleted(content.id);
                      const isCurrent = content.id === resolvedLessonId;
                      const isQuiz = content.type === 'quiz';
                      
                      return (
                        <button
                          key={content.id}
                          onClick={() => {
                            const slug = (content.title || '').toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
                            const courseSlug = course?.slug || courseSlugOrId;
                            navigate(`/student/courses/${courseSlug}/lessons/${slug}-${content.id}`);
                            // Close mobile sidebar when navigating
                            setIsSidebarOpen(false);
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
                          <span className="text-sm truncate flex items-center gap-1">
                            {isQuiz && <span className="text-xs bg-blue-100 text-blue-600 px-1 rounded">Quiz</span>}
                            {content.title}
                          </span>
                        </button>
                      );
                    })}
                    <div className="text-xs text-gray-500 mt-1 px-3">
                      {completedInModule}/{moduleContent.length} completed
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content - Lesson Viewer */}
        <div className="col-span-1 lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Content Header */}
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="text-sm text-gray-500 mb-1">
                    {currentLesson?.module_title || currentQuiz?.module_title}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex flex-col sm:flex-row sm:items-center gap-2">
                    {currentQuiz && <span className="text-sm bg-blue-100 text-blue-600 px-2 py-1 rounded self-start">Quiz</span>}
                    <span className="break-words">{currentLesson?.title || currentQuiz?.title}</span>
                  </h1>
                  {(currentLesson?.estimated_duration_minutes || currentQuiz?.time_limit_minutes) && (
                    <div className="flex items-center text-sm text-gray-600 mt-2">
                      <Clock size={14} className="mr-1" />
                      {currentLesson?.estimated_duration_minutes || currentQuiz?.time_limit_minutes} minutes
                    </div>
                  )}
                </div>
                {currentLesson && (
                  <button
                    onClick={() => handleToggleComplete()}
                    className={`flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto ${
                      isCompleted
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                    disabled={isCompleting}
                  >
                    <CheckCircle size={18} className="mr-2" />
                    <span className="hidden sm:inline">
                      {isCompleting ? (isCompleted ? 'Updating...' : 'Completing...') : (isCompleted ? 'Completed' : 'Mark as Complete')}
                    </span>
                    <span className="sm:hidden">
                      {isCompleting ? (isCompleted ? 'Updating...' : 'Completing...') : (isCompleted ? 'Done' : 'Complete')}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6">
              {currentLesson && renderLessonContent()}
              {currentQuiz && renderQuizContent()}
            </div>

            {/* Navigation */}
            <div className="p-4 sm:p-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <button
                  onClick={goToPreviousContent}
                  disabled={getCurrentContentIndex() === 0}
                  className="flex items-center justify-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  <ChevronLeft size={18} className="mr-1" />
                  Previous
                </button>

                <div className="text-sm text-gray-600 text-center order-first sm:order-none">
                  {currentLesson ? 'Lesson' : currentQuiz ? 'Quiz' : 'Item'} {getCurrentContentIndex() + 1} of {allContent.length}
                </div>

                {getCurrentContentIndex() === allContent.length - 1 ? (
                  <button
                    onClick={isCourseFullyCompleted() ? navigateToCertificates : attemptCompleteCourse}
                    className="flex items-center justify-center px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 w-full sm:w-auto"
                  >
                    <span className="hidden sm:inline">
                      {isCourseFullyCompleted() ? 'View Certificate' : 'Complete Course'}
                    </span>
                    <span className="sm:hidden">
                      {isCourseFullyCompleted() ? 'Certificate' : 'Complete'}
                    </span>
                    <ChevronRight size={18} className="ml-1" />
                  </button>
                ) : (
                  <button
                    onClick={handleNextContentClick}
                    disabled={getCurrentContentIndex() === allContent.length - 1 || isNavigatingNext}
                    className="flex items-center justify-center px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  >
                    {isNavigatingNext ? 'Loading...' : 'Next'}
                    <ChevronRight size={18} className="ml-1" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </PageLayout>
    </>
  );
};

export default StudentLessonViewer;

