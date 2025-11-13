/* eslint-disable @typescript-eslint/no-explicit-any */
// Student Lesson Viewer - View and complete lessons
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Circle, ChevronLeft, ChevronRight, ChevronDown, Clock, Menu, X, Settings, Star, Pin, Loader2 } from 'lucide-react';
import { formatDistanceToNow, differenceInCalendarDays } from 'date-fns';
import { useProgress } from '../../hooks/useProgress';
import { useAuth } from '../../contexts/AuthContext';
import { useEnrollments } from '../../hooks/useEnrollments';
import { useToast } from '../../contexts/ToastContext';
import api, { quizzesApi } from '../../lib/api';
import PageLayout from '../ui/PageLayout';
import { cleanLessonContent, convertYouTubeUrls, fixIframeAttributes } from '../../utils/htmlUtils';
import CelebrationModal from '../ui/CelebrationModal';
import QuizEngine from '../quiz/QuizEngine';
import { fetchPublicReviews, createReviewComment, Review } from '../../services/reviews.service';
import { fetchAnnouncements, markAnnouncementAsRead, type Announcement } from '../../services/announcements.service';
import { getCourseReviewSettings, type CourseReviewSettings } from '../../services/reviewSettings.service';
import { fetchQuestions } from '../../services/courseSupport.service';
import CourseReviewPromptModal from './CourseReviewPromptModal';
import CourseSupportTab from './CourseSupportTab';

const getLessonAnnouncementStyles = (announcement: Announcement) => {
  if (announcement.isPinned) {
    return {
      headerBg: 'bg-amber-50',
      headerText: 'text-amber-800',
      border: 'border-amber-200',
      statusBadge: 'bg-amber-100 text-amber-700',
    };
  }

  if (!announcement.isRead) {
    return {
      headerBg: 'bg-primary-50',
      headerText: 'text-primary-800',
      border: 'border-primary-200',
      statusBadge: 'bg-primary-100 text-primary-700',
    };
  }

  return {
    headerBg: 'bg-gray-50',
    headerText: 'text-gray-800',
    border: 'border-gray-200',
    statusBadge: 'bg-gray-200 text-gray-600',
  };
};

type ReviewPromptLocalState = {
  promptCount: number;
  lastPromptAt?: string | null;
  lastAction?: 'prompted' | 'dismissed' | 'submitted';
  lastActionAt?: string | null;
  submittedAt?: string | null;
};

