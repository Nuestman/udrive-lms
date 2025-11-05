/* eslint-disable @typescript-eslint/no-explicit-any */
// Student Lesson Viewer - View and complete lessons
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Circle, ChevronLeft, ChevronRight, Clock, Menu, X, Settings } from 'lucide-react';
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
  const { profile, user } = useAuth();
  
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [currentQuiz, setCurrentQuiz] = useState<any>(null);
  const [allLessons, setAllLessons] = useState<any[]>([]);
  const [allQuizzes, setAllQuizzes] = useState<any[]>([]);
  const [allContent, setAllContent] = useState<any[]>([]);
  const [quizCompletionStatus, setQuizCompletionStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [courseError, setCourseError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isNavigatingNext, setIsNavigatingNext] = useState(false);
  const [resolvedCourseId, setResolvedCourseId] = useState<string | null>(null);
  const [resolvedLessonId, setResolvedLessonId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Quiz state
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  
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
  const enrollmentFilters = useMemo(() => {
    const base: any = {};
    if (profile?.id) base.student_id = profile.id;
    if (resolvedCourseId) base.course_id = resolvedCourseId;
    return Object.keys(base).length ? base : undefined;
  }, [profile?.id, resolvedCourseId]);
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

  // Monitor progress changes and ensure completion status consistency
  useEffect(() => {
    if (progress) {
      // Sync quiz completion status from progress data
      if (allQuizzes.length > 0) {
        allQuizzes.forEach(quiz => {
          const isCompletedInProgress = progress.some((module: any) => 
            module.quizzes?.some((q: any) => q.quiz_id === quiz.id && q.completed)
          );
          
          if (isCompletedInProgress && !quizCompletionStatus[quiz.id]) {
            console.log(`[Progress Sync] Syncing quiz completion status for ${quiz.id}`);
            setQuizCompletionStatus(prev => ({
              ...prev,
              [quiz.id]: true
            }));
          }
        });
      }
      
      // Debug: Log the complete progress structure
      console.log('[Progress Monitor] Current progress structure:', progress);
      progress.forEach((module: any, index: number) => {
        console.log(`[Progress Monitor] Module ${index}:`, {
          module_id: module.module_id,
          module_title: module.module_title,
          lessons: module.lessons?.map((l: any) => ({ id: l.lesson_id, completed: l.completed })) || [],
          quizzes: module.quizzes?.map((q: any) => ({ id: q.quiz_id, completed: q.completed })) || []
        });
      });
    }
  }, [progress, allQuizzes, quizCompletionStatus]);

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
      setCourseError(null);
      
      // Fetch course details
      // Resolve course by slug or id
      let resolvedId: string = (courseSlugOrId as string);
      const isUuidParam = /^[0-9a-fA-F-]{36}$/.test(courseSlugOrId || '');
      if (courseSlugOrId && !isUuidParam) {
        const bySlug = await api.get(`/courses/slug/${courseSlugOrId}`);
        if (bySlug.success && bySlug.data?.id) {
          resolvedId = bySlug.data.id;
        } else {
          // If slug lookup fails, try as UUID anyway
          console.warn('Course slug lookup failed, trying as UUID:', courseSlugOrId);
        }
      }
      const courseRes = await api.get(`/courses/${resolvedId}`);
      if (!courseRes.success) {
        setCourseError(courseRes.error || 'Course not found or access denied');
        setLoading(false);
        return;
      }
      
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
      } else {
        // Modules fetch failed
        if (!modulesRes.success) {
          setCourseError(modulesRes.error || 'Failed to load course modules. Please try again.');
          setLoading(false);
          return;
        }
      }
    } catch (err: any) {
      console.error('Error fetching course data:', err);
      setCourseError(err?.message || err?.error || 'Failed to load course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (options?: { silent?: boolean }) => {
    const currentContent = currentLesson || currentQuiz;
    if (!currentContent) return;

    try {
      setIsCompleting(true);
      const isCompleted = isLessonCompleted(currentContent.id);
      const contentType = currentContent.type === 'quiz' ? 'quiz' : 'lesson';
      
      console.log(`[Toggle Complete] Starting toggle for ${contentType} ${currentContent.id}, currently completed: ${isCompleted}`);
      
      if (isCompleted) {
        console.log(`[Toggle Complete] Marking ${contentType} ${currentContent.id} as incomplete`);
        await markLessonIncomplete(currentContent.id);
        await refreshProgress();
        await refreshEnrollments(); // Refresh enrollments for dashboard
        
        if (!options?.silent) {
          success(`${contentType === 'quiz' ? 'Quiz' : 'Lesson'} marked as incomplete`);
        }
      } else {
        console.log(`[Toggle Complete] Marking ${contentType} ${currentContent.id} as complete`);
        // Mark content complete and get response
        const response = await markLessonComplete(currentContent.id);
        console.log(`[Toggle Complete] Mark complete response:`, response);
        await refreshProgress();
        await refreshEnrollments(); // Refresh enrollments for dashboard
        
        // Add a small delay to ensure backend has processed the completion
        setTimeout(async () => {
          console.log(`[${contentType === 'quiz' ? 'Quiz' : 'Lesson'} Completion] Refreshing all completion data...`);
          // Refresh progress again to ensure all data is synchronized
          await refreshProgress();
          
          // Final refresh to ensure everything is synchronized
          setTimeout(async () => {
            await refreshProgress();
            console.log(`[${contentType === 'quiz' ? 'Quiz' : 'Lesson'} Completion] Final progress refresh completed`);
          }, 300);
        }, 500);
        
        // Show success message for completion
        if (!options?.silent) {
          success(`${contentType === 'quiz' ? 'Quiz' : 'Lesson'} completed successfully!`);
        }
        
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

  // Management navigation removed: only students access lesson viewer

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

  const refreshAllCompletionData = async () => {
    console.log('[Completion Refresh] Refreshing all completion data...');
    try {
      // Refresh progress data
      await refreshProgress();
      
      // Refresh quiz completion status for all quizzes
      if (allQuizzes.length > 0 && profile?.id) {
        const quizPromises = allQuizzes.map(quiz => fetchQuizCompletionStatus(quiz.id));
        await Promise.all(quizPromises);
      }
      
      // Refresh enrollments
      await refreshEnrollments();
      
      console.log('[Completion Refresh] All completion data refreshed');
    } catch (error) {
      console.error('[Completion Refresh] Error refreshing completion data:', error);
    }
  };

  const isContentCompleted = (contentId: string) => {
    // Since the overall progress is working correctly (88%), let's use a simpler approach
    // Check if this is a quiz first
    const isQuiz = allQuizzes.some(quiz => quiz.id === contentId);
    
    if (isQuiz) {
      // For quizzes, check cached completion status
      const cachedStatus = quizCompletionStatus[contentId];
      if (cachedStatus) {
        console.log(`[Completion Check] Quiz ${contentId} completed (cached): ${cachedStatus}`);
        return true;
      }
    }
    
    // For lessons, check the progress data
    if (!progress) {
      console.log(`[Completion Check] No progress data available for ${contentId}`);
      return false;
    }
    
    // Look through all modules for the lesson
    for (const module of progress) {
      console.log(`[Completion Check] Checking module ${module.module_title} for content ${contentId}`);
      
      // Check legacy lessons array (this is what's working)
      const lessons = module.lessons || [];
      console.log(`[Completion Check] Module has ${lessons.length} lessons:`, lessons.map((l: any) => ({ id: l.lesson_id, title: l.title, completed: l.completed })));
      
      const lesson = lessons.find((l: any) => l.lesson_id === contentId);
      if (lesson?.completed) {
        console.log(`[Completion Check] Lesson ${contentId} completed: ${lesson.completed}`);
        return true;
      }
      
      // Check unified content array if available
      if (module.content && Array.isArray(module.content)) {
        const contentItem = module.content.find((item: any) => {
          return (item.lesson_id === contentId) || (item.quiz_id === contentId);
        });
        
        if (contentItem?.completed) {
          console.log(`[Completion Check] ${contentItem.type} ${contentId} completed: ${contentItem.completed}`);
          return true;
        }
      }
    }
    
    console.log(`[Completion Check] Content ${contentId} not completed`);
    return false;
  };

  // Keep the old function name for backward compatibility
  const isLessonCompleted = isContentCompleted;

  // Check if quiz complete button should be shown (only if passed and not already completed)
  const shouldShowQuizCompleteButton = () => {
    if (!currentQuiz || isContentCompleted(currentQuiz.id)) return false;
    
    // Check if there are attempts and if the latest one passed
    if (quizAttempts.length > 0) {
      const latestAttempt = quizAttempts[0];
      const passed = latestAttempt.score >= (currentQuiz.passing_score || 70);
      return passed;
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
        const contentType = currentContent.type === 'quiz' ? 'quiz' : 'lesson';
        const proceed = window.confirm(`You have not marked this ${contentType} as complete. Continue to next item?`);
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
          <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <a
              href={currentLesson.document_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-800 font-medium"
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

  // Fetch quiz attempts when currentQuiz changes
  useEffect(() => {
    const fetchAttempts = async () => {
      if (!currentQuiz?.id) return;
      
      try {
        setLoadingAttempts(true);
        const result = await api.get(`/quizzes/${currentQuiz.id}/attempts`);
        if (result.success) {
          setQuizAttempts(result.data);
        }
      } catch (error) {
        console.warn('Failed to fetch quiz attempts:', error);
      } finally {
        setLoadingAttempts(false);
      }
    };

    fetchAttempts();
  }, [currentQuiz?.id]);

  // Reset quiz started state when quiz changes
  useEffect(() => {
    setQuizStarted(false);
  }, [currentQuiz?.id]);

  // Add a key to force QuizEngine remount when retaking
  const [quizEngineKey, setQuizEngineKey] = useState(0);
  
  // Reset QuizEngine key when quiz is started (for retakes)
  useEffect(() => {
    if (quizStarted && currentQuiz) {
      setQuizEngineKey(prev => prev + 1);
      console.log('[Quiz Reset] QuizEngine key reset for quiz:', currentQuiz.id);
    }
  }, [quizStarted, currentQuiz]);

  const renderQuizContent = () => {
    if (!currentQuiz) return null;

    // Check if quiz is completed
    const isQuizCompleted = isContentCompleted(currentQuiz.id);

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
        // Submit quiz attempt (but don't auto-complete)
        const result = await quizzesApi.submit(currentQuiz.id, { answers });
        if (result.success) {
          success(`Quiz completed! Score: ${score}%`);
          
          // Refresh quiz attempts to show the new result
          const attemptsResult = await api.get(`/quizzes/${currentQuiz.id}/attempts`);
          if (attemptsResult.success) {
            setQuizAttempts(attemptsResult.data);
          }
          
          // Stop the quiz to show results
          setQuizStarted(false);
          
          // Note: We don't automatically mark quiz as complete anymore
          // User must click "Mark as Complete" button to complete the quiz
        }
      } catch (error: any) {
        error(error.message || 'Failed to submit quiz');
      }
    };

    const handleStartQuiz = () => {
      setQuizStarted(true);
    };

    const handleRetakeQuiz = async () => {
      console.log('[Quiz Retake] Starting retake for quiz:', currentQuiz.id);
      
      // Reset quiz completion status for this quiz to allow retaking
      setQuizCompletionStatus(prev => ({
        ...prev,
        [currentQuiz.id]: false
      }));
      
      // Refresh quiz attempts to get the latest data
      try {
        const result = await api.get(`/quizzes/${currentQuiz.id}/attempts`);
        if (result.success) {
          setQuizAttempts(result.data);
        }
      } catch (error) {
        console.warn('Failed to refresh quiz attempts:', error);
      }
      
      // Start the quiz (this will trigger QuizEngine to reset via useEffect)
      setQuizStarted(true);
      console.log('[Quiz Retake] Quiz started, quizStarted set to true');
    };

    // Show loading state while fetching attempts
    if (loadingAttempts) {
      return (
        <div className="prose max-w-none">
          <div className="mb-6">
            <p className="text-gray-600">{currentQuiz.description}</p>
          </div>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      );
    }

    // Show quiz results if there are attempts AND quiz is not started (for retake)
    if (quizAttempts.length > 0 && !quizStarted) {
      const latestAttempt = quizAttempts[0]; // Assuming attempts are ordered by most recent first
      const passed = latestAttempt.score >= (currentQuiz.passing_score || 70);
      const isQuizCompleted = isContentCompleted(currentQuiz.id);
      
      // Debug: Log quiz data structure
      console.log('[Quiz Results] Quiz data:', {
        id: currentQuiz.id,
        title: currentQuiz.title,
        max_attempts: currentQuiz.max_attempts,
        passing_score: currentQuiz.passing_score,
        attempts_count: quizAttempts.length,
        latest_attempt: latestAttempt,
        isQuizCompleted
      });
      
      return (
        <div className="prose max-w-none">
          <div className="mb-6">
            <p className="text-gray-600">{currentQuiz.description}</p>
          </div>
          
          {/* Quiz Results */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="text-center mb-6">
              <div className={`text-4xl font-bold mb-4 ${passed ? 'text-green-500' : 'text-red-500'}`}>
                {latestAttempt.score}%
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {passed ? 'Congratulations! You passed the quiz.' : 'You did not meet the passing score.'}
              </h3>
              <p className="text-gray-600 mb-4">
                Passing Score: {currentQuiz.passing_score || 70}%
              </p>
              <div className="text-sm text-gray-500">
                Completed on: {new Date(latestAttempt.completed_at).toLocaleDateString()}
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="text-center space-y-3">
              {/* Mark as Complete button - only show if not already completed AND passing score reached */}
              {!isQuizCompleted && passed && (
                <div>
                  <button
                    onClick={() => handleToggleComplete()}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    Mark as Complete
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    You passed! Click to mark this quiz as completed in your progress
                  </p>
                </div>
              )}
              
              {/* Show message if not passed */}
              {!isQuizCompleted && !passed && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    You need to score {currentQuiz.passing_score || 70}% or higher to mark this quiz as complete.
                  </p>
                  <p className="text-xs text-gray-500">
                    Current score: {latestAttempt.score}%
                  </p>
                </div>
              )}
              
              {/* Retake button if allowed */}
              {(() => {
                const maxAttempts = currentQuiz.max_attempts || 0;
                const currentAttempts = quizAttempts.length;
                const canRetake = maxAttempts === 0 || currentAttempts < maxAttempts;
                
                console.log('[Quiz Retake] Max attempts:', maxAttempts, 'Current attempts:', currentAttempts, 'Can retake:', canRetake);
                
                if (canRetake) {
                  return (
                    <button
                      onClick={handleRetakeQuiz}
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                    >
                      Retake Quiz
                    </button>
                  );
                } else {
                  return (
                    <div className="space-y-2">
                      <div className="text-gray-500">
                        Maximum attempts reached ({currentAttempts}/{maxAttempts})
                      </div>
                      <button
                        onClick={handleRetakeQuiz}
                        className="px-6 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed transition-colors"
                        disabled
                      >
                        Retake Quiz (Disabled)
                      </button>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      );
    }

    // Show start quiz button if not started and not completed
    if (!quizStarted && !isQuizCompleted) {
      // Debug: Log quiz data structure
      console.log('[Quiz Start] Quiz data:', {
        id: currentQuiz.id,
        title: currentQuiz.title,
        max_attempts: currentQuiz.max_attempts,
        passing_score: currentQuiz.passing_score,
        time_limit_minutes: currentQuiz.time_limit_minutes,
        attempts_count: quizAttempts.length,
        quiz_data: currentQuiz
      });
      
      return (
        <div className="prose max-w-none">
          <div className="mb-6">
            <p className="text-gray-600">{currentQuiz.description}</p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
            <h3 className="text-xl font-semibold mb-4">Ready to take the quiz?</h3>
            <div className="space-y-2 text-sm text-gray-600 mb-6">
              <p><strong>Questions:</strong> {questions.length}</p>
              {currentQuiz.time_limit_minutes > 0 && (
                <p><strong>Time Limit:</strong> {currentQuiz.time_limit_minutes} minutes</p>
              )}
              <p><strong>Passing Score:</strong> {currentQuiz.passing_score || 70}%</p>
              <p><strong>Max Attempts:</strong> {currentQuiz.max_attempts === 0 ? 'Unlimited' : currentQuiz.max_attempts}</p>
              <p><strong>Current Attempts:</strong> {quizAttempts.length}</p>
            </div>
            <button
              onClick={handleStartQuiz}
              className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Start Quiz
            </button>
          </div>
        </div>
      );
    }

    // Show quiz engine if started and not completed
    if (quizStarted && !isQuizCompleted) {
      console.log('[Quiz Engine] Showing quiz engine, quizStarted:', quizStarted, 'isQuizCompleted:', isQuizCompleted);
      return (
        <div className="prose max-w-none">
          <div className="mb-6">
            <p className="text-gray-600">{currentQuiz.description}</p>
          </div>
          
          <QuizEngine
            key={`quiz-${currentQuiz.id}-${quizEngineKey}`}
            questions={questions}
            timeLimit={currentQuiz.time_limit_minutes}
            passingScore={currentQuiz.passing_score || 70}
            showFeedback={currentQuiz.show_feedback !== 'never'}
            onComplete={handleQuizComplete}
          />
        </div>
      );
    }

    // Fallback
    return (
      <div className="prose max-w-none">
        <div className="mb-6">
          <p className="text-gray-600">{currentQuiz.description}</p>
        </div>
        <div className="text-center text-gray-500">
          Loading quiz...
        </div>
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

  if (courseError) {
    return (
      <div className="p-6 text-center">
        <div className="max-w-md mx-auto bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Error Loading Course</h3>
          <p className="text-red-600 dark:text-red-300">{courseError}</p>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!course || (!currentLesson && !currentQuiz)) {
    return (
      <div className="p-6 text-center">
        <div className="max-w-md mx-auto bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Content Not Available</h3>
          <p className="text-yellow-600 dark:text-yellow-300">
            Content not found or you don't have access to this course. Please ensure you are enrolled in this course.
          </p>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
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
            {/* Management button removed */}
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
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Course Progress</h3>
                <button
                  onClick={refreshAllCompletionData}
                  className="text-xs text-primary-600 hover:text-primary-800 underline"
                  title="Refresh completion data"
                >
                  Refresh
                </button>
              </div>
              {(() => {
                // Use enrollment progress percentage like the dashboard does
                const enrollment = enrollments.find(e => e.course_id === resolvedCourseId);
                const enrollmentProgress = enrollment?.progress_percentage || 0;
                
                // Fallback: calculate from content completion
                const totalContent = allContent.length;
                const completedContent = allContent.filter(item => isLessonCompleted(item.id)).length;
                const calculatedProgress = totalContent > 0 ? Math.round((completedContent / totalContent) * 100) : 0;
                
                // Use enrollment progress if available, otherwise use calculated progress
                const progressPercentage = enrollmentProgress > 0 ? enrollmentProgress : calculatedProgress;
                
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
                      {enrollmentProgress > 0 ? 'Enrollment Progress' : `${completedContent} of ${totalContent} content items completed`}
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
                            {isQuiz && <span className="text-xs bg-primary-100 text-primary-600 px-1 rounded">Quiz</span>}
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
                    {currentQuiz && <span className="text-sm bg-primary-100 text-primary-600 px-2 py-1 rounded self-start">Quiz</span>}
                    <span className="break-words">{currentLesson?.title || currentQuiz?.title}</span>
                  </h1>
                  {(currentLesson?.estimated_duration_minutes || currentQuiz?.time_limit_minutes) && (
                    <div className="flex items-center text-sm text-gray-600 mt-2">
                      <Clock size={14} className="mr-1" />
                      {currentLesson?.estimated_duration_minutes || currentQuiz?.time_limit_minutes} minutes
                    </div>
                  )}
                </div>
                {(currentLesson || (currentQuiz && shouldShowQuizCompleteButton())) && (
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