const REVIEW_PROMPT_STORAGE_PREFIX = 'udrive:course-review-prompt';

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
  const [courseError, setCourseError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isNavigatingNext, setIsNavigatingNext] = useState(false);
  const [resolvedCourseId, setResolvedCourseId] = useState<string | null>(null);
  const [resolvedLessonId, setResolvedLessonId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'lesson' | 'support' | 'notes' | 'announcements' | 'reviews' | 'tools'>('overview');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  
  // Quiz state
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  const [courseReviews, setCourseReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [ratingFilter, setRatingFilter] = useState<'all' | number>('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewCommentDrafts, setReviewCommentDrafts] = useState<Record<string, string>>({});
  const [reviewCommentSubmitting, setReviewCommentSubmitting] = useState<string | null>(null);
  const [reviewSettings, setReviewSettings] = useState<CourseReviewSettings | null>(null);
  const [reviewSettingsLoaded, setReviewSettingsLoaded] = useState(false);
  const [hasAutoPrompted, setHasAutoPrompted] = useState(false);
  const [promptState, setPromptState] = useState<ReviewPromptLocalState>({ promptCount: 0 });
  
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
  const promptStorageKey = useMemo(() => {
    if (!profile?.id || !resolvedCourseId) {
      return null;
    }
    return `${REVIEW_PROMPT_STORAGE_PREFIX}:${profile.id}:${resolvedCourseId}`;
  }, [profile?.id, resolvedCourseId]);
  const { enrollments, refreshEnrollments } = useEnrollments(enrollmentFilters as any);
  const { info, success, error: errorToast } = useToast();
  const [courseAnnouncements, setCourseAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementsError, setAnnouncementsError] = useState<string | null>(null);
  const markedAnnouncementsRef = useRef<Set<string>>(new Set());

  // Support questions state
  const [supportQuestions, setSupportQuestions] = useState<any[]>([]);

  // Calculate unread announcements count for badge
  const unreadAnnouncementsCount = useMemo(() => {
    return courseAnnouncements.filter(
      (announcement) => !announcement.isRead && !markedAnnouncementsRef.current.has(announcement.id)
    ).length;
  }, [courseAnnouncements]);

  // Calculate open support questions count for badge
  const openSupportQuestionsCount = useMemo(() => {
    return supportQuestions.filter((q) => q.status === 'open').length;
  }, [supportQuestions]);

  const isStudentContext = useMemo(
    () =>
      Boolean(
        profile &&
          (profile.active_role === 'student' ||
            (!profile.active_role && profile.role === 'student'))
      ),
    [profile]
  );

  const canRespondToReviews = useMemo(() => {
    const roles = new Set<string>();
    if (profile?.role) roles.add(profile.role);
    if (profile?.active_role) roles.add(profile.active_role);
    return (
      roles.has('super_admin') ||
      roles.has('school_admin') ||
      roles.has('instructor')
    );
  }, [profile?.role, profile?.active_role]);

  const lessonTabs = useMemo(
    () => [
      { label: 'Overview', value: 'overview' as const },
      { label: 'Lesson', value: 'lesson' as const },
      { label: 'Support', value: 'support' as const },
      { label: 'Notes', value: 'notes' as const },
      { label: 'Announcements', value: 'announcements' as const },
      { label: 'Reviews', value: 'reviews' as const },
      { label: 'Tools', value: 'tools' as const }
    ],
    []
  );

  useEffect(() => {
    if (!promptStorageKey || typeof window === 'undefined') {
      setPromptState({ promptCount: 0 });
      return;
      }

    try {
      const raw = localStorage.getItem(promptStorageKey);
      if (!raw) {
        setPromptState({ promptCount: 0 });
        return;
      }
      const parsed = JSON.parse(raw);
      setPromptState({
        promptCount: Number(parsed.promptCount) || 0,
        lastPromptAt: parsed.lastPromptAt ?? null,
        lastAction: parsed.lastAction ?? undefined,
        lastActionAt: parsed.lastActionAt ?? null,
        submittedAt: parsed.submittedAt ?? null,
      });
    } catch (storageError) {
      console.warn('Failed to read review prompt state', storageError);
      setPromptState({ promptCount: 0 });
    }
  }, [promptStorageKey]);

  const writePromptState = useCallback(
    (updater: (prev: ReviewPromptLocalState) => ReviewPromptLocalState) => {
      if (!promptStorageKey || typeof window === 'undefined') {
        return;
      }

      setPromptState((prev) => {
        const base = prev ?? { promptCount: 0 };
        const next = updater(base);
        try {
          localStorage.setItem(promptStorageKey, JSON.stringify(next));
        } catch (storageError) {
          console.warn('Failed to persist review prompt state', storageError);
        }
        return next;
    });
    },
    [promptStorageKey]
  );

  useEffect(() => {
    if (!resolvedCourseId) {
      setCourseAnnouncements([]);
      return;
    }

    let isCancelled = false;

    const loadAnnouncements = async () => {
      try {
        setAnnouncementsLoading(true);
        setAnnouncementsError(null);
        const data = await fetchAnnouncements({
          courseId: resolvedCourseId,
          includeGlobal: false,
          status: 'all',
          includeExpired: true,
        });
        if (!isCancelled) {
          // Filter to only show announcements for this specific course
          // Must have matching courseId, audienceScope must be 'course', and contextType should be 'course' (not 'general')
          const relevant = (data || []).filter(
            (announcement) =>
              announcement.courseId === resolvedCourseId &&
              announcement.audienceScope === 'course' &&
              announcement.contextType !== 'general'
          );
          setCourseAnnouncements(relevant);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Failed to load course announcements:', err);
          setAnnouncementsError(err.message || 'Unable to load announcements right now.');
        }
      } finally {
        if (!isCancelled) {
          setAnnouncementsLoading(false);
        }
      }
    };

    loadAnnouncements();

    return () => {
      isCancelled = true;
    };
  }, [resolvedCourseId]);

  // Load support questions for badge count
  useEffect(() => {
    if (!resolvedCourseId) {
      setSupportQuestions([]);
      return;
    }

    let isCancelled = false;

    const loadSupportQuestions = async () => {
      try {
        const data = await fetchQuestions({
          course_id: resolvedCourseId,
          limit: 100,
        });
        if (!isCancelled) {
          setSupportQuestions(data || []);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Failed to load support questions:', err);
        }
      }
    };

    loadSupportQuestions();
    const interval = setInterval(loadSupportQuestions, 30000); // Poll every 30 seconds
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [resolvedCourseId]);

  useEffect(() => {
    if (activeTab !== 'announcements') return;
    if (courseAnnouncements.length === 0) return;

    const unreadAnnouncements = courseAnnouncements.filter(
      (announcement) =>
        !announcement.isRead && !markedAnnouncementsRef.current.has(announcement.id)
    );

    if (unreadAnnouncements.length === 0) {
      return;
    }

    let isCancelled = false;

    const markAnnouncementsRead = async () => {
      await Promise.all(
        unreadAnnouncements.map(async (announcement) => {
          try {
            const updated = await markAnnouncementAsRead(announcement.id);
            markedAnnouncementsRef.current.add(announcement.id);
            if (!isCancelled) {
              setCourseAnnouncements((prev) =>
                prev.map((item) =>
                  item.id === announcement.id
                    ? {
                        ...item,
                        isRead: true,
                        readAt:
                          updated?.readAt ||
                          updated?.publishedAt ||
                          item.readAt ||
                          new Date().toISOString(),
                      }
                    : item
                )
              );
            }
          } catch (err) {
            console.warn('Failed to mark announcement as read', err);
          }
        })
      );
    };

    markAnnouncementsRead();

    return () => {
      isCancelled = true;
    };
  }, [activeTab, courseAnnouncements]);

  useEffect(() => {
    if (courseSlugOrId) {
      fetchCourseData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseSlugOrId]);

  useEffect(() => {
    if (!resolvedCourseId) {
      setReviewSettings(null);
      setReviewSettingsLoaded(false);
      return;
    }

    setReviewSettingsLoaded(false);
    let isCancelled = false;

    const loadReviewSettings = async () => {
      try {
        const data = await getCourseReviewSettings(resolvedCourseId);
        if (!isCancelled) {
          setReviewSettings(data);
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn('Failed to load course review settings', err);
          setReviewSettings(null);
        }
      } finally {
        if (!isCancelled) {
          setReviewSettingsLoaded(true);
        }
      }
    };

    loadReviewSettings();

    return () => {
      isCancelled = true;
    };
  }, [resolvedCourseId]);

  const loadCourseReviews = useCallback(async () => {
    if (!resolvedCourseId) {
      return;
    }
    try {
      setLoadingReviews(true);
      setReviewsError(null);
      const data = await fetchPublicReviews({
        type: 'course',
        reviewable_id: resolvedCourseId,
        limit: 50,
      });
      const normalized = (data || []).map((review) => ({
        ...review,
        comments: review.comments || [],
      }));
      setCourseReviews(normalized);
    } catch (err: any) {
      console.error('Failed to load course reviews:', err);
      setReviewsError(err.message || 'Unable to load course reviews right now.');
    } finally {
      setLoadingReviews(false);
    }
  }, [resolvedCourseId]);

  useEffect(() => {
    if (activeTab === 'reviews' && resolvedCourseId) {
      loadCourseReviews();
    }
  }, [activeTab, resolvedCourseId, loadCourseReviews]);

  useEffect(() => {
    setRatingFilter('all');
  }, [resolvedCourseId]);

  useEffect(() => {
    setHasAutoPrompted(false);
  }, [resolvedCourseId]);

  const handleReviewCommentChange = useCallback((reviewId: string, value: string) => {
    setReviewCommentDrafts((prev) => ({
      ...prev,
      [reviewId]: value,
    }));
  }, []);

  const handleReviewCommentSubmit = useCallback(
    async (reviewId: string) => {
      const draft = reviewCommentDrafts[reviewId]?.trim();
      if (!draft) return;

      try {
        setReviewCommentSubmitting(reviewId);
        const comment = await createReviewComment(reviewId, draft);
        setCourseReviews((prev) =>
          prev.map((item) =>
            item.id === reviewId
              ? {
                  ...item,
                  comments: [...(item.comments || []), comment],
                }
              : item
          )
        );
        setReviewCommentDrafts((prev) => ({
          ...prev,
          [reviewId]: '',
        }));
        success('Comment posted');
      } catch (err: any) {
        console.error('Failed to post review comment:', err);
        errorToast(err?.message || 'Unable to post comment.');
      } finally {
        setReviewCommentSubmitting(null);
      }
    },
    [reviewCommentDrafts, success, errorToast]
  );

  const averageRating = useMemo(() => {
    const rated = courseReviews.filter((review) => review.rating && review.rating > 0);
    if (rated.length === 0) {
      return null;
    }
    const sum = rated.reduce((acc, review) => acc + (review.rating || 0), 0);
    return {
      value: sum / rated.length,
      count: rated.length,
    };
  }, [courseReviews]);

  const ratingBuckets = useMemo(() => {
    const base = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>;
    courseReviews.forEach((review) => {
      if (review.rating && review.rating >= 1 && review.rating <= 5) {
        base[review.rating] += 1;
      }
    });
    return base;
  }, [courseReviews]);

  const filteredCourseReviews = useMemo(() => {
    if (ratingFilter === 'all') {
      return courseReviews;
    }
    return courseReviews.filter((review) => review.rating === ratingFilter);
  }, [ratingFilter, courseReviews]);

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
      errorToast(err.message || 'Failed to update progress');
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

  const isContentCompleted = useCallback(
    (contentId: string) => {
    // Since the overall progress is working correctly (88%), let's use a simpler approach
    // Check if this is a quiz first
      const isQuiz = allQuizzes.some((quiz) => quiz.id === contentId);
    
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
        console.log(
          `[Completion Check] Checking module ${module.module_title} for content ${contentId}`
        );
      
      // Check legacy lessons array (this is what's working)
      const lessons = module.lessons || [];
        console.log(
          `[Completion Check] Module has ${lessons.length} lessons:`,
          lessons.map((l: any) => ({ id: l.lesson_id, title: l.title, completed: l.completed }))
        );
      
      const lesson = lessons.find((l: any) => l.lesson_id === contentId);
      if (lesson?.completed) {
        console.log(`[Completion Check] Lesson ${contentId} completed: ${lesson.completed}`);
        return true;
      }
      
      // Check unified content array if available
      if (module.content && Array.isArray(module.content)) {
        const contentItem = module.content.find((item: any) => {
            return item.lesson_id === contentId || item.quiz_id === contentId;
        });
        
        if (contentItem?.completed) {
            console.log(
              `[Completion Check] ${contentItem.type} ${contentId} completed: ${contentItem.completed}`
            );
          return true;
        }
      }
    }
    
    console.log(`[Completion Check] Content ${contentId} not completed`);
    return false;
    },
    [allQuizzes, progress, quizCompletionStatus]
  );

  // Keep the old function name for backward compatibility
  const isLessonCompleted = isContentCompleted;

  useEffect(() => {
    if (hasAutoPrompted) return;
    if (!reviewSettingsLoaded) return;
    if (!reviewSettings) return;
    if (!resolvedCourseId) return;
    if (!isStudentContext) return;
    if (!promptStorageKey) return;
    if (showReviewModal) return;

    const enrollment = enrollments.find((e: any) => e.course_id === resolvedCourseId);
    const enrollmentProgress = enrollment?.progress_percentage ?? 0;
    const totalContent = allContent.length;
    const completedContent =
      totalContent > 0 ? allContent.filter((item) => isContentCompleted(item.id)).length : 0;
    const calculatedProgress =
      totalContent > 0 ? Math.round((completedContent / totalContent) * 100) : 0;
    const progressPercentage =
      enrollmentProgress > 0 ? enrollmentProgress : calculatedProgress;

    const settings = reviewSettings;
    let meetsTrigger = false;

    if (settings.trigger_type === 'percentage') {
      const threshold = settings.trigger_value ?? 0;
      meetsTrigger = threshold > 0 && progressPercentage >= threshold;
    } else if (settings.trigger_type === 'lesson_count') {
      const threshold = settings.trigger_value ?? 0;
      meetsTrigger = threshold > 0 && completedContent >= threshold;
    } else {
      return; // manual trigger only
    }

    if (!meetsTrigger) return;

    const state = promptState || { promptCount: 0 };

    if (!settings.allow_multiple) {
      if (state.submittedAt) return;
      if (state.promptCount >= 1) return;
    }

    if (settings.cooldown_days && settings.cooldown_days > 0 && state.lastPromptAt) {
      try {
        const diff = differenceInCalendarDays(new Date(), new Date(state.lastPromptAt));
        if (!Number.isNaN(diff) && diff < settings.cooldown_days) {
          return;
        }
      } catch {
        // ignore parse errors
      }
    }

    setHasAutoPrompted(true);
    setShowReviewModal(true);
    writePromptState((prev) => ({
      ...prev,
      promptCount: (prev.promptCount ?? 0) + 1,
      lastPromptAt: new Date().toISOString(),
      lastAction: 'prompted',
      lastActionAt: new Date().toISOString(),
    }));
  }, [
    allContent,
    enrollments,
    hasAutoPrompted,
    isContentCompleted,
    isStudentContext,
    promptState,
    promptStorageKey,
    reviewSettings,
    reviewSettingsLoaded,
    resolvedCourseId,
    showReviewModal,
    writePromptState,
  ]);

  const handleReviewModalClose = useCallback(() => {
    setShowReviewModal(false);
    writePromptState((prev) => ({
      ...prev,
      lastAction: 'dismissed',
      lastActionAt: new Date().toISOString(),
    }));
  }, [writePromptState]);

  const handleReviewModalSubmitted = useCallback(() => {
    loadCourseReviews();
    setShowReviewModal(false);
    writePromptState((prev) => ({
      ...prev,
      lastAction: 'submitted',
      lastActionAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
    }));
  }, [loadCourseReviews, writePromptState]);

  const handleReviewModalManualOpen = useCallback(() => {
    setShowReviewModal(true);
    writePromptState((prev) => ({
      ...prev,
      lastAction: 'prompted',
      lastActionAt: new Date().toISOString(),
    }));
  }, [writePromptState]);

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
        errorToast(error.message || 'Failed to submit quiz');
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
              
              {/* Mark as Incomplete button - show if quiz is completed */}
              {isQuizCompleted && (
                <div>
                  <button
                    onClick={() => handleToggleComplete()}
                    disabled={isCompleting}
                    className={`px-6 py-2 rounded-lg transition-colors font-medium ${
                      isCompleting
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {isCompleting ? 'Marking as Incomplete...' : 'Mark as Incomplete'}
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Click to mark this quiz as incomplete in your progress
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

  const renderNonLessonTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6 p-4 sm:p-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Course Overview</h2>
              <p className="text-gray-700 whitespace-pre-line">
                {course?.description || 'Course overview will be available soon.'}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Course Content</h3>
                {modules.length > 0 ? (
                <div className="space-y-3">
                  {modules.map((module) => {
                    const moduleContent = allContent
                      .filter((item) => item.module_id === module.id)
                      .sort((a, b) => {
                        // Sort lessons before quizzes, then by creation date
                        const aIsQuiz = 'type' in a && a.type === 'quiz';
                        const bIsQuiz = 'type' in b && b.type === 'quiz';
                        if (aIsQuiz && !bIsQuiz) return 1;
                        if (!aIsQuiz && bIsQuiz) return -1;
                        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                      });
                    const moduleContentCount = moduleContent.length;
                    const completedInModule = moduleContent.filter((item) => isLessonCompleted(item.id)).length;
                    const hasCurrentContent = moduleContent.some(item => item.id === resolvedLessonId);
                    const isExpanded = expandedModules.has(module.id);
                    const toggleModule = () => {
                      setExpandedModules((prev) => {
                        const next = new Set(prev);
                        if (next.has(module.id)) {
                          next.delete(module.id);
                        } else {
                          next.add(module.id);
                        }
                        return next;
                      });
                    };

                    return (
                      <div
                        key={module.id}
                        className={`border rounded-lg overflow-hidden ${
                          hasCurrentContent
                            ? 'border-primary-200 bg-primary-50/30'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <button
                          onClick={toggleModule}
                          className={`w-full p-4 flex items-center justify-between gap-3 transition-colors text-left ${
                            hasCurrentContent
                              ? 'hover:bg-primary-50/50'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className={`font-semibold ${
                                hasCurrentContent
                                  ? 'text-primary-700'
                                  : 'text-gray-900'
                              }`}>{module.title}</h4>
                              <span className={`text-xs font-medium ${
                                hasCurrentContent
                                  ? 'text-primary-600'
                                  : 'text-gray-500'
                              }`}>
                                {completedInModule}/{moduleContentCount} completed
                          </span>
                        </div>
                        {module.description && (
                              <p className={`text-sm ${
                                hasCurrentContent
                                  ? 'text-primary-600/80'
                                  : 'text-gray-600'
                              }`}>{module.description}</p>
                        )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium ${
                              hasCurrentContent
                                ? 'text-primary-600'
                                : 'text-gray-500'
                            }`}>
                              {moduleContentCount} item{moduleContentCount === 1 ? '' : 's'}
                            </span>
                            {isExpanded ? (
                              <ChevronDown size={20} className={hasCurrentContent ? 'text-primary-500' : 'text-gray-400'} />
                            ) : (
                              <ChevronRight size={20} className={hasCurrentContent ? 'text-primary-500' : 'text-gray-400'} />
                            )}
          </div>
                        </button>

                        {isExpanded && moduleContent.length > 0 && (
                          <div className={`border-t ${
                            hasCurrentContent
                              ? 'border-primary-200 bg-primary-50/20'
                              : 'border-gray-200 bg-gray-50'
                          }`}>
                            <div className="p-3 space-y-1">
                              {moduleContent.map((content) => {
                                const completed = isLessonCompleted(content.id);
                                const isCurrent = content.id === resolvedLessonId;
                                const isQuiz = content.type === 'quiz';

        return (
                                  <button
                                    key={content.id}
                                    onClick={() => {
                                      const slug = (content.title || '')
                                        .toLowerCase()
                                        .trim()
                                        .replace(/[^a-z0-9\s-]/g, '')
                                        .replace(/\s+/g, '-')
                                        .replace(/-+/g, '-');
                                      const courseSlug = course?.slug || courseSlugOrId;
                                      navigate(`/student/courses/${courseSlug}/lessons/${slug}-${content.id}`);
                                      setActiveTab('lesson');
                                    }}
                                    className={`w-full text-left px-4 py-2.5 rounded-lg flex items-center gap-3 transition-colors ${
                                      isCurrent
                                        ? 'bg-primary-50 text-primary-700 font-medium border border-primary-200'
                                        : completed
                                        ? 'text-gray-700 hover:bg-gray-100'
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                  >
                                    {completed ? (
                                      <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
                                    ) : (
                                      <Circle size={18} className="text-gray-400 flex-shrink-0" />
                                    )}
                                    <div className="flex-1 flex items-center gap-2">
                                      {isQuiz && (
                                        <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded font-medium">
                                          Quiz
                                        </span>
                                      )}
                                      <span className="text-sm">{content.title}</span>
          </div>
                                    {isCurrent && (
                                      <span className="text-xs text-primary-600 font-medium">Current</span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-500 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  Modules will appear here once available.
                </div>
              )}
            </section>
          </div>
        );
      case 'announcements':
        return (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Announcements</h2>
                <p className="text-gray-600">
                  Track course-wide updates, refreshed modules, and lesson tweaks from your instructors in real time.
                </p>
              </div>
            </div>

            {announcementsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600"></div>
                  <p className="text-sm text-gray-600">Loading announcements...</p>
                </div>
              </div>
            ) : announcementsError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {announcementsError}
              </div>
            ) : courseAnnouncements.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                <h3 className="text-base font-semibold text-gray-900">No course announcements yet</h3>
                <p className="mt-2 text-sm text-gray-600">
                  When instructors publish course, module, lesson, or quiz updates you&apos;ll find them here.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {courseAnnouncements.map((announcement) => {
                const metadata = (announcement.metadata || {}) as Record<string, any>;
                const link =
                  (typeof metadata.link === 'string' && metadata.link) ||
                  (typeof metadata.ctaUrl === 'string' && metadata.ctaUrl) ||
                  (typeof (metadata as any).cta_url === 'string' && (metadata as any).cta_url) ||
                  undefined;
                const publishedAt =
                  announcement.publishedAt || announcement.updatedAt || announcement.createdAt;
                  const timestamp = (() => {
                    try {
                    if (!publishedAt) return 'Just now';
                    const date = new Date(publishedAt);
                      if (Number.isNaN(date.getTime())) {
                        return 'Just now';
                      }
                      return formatDistanceToNow(date, { addSuffix: true });
                    } catch {
                      return 'Just now';
                    }
                  })();
                  const authorName =
                    announcement.author?.fullName ||
                    [announcement.author?.firstName, announcement.author?.lastName]
                      .filter(Boolean)
                      .join(' ')
                      .trim() ||
                    announcement.author?.email ||
                    (announcement.authorRole === 'super_admin' ? 'Super Admin' : 'Announcement');
                  const styles = getLessonAnnouncementStyles(announcement);

                  return (
                    <article
                      key={announcement.id}
                      className={`bg-white border ${styles.border} rounded-lg shadow-sm transition hover:shadow-md overflow-hidden`}
                    >
                      <div
                        className={`flex flex-col gap-2 px-4 py-3 sm:px-6 ${styles.headerBg}`}
                      >
                        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold ${styles.statusBadge}`}
                          >
                            {announcement.isPinned ? (
                              <>
                                <Pin size={12} />
                                Pinned
                              </>
                            ) : (
                              'Announcement'
                            )}
                          </span>
                          {announcement.audienceScope !== 'global' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-1 font-semibold text-gray-700">
                              {announcement.audienceScope === 'tenant'
                                ? 'School'
                                : announcement.audienceScope}
                            </span>
                          )}
                          {announcement.contextType !== 'general' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-1 font-semibold text-gray-700">
                              {announcement.contextType}
                            </span>
                          )}
                          <span className="text-gray-500">{timestamp}</span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Posted by {authorName}</p>
                          <h3 className={`text-lg font-semibold ${styles.headerText}`}>
                            {announcement.title}
                          </h3>
                        </div>
                      </div>

                      <div className="px-4 py-4 sm:px-6 space-y-4">
                        {announcement.summary && (
                          <p className="text-sm text-gray-600">{announcement.summary}</p>
                        )}
                        <div
                          className="prose prose-sm max-w-none text-sm text-gray-700"
                          dangerouslySetInnerHTML={{ __html: announcement.bodyHtml || '' }}
                        />
                        {metadata && Object.keys(metadata).length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                              {(() => {
                              if (Array.isArray(metadata.changes) && metadata.changes.length > 0) {
                                  return (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-1 text-primary-700">
                                    Updates: {metadata.changes.join(', ')}
                                    </span>
                                  );
                                }
                              if (typeof metadata.moduleName === 'string') {
                                  return (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-1 text-primary-700">
                                    Module: {metadata.moduleName}
                                    </span>
                                  );
                                }
                              if (typeof metadata.lessonName === 'string') {
                                  return (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-1 text-primary-700">
                                    Lesson: {metadata.lessonName}
                                    </span>
                                  );
                                }
                              if (typeof metadata.quizTitle === 'string') {
                                  return (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-1 text-primary-700">
                                    Quiz: {metadata.quizTitle}
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                        )}
                        {announcement.media && announcement.media.length > 0 && (
                          <div className="space-y-3">
                            {announcement.media.map((media) => (
                              <div
                                key={media.id}
                                className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                              >
                                {media.mediaType === 'image' ? (
                                  <img
                                    src={media.url}
                                    alt={media.altText || media.title || 'Announcement media'}
                                    className="max-h-72 w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-gray-700">
                                    <div className="flex flex-col">
                                      <span className="font-medium text-gray-900">
                                        {media.title || 'Attachment'}
                                      </span>
                                      {media.description && (
                                        <span className="text-xs text-gray-500">{media.description}</span>
                          )}
                        </div>
                            <a
                                      href={media.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-700"
                            >
                                      View
                            </a>
                                  </div>
                          )}
                        </div>
                            ))}
                      </div>
                        )}
                        {link && (
                          <a
                            href={link}
                            className="inline-flex w-fit items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
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
          </div>
        );
      case 'reviews':
        return (
          <div className="p-4 sm:p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Hear from fellow learners</h2>
              <p className="text-sm text-gray-600">
                Discover how this course is helping other students grow, then add your own voice to guide future learners.
              </p>
            </div>

            {isStudentContext && resolvedCourseId && (
              <div className="rounded-xl border border-gray-100 bg-primary-50/60 px-5 py-4 text-sm text-primary-700 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Star className="h-4 w-4 text-primary-500" />
                    <p>
                      Ready to share your perspective? Leave a quick review once you&apos;ve experienced enough of the course.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleReviewModalManualOpen}
                    className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
                  >
                    Share my experience
                  </button>
                </div>
              </div>
            )}

            {averageRating && (
              <div className="grid gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:grid-cols-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Average rating
                  </span>
                  <div className="mt-2 flex items-baseline gap-2 text-3xl font-semibold text-gray-900">
                    {averageRating.value.toFixed(1)}
                    <span className="text-sm font-medium text-gray-500">/ 5</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{averageRating.count} verified reviews</p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Filter by rating
                  </span>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRatingFilter('all')}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        ratingFilter === 'all'
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-primary-50 hover:text-primary-600'
                      }`}
                    >
                      All ({averageRating.count})
                    </button>
                    {[5, 4, 3, 2, 1].map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setRatingFilter(score)}
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                          ratingFilter === score
                            ? 'bg-primary-500 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-primary-50 hover:text-primary-600'
                        }`}
                      >
                        <Star className={`h-3.5 w-3.5 ${ratingFilter === score ? 'fill-current' : ''}`} />
                        {score}
                        <span className="text-[11px] text-gray-400">
                          ({ratingBuckets[score as 1 | 2 | 3 | 4 | 5] || 0})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {reviewsError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {reviewsError}
              </div>
            )}

            {loadingReviews ? (
              <div className="flex min-h-[120px] items-center justify-center text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary-600" />
                  <span>Loading reviews...</span>
                </div>
              </div>
            ) : courseReviews.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                No published reviews yet. Once learners start sharing their stories, you&apos;ll see them here.
              </div>
            ) : filteredCourseReviews.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                No reviews match this filter yet.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCourseReviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-amber-500 flex items-center gap-1">
                          {Array.from({ length: review.rating || 0 }).map((_, index) => (
                            <Star key={index} className="h-4 w-4 fill-current" />
                          ))}
                          {(!review.rating || review.rating === 0) && (
                            <span className="text-xs uppercase tracking-wide text-gray-400">No rating</span>
                          )}
                        </div>
                        <h3 className="mt-2 text-lg font-semibold text-gray-900">
                          {review.title || 'Course feedback'}
                        </h3>
                      </div>
                    </div>
                    <div className="mt-2 text-xs uppercase tracking-wide text-gray-500">
                      {review.user?.name || review.user?.email || 'Learner'} •{' '}
                      {new Date(review.created_at).toLocaleDateString()}
                    </div>
                    <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-700">
                      {review.body}
                    </p>
                    {review.comments && review.comments.length > 0 && (
                      <div className="mt-5 space-y-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Instructor Responses
                        </div>
                        {review.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700"
                          >
                            <div className="mb-1 flex items-center justify-between text-[11px] text-gray-500">
                              <span className="font-medium text-gray-600">
                                {comment.author?.fullName ||
                                  comment.author?.firstName ||
                                  comment.author?.email ||
                                  'Team member'}
                              </span>
                              <span>{new Date(comment.created_at).toLocaleString()}</span>
                            </div>
                            <p className="whitespace-pre-line text-sm text-gray-700">{comment.body}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {canRespondToReviews && (
                      <div className="mt-5 space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Reply to this review
                        </label>
                        <textarea
                          value={reviewCommentDrafts[review.id] || ''}
                          onChange={(event) =>
                            handleReviewCommentChange(review.id, event.target.value)
                          }
                          rows={3}
                          placeholder="Thank the reviewer or share next steps..."
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleReviewCommentSubmit(review.id)}
                            disabled={
                              reviewCommentSubmitting === review.id ||
                              !(reviewCommentDrafts[review.id] && reviewCommentDrafts[review.id].trim().length > 0)
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-300"
                          >
                            {reviewCommentSubmitting === review.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : null}
                            {reviewCommentSubmitting === review.id ? 'Posting...' : 'Post Comment'}
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        );
      case 'support':
        return resolvedCourseId ? (
          <CourseSupportTab courseId={resolvedCourseId} currentLessonId={resolvedLessonId} />
        ) : (
          <div className="p-4 sm:p-6 space-y-4">
            <p className="text-gray-600">Loading course support...</p>
          </div>
        );
      case 'notes':
        return (
          <div className="p-4 sm:p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Notes</h2>
            <p className="text-gray-600">
              Personal note taking will be available in a future update. For now, keep track of key insights in your preferred note app.
            </p>
          </div>
        );
      case 'tools':
        return (
          <div className="p-4 sm:p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Learning Tools</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <Settings className="text-primary-600 mt-1" size={20} />
                <div>
                  <h3 className="font-medium text-gray-900">Resources</h3>
                  <p className="text-sm text-gray-600">
                    Downloadable materials and helpful links will appear here when provided by the instructor.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <Settings className="text-primary-600 mt-1" size={20} />
                <div>
                  <h3 className="font-medium text-gray-900">Practice Tools</h3>
                  <p className="text-sm text-gray-600">
                    Interactive practice and sandbox environments will be surfaced here in upcoming releases.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
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
      {isStudentContext && resolvedCourseId && (
        <div className="group fixed bottom-10 right-0 z-40 pr-2">
          <button
            type="button"
            onClick={handleReviewModalManualOpen}
            className="inline-flex translate-x-[85%] items-center gap-2 rounded-lg border border-transparent bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 ease-out group-hover:translate-x-0 group-hover:border-primary-500/70 group-hover:bg-white/10 group-hover:text-primary-700 group-hover:backdrop-blur-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
            aria-label="Share a course review"
          >
            <Star size={16} />
            Share Review
          </button>
        </div>
      )}
      <CourseReviewPromptModal
        open={Boolean(showReviewModal && resolvedCourseId)}
        courseId={resolvedCourseId ?? ''}
        courseTitle={course?.title}
        onSubmitted={handleReviewModalSubmitted}
        onClose={handleReviewModalClose}
      />
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
        onTriggerReview={isStudentContext ? handleReviewModalManualOpen : undefined}
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
          className={`fixed inset-0 bg-black bg-opacity-50 z-[54] lg:hidden transition-opacity duration-300 ${
            isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setIsSidebarOpen(false)}
        />
        
        {/* Sidebar - Course Structure */}
        <div className={`lg:col-span-1 ${
          isSidebarOpen 
            ? 'fixed inset-y-0 left-0 w-80 bg-white shadow-xl z-[55] lg:relative lg:z-auto lg:shadow-sm lg:inset-auto lg:w-auto transform transition-transform duration-300 ease-in-out translate-x-0' 
            : 'fixed inset-y-0 left-0 w-80 bg-white shadow-xl z-[55] lg:relative lg:z-auto lg:shadow-sm lg:inset-auto lg:w-auto transform transition-transform duration-300 ease-in-out -translate-x-full lg:translate-x-0 lg:block'
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
                    <progress
                      value={progressPercentage}
                      max={100}
                      className="w-full h-2 overflow-hidden rounded-full bg-gray-200 [&::-webkit-progress-bar]:bg-gray-200 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:bg-primary-600 [&::-webkit-progress-value]:rounded-full [&::-moz-progress-bar]:bg-primary-600"
                    />
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
                const hasCurrentContent = moduleContent.some(item => item.id === resolvedLessonId);
                
                return (
                  <div key={module.id} className="space-y-1">
                    <div className={`text-xs font-medium uppercase tracking-wider mb-2 px-3 py-1 rounded ${
                      hasCurrentContent
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-500'
                    }`}>
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
                            setActiveTab('lesson');
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
            <div className="border-b border-gray-200">
              <nav className="flex overflow-x-auto">
                {lessonTabs.map((tab) => {
                  const showAnnouncementsBadge = tab.value === 'announcements' && unreadAnnouncementsCount > 0;
                  const showSupportBadge = tab.value === 'support' && openSupportQuestionsCount > 0;
                  const showBadge = showAnnouncementsBadge || showSupportBadge;
                  const badgeCount = showAnnouncementsBadge ? unreadAnnouncementsCount : (showSupportBadge ? openSupportQuestionsCount : 0);
                  return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setActiveTab(tab.value)}
                      className={`relative px-4 sm:px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === tab.value
                        ? 'border-primary-600 text-primary-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                      {showBadge && (
                        <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-xs font-semibold text-white">
                          {badgeCount > 9 ? '9+' : badgeCount}
                        </span>
                      )}
                  </button>
                  );
                })}
              </nav>
            </div>

            {activeTab === 'lesson' ? (
              <>
                {/* Content Header - Sticky */}
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
                  <div className="p-4 sm:p-6">
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
                            {isCompleting ? (isCompleted ? 'Marking as Incomplete...' : 'Completing...') : (isCompleted ? 'Mark as Incomplete' : 'Mark as Complete')}
                          </span>
                          <span className="sm:hidden">
                            {isCompleting ? (isCompleted ? 'Marking as Incomplete...' : 'Completing...') : (isCompleted ? 'Mark as Incomplete' : 'Mark as Complete')}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">
                  {currentLesson && renderLessonContent()}
                  {currentQuiz && renderQuizContent()}
                </div>

                {/* Navigation */}
                <div className="p-4 sm:p-6 border-t border-gray-200">
                  <div className="flex  sm:items-center sm:justify-between gap-4">
                    <button
                      onClick={goToPreviousContent}
                      disabled={getCurrentContentIndex() === 0}
                      className="flex items-center justify-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                      <ChevronLeft size={18} className="mr-1" />
                      Previous
                    </button>

                    <div className="text-sm text-gray-600 text-center">
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
              </>
            ) : (
              renderNonLessonTabContent()
            )}
          </div>
        </div>
      </div>
      </PageLayout>
    </>
  );
};

export default StudentLessonViewer;

