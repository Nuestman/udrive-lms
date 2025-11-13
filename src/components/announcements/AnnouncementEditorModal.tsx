import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { sanitizeEditorContent } from '../../utils/htmlUtils';
import {
  Announcement,
  AnnouncementAudienceScope,
  AnnouncementMedia,
  AnnouncementPayload,
} from '../../services/announcements.service';
import {
  X,
  Save,
  Calendar,
  Plus,
  Trash2,
  Link as LinkIcon,
  Target,
  Pin,
} from 'lucide-react';
import { useCourses } from '../../hooks/useCourses';
import { useModules } from '../../hooks/useModules';
import { useLessons } from '../../hooks/useLessons';
import { quizzesApi } from '../../lib/api';
import { uploadFileWithProgress, formatFileSize } from '../../utils/upload.utils';

type AnnouncementStatus = Announcement['status'];

interface AttachmentInput {
  id?: string;
  mediaType: AnnouncementMedia['mediaType'];
  url: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  altText?: string;
  mimeType?: string;
  fileSize?: number | null;
  fileId?: string;
  metadata?: Record<string, unknown>;
  uploading?: boolean;
  uploadProgress?: number;
  uploadError?: string;
}

interface AnnouncementEditorModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialAnnouncement?: Announcement | null;
  allowTenantId?: boolean;
  onClose: () => void;
  onSubmit: (payload: AnnouncementPayload) => Promise<void>;
  submitting?: boolean;
  audienceScopeOptions?: AnnouncementAudienceScope[];
  lockedAudienceScope?: AnnouncementAudienceScope;
  lockedCourseId?: string;
  disableAudienceSelection?: boolean;
}

const TINYMCE_API_KEY = import.meta.env.VITE_TINYMCE_API_KEY;

const audienceOptions: AnnouncementAudienceScope[] = [
  'global',
  'tenant',
  'course',
  'module',
  'lesson',
  'quiz',
];

const availableRoles = ['student', 'instructor', 'school_admin', 'super_admin'] as const;

const statusOptions: AnnouncementStatus[] = ['draft', 'scheduled', 'published', 'archived'];

const defaultAttachment = (): AttachmentInput => ({
  mediaType: 'image',
  url: '',
  title: '',
  description: '',
  thumbnailUrl: '',
  altText: '',
  mimeType: '',
  fileSize: null,
  fileId: undefined,
  metadata: undefined,
  uploading: false,
  uploadProgress: 0,
  uploadError: undefined,
});

const AnnouncementEditorModal: React.FC<AnnouncementEditorModalProps> = ({
  open,
  mode,
  initialAnnouncement,
  allowTenantId = false,
  onClose,
  onSubmit,
  submitting = false,
  audienceScopeOptions = audienceOptions,
  lockedAudienceScope,
  lockedCourseId,
  disableAudienceSelection = false,
}) => {
  const editorRef = useRef<any>(null);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [audienceScope, setAudienceScope] = useState<AnnouncementAudienceScope>('tenant');
  const [targetRoles, setTargetRoles] = useState<string[]>(['student']);
  const [status, setStatus] = useState<AnnouncementStatus>('draft');
  const [scheduledFor, setScheduledFor] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [isPinned, setIsPinned] = useState(false);
  const [sendEmail, setSendEmail] = useState<boolean>(false);
  const [tenantId, setTenantId] = useState<string>('');
  const [courseId, setCourseId] = useState<string>('');
  const [moduleId, setModuleId] = useState<string>('');
  const [lessonId, setLessonId] = useState<string>('');
  const [quizId, setQuizId] = useState<string>('');
  const [ctaUrl, setCtaUrl] = useState<string>('');
  const [attachments, setAttachments] = useState<AttachmentInput[]>([]);
  const [error, setError] = useState<string>('');

  const scopeOptions =
    audienceScopeOptions && audienceScopeOptions.length > 0
      ? audienceScopeOptions
      : audienceOptions;

  const { courses, loading: coursesLoading } = useCourses();
  const { modules, loading: modulesLoading } = useModules(courseId || undefined);
  const { lessons, loading: lessonsLoading } = useLessons(moduleId || undefined);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [quizzesError, setQuizzesError] = useState<string | null>(null);

  const isEditMode = mode === 'edit' && Boolean(initialAnnouncement);
  const showScheduleFields = status === 'scheduled';

  useEffect(() => {
    if (!open) {
      return;
    }

    prevCourseIdRef.current = null;
    prevModuleIdRef.current = null;

    const resolvedAudienceScope =
      (initialAnnouncement ? initialAnnouncement.audienceScope : lockedAudienceScope) || 'tenant';

    const resolvedCourseId =
      (initialAnnouncement ? initialAnnouncement.courseId : lockedCourseId) || '';

    if (initialAnnouncement) {
      setTitle(initialAnnouncement.title || '');
      setSummary(initialAnnouncement.summary || '');
      setBodyHtml(initialAnnouncement.bodyHtml || '');
      setAudienceScope(resolvedAudienceScope);
      setTargetRoles(initialAnnouncement.targetRoles ?? ['student']);
      setStatus(initialAnnouncement.status);
      setScheduledFor(initialAnnouncement.scheduledFor || '');
      setExpiresAt(initialAnnouncement.expiresAt || '');
      setIsPinned(Boolean(initialAnnouncement.isPinned));
      setSendEmail(false);
      setTenantId(initialAnnouncement.tenantId || '');
      setCourseId(resolvedCourseId);
      setModuleId(initialAnnouncement.moduleId || '');
      setLessonId(initialAnnouncement.lessonId || '');
      setQuizId(initialAnnouncement.quizId || '');
      const metadata = (initialAnnouncement.metadata || {}) as Record<string, unknown>;
      setCtaUrl(typeof metadata?.ctaUrl === 'string' ? metadata.ctaUrl : '');
      if (
        !metadata?.ctaUrl &&
        typeof (metadata as any)?.cta_url === 'string'
      ) {
        setCtaUrl((metadata as any).cta_url);
      }
      setAttachments(
        Array.isArray(initialAnnouncement.media) && initialAnnouncement.media.length > 0
          ? initialAnnouncement.media.map((item) => ({
              id: item.id,
              mediaType: item.mediaType,
              url: item.url,
              title: item.title || '',
              description: item.description || '',
              thumbnailUrl: item.thumbnailUrl || '',
              altText: item.altText || '',
              mimeType: item.mimeType || '',
              fileSize: item.fileSize ?? null,
              fileId: (item.metadata as any)?.fileId,
              metadata: item.metadata,
              uploading: false,
              uploadProgress: item.url ? 100 : 0,
              uploadError: undefined,
            }))
          : []
      );
    } else {
      setTitle('');
      setSummary('');
      setBodyHtml('');
      setAudienceScope(resolvedAudienceScope);
      setTargetRoles(['student']);
      setStatus('draft');
      setScheduledFor('');
      setExpiresAt('');
      setIsPinned(false);
      setSendEmail(false);
      setTenantId('');
      setCourseId(resolvedCourseId);
      setModuleId('');
      setLessonId('');
      setQuizId('');
      setCtaUrl('');
      setAttachments([]);
    }
    setError('');
  }, [open, initialAnnouncement, lockedAudienceScope, lockedCourseId]);

  useEffect(() => {
    if (!moduleId || audienceScope !== 'quiz') {
      setQuizzes([]);
      setQuizzesError(null);
      setQuizzesLoading(false);
      return;
    }

    let isCancelled = false;
    const fetchQuizzes = async () => {
      try {
        setQuizzesLoading(true);
        setQuizzesError(null);
        const response = await quizzesApi.listByModule(moduleId);
        if (!isCancelled) {
          setQuizzes(response?.data || []);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setQuizzesError(err?.message || 'Unable to load quizzes for this module.');
          setQuizzes([]);
        }
      } finally {
        if (!isCancelled) {
          setQuizzesLoading(false);
        }
      }
    };

    fetchQuizzes();
    return () => {
      isCancelled = true;
    };
  }, [moduleId, audienceScope]);

  useEffect(() => {
    // Clear dependent selections when audience scope changes
    if (audienceScope === 'global') {
      setTenantId('');
      setCourseId('');
      setModuleId('');
      setLessonId('');
      setQuizId('');
    } else if (audienceScope === 'tenant') {
      setCourseId('');
      setModuleId('');
      setLessonId('');
      setQuizId('');
    } else if (audienceScope === 'course') {
      setModuleId('');
      setLessonId('');
      setQuizId('');
    } else if (audienceScope === 'module') {
      setLessonId('');
      setQuizId('');
    } else if (audienceScope === 'lesson') {
      setQuizId('');
    }
  }, [audienceScope]);

  const prevCourseIdRef = useRef<string | null>(null);
  const prevModuleIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (prevCourseIdRef.current === null) {
      prevCourseIdRef.current = courseId;
      return;
    }

    if (prevCourseIdRef.current !== courseId) {
      setModuleId('');
      setLessonId('');
      setQuizId('');
    }

    prevCourseIdRef.current = courseId;
  }, [courseId]);

  useEffect(() => {
    if (prevModuleIdRef.current === null) {
      prevModuleIdRef.current = moduleId;
      return;
    }

    if (prevModuleIdRef.current !== moduleId) {
      setLessonId('');
      setQuizId('');
    }

    prevModuleIdRef.current = moduleId;
  }, [moduleId]);

  const sanitizedBody = useMemo(() => sanitizeEditorContent(bodyHtml), [bodyHtml]);

  const updateAttachment = (index: number, updates: Partial<AttachmentInput>) => {
    setAttachments((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...updates } : item))
    );
  };

  const handleRoleToggle = (role: string) => {
    setTargetRoles((prev) =>
      prev.includes(role) ? prev.filter((item) => item !== role) : [...prev, role]
    );
  };

  const handleAttachmentChange = (index: number, field: keyof AttachmentInput, value: string) => {
    if (field === 'mediaType') {
      const newType = value as AttachmentInput['mediaType'];
      setAttachments((prev) =>
        prev.map((item, idx) =>
          idx === index
            ? {
                ...item,
                mediaType: newType,
                ...(newType === 'embed'
                  ? {}
                  : {
                      url: '',
                      uploadError: undefined,
                      uploadProgress: 0,
                      uploading: false,
                    }),
              }
            : item
        )
      );
      return;
    }

    updateAttachment(index, { [field]: value } as Partial<AttachmentInput>);
  };

  const handleAddAttachment = () => {
    setAttachments((prev) => [...prev, defaultAttachment()]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

const mediaTypeCategoryMap: Record<string, string> = {
    image: 'image',
    video: 'video',
    audio: 'audio',
    document: 'document',
  };

  const mediaTypeAcceptMap: Record<string, string> = {
    image: 'image/*',
    video: 'video/*',
    audio: 'audio/*',
    document:
      '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.zip,.rar,.7z,.json,.rtf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv',
  };

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 80);

  const getSelectedCourse = (id: string | undefined) =>
    courses.find((course) => course.id === id);

  const resolveStorageCategory = () => {
    switch (audienceScope) {
      case 'course':
        return 'course-announcement';
      case 'module':
        return 'module-announcement';
      case 'lesson':
        return 'lesson-announcement';
      case 'quiz':
        return 'quiz-announcement';
      default:
        return 'announcement';
    }
  };

  const handleAttachmentFileSelect = async (index: number, file: File | null) => {
    if (!file) return;

    setAttachments((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              uploading: true,
              uploadProgress: 0,
              uploadError: undefined,
            }
          : item
      )
    );

    const categoryKey = attachments[index]?.mediaType || 'document';
    const category = mediaTypeCategoryMap[categoryKey] || 'document';
    const storageCategory = resolveStorageCategory();
    const resolvedCourseId = lockedCourseId || courseId || undefined;
    const courseRecord = resolvedCourseId ? getSelectedCourse(resolvedCourseId) : undefined;
    const derivedCourseSlug =
      courseRecord?.slug ||
      (courseRecord?.title ? slugify(courseRecord.title) : undefined);

    try {
      const uploadPayload: Record<string, string> = {
        category,
        storageCategory,
        audienceScope,
      };

      if (resolvedCourseId) {
        uploadPayload.courseId = resolvedCourseId;
      }
      if (derivedCourseSlug) {
        uploadPayload.courseSlug = derivedCourseSlug;
      }
      if (moduleId) {
        uploadPayload.moduleId = moduleId;
      }
      if (lessonId) {
        uploadPayload.lessonId = lessonId;
      }
      if (quizId) {
        uploadPayload.quizId = quizId;
      }
      if (initialAnnouncement?.id) {
        uploadPayload.announcementId = initialAnnouncement.id;
      }

      const response = await uploadFileWithProgress(
        file,
        `${API_BASE}/media/upload`,
        'files',
        uploadPayload,
        (progress) => {
          setAttachments((prev) =>
            prev.map((item, idx) =>
              idx === index
                ? {
                    ...item,
                    uploadProgress: progress,
                  }
                : item
            )
          );
        }
      );

      const uploaded = response?.files?.[0];
      if (!uploaded) {
        throw new Error('Upload failed. No file returned.');
      }

      setAttachments((prev) =>
        prev.map((item, idx) => {
          if (idx !== index) return item;
          const uploadedUrl = uploaded.file_url || uploaded.fileUrl || uploaded.url || item.url;
          const uploadedMime = uploaded.mime_type || uploaded.mimeType || file.type;
          const uploadedSize = uploaded.file_size || uploaded.size || file.size;
          const uploadedTitle =
            item.title && item.title.trim().length > 0
              ? item.title
              : uploaded.original_filename || uploaded.originalFilename || uploaded.filename || file.name;

          return {
            ...item,
            url: uploadedUrl,
            title: uploadedTitle,
            mimeType: uploadedMime,
            fileSize: uploadedSize,
            thumbnailUrl:
              item.mediaType === 'image'
                ? uploadedUrl
                : item.thumbnailUrl,
            fileId: uploaded.id || item.fileId,
            metadata: uploaded.metadata || item.metadata,
            uploading: false,
            uploadProgress: 100,
            uploadError: undefined,
          };
        })
      );
    } catch (err: any) {
      setAttachments((prev) =>
        prev.map((item, idx) =>
          idx === index
            ? {
                ...item,
                uploading: false,
                uploadError: err?.message || 'Upload failed',
              }
            : item
        )
      );
    }
  };

  const validate = () => {
    if (!title.trim()) {
      setError('Title is required.');
      return false;
    }

    if (!sanitizedBody || sanitizedBody.trim().length === 0) {
      setError('Announcement content cannot be empty.');
      return false;
    }

    if (targetRoles.length === 0) {
      setError('Select at least one target role.');
      return false;
    }

    if (audienceScope === 'course' && !courseId.trim()) {
      setError('Select a course for course-scoped announcements.');
      return false;
    }

    if (audienceScope === 'module' && !moduleId.trim()) {
      setError('Select a module for module-scoped announcements.');
      return false;
    }

    if (audienceScope === 'lesson' && !lessonId.trim()) {
      setError('Select a lesson for lesson-scoped announcements.');
      return false;
    }

    if (audienceScope === 'quiz' && !quizId.trim()) {
      setError('Select a quiz for quiz-scoped announcements.');
      return false;
    }

    if (allowTenantId && audienceScope !== 'global' && !tenantId.trim()) {
      setError('Tenant ID is required for non-global announcements.');
      return false;
    }

    if (showScheduleFields && !scheduledFor.trim()) {
      setError('Select a date and time for scheduled announcements.');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    const metadata: Record<string, unknown> = {};
    if (ctaUrl.trim()) {
      metadata.ctaUrl = ctaUrl.trim();
    }

    const payload: AnnouncementPayload = {
      title: title.trim(),
      summary: summary.trim() || null,
      body_html: sanitizedBody,
      audience_scope: audienceScope,
      target_roles: targetRoles,
      status,
      publish_now:
        !isEditMode && status === 'published'
          ? true
          : isEditMode && initialAnnouncement?.status !== 'published' && status === 'published'
          ? true
          : undefined,
      scheduled_for: showScheduleFields ? scheduledFor : undefined,
      expires_at: showScheduleFields && expiresAt ? expiresAt : undefined,
      is_pinned: isPinned,
      course_id: courseId.trim() || null,
      module_id: moduleId.trim() || null,
      lesson_id: lessonId.trim() || null,
      quiz_id: quizId.trim() || null,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      media: attachments
        .filter((item) => item.url && item.url.trim().length > 0)
        .map((item) => ({
          id: item.id,
          mediaType: item.mediaType,
          url: item.url.trim(),
          title: item.title?.trim() || null,
          description: item.description?.trim() || null,
          thumbnailUrl:
            item.mediaType === 'image'
              ? (item.thumbnailUrl?.trim() || item.url.trim())
              : item.thumbnailUrl?.trim() || null,
          altText: item.altText?.trim() || null,
          mimeType: item.mimeType?.trim() || null,
          fileSize: item.fileSize ?? null,
          metadata:
            item.mediaType === 'embed'
              ? item.metadata
              : item.metadata || (item.fileId ? { fileId: item.fileId } : undefined),
        })),
      send_email: sendEmail || undefined,
    };

    if (allowTenantId && tenantId.trim()) {
      payload.tenant_id = tenantId.trim();
    }

    try {
      await onSubmit(payload);
    } catch (submitError) {
      console.error('Announcement submit error:', submitError);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditMode ? 'Edit Announcement' : 'Create Announcement'}
            </h2>
            <p className="text-sm text-gray-500">
              Craft an announcement with rich content, audience targeting, and optional email blast.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close editor"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {allowTenantId && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Target size={16} />
                Tenant ID
              </label>
              <input
                value={tenantId}
                onChange={(event) => setTenantId(event.target.value)}
                placeholder="Tenant ID (required for scoped announcements)"
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Title *</label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Announcement title"
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Summary</label>
              <input
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="Short summary (optional)"
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Announcement Content *
            </label>
            <div className="mt-2 rounded-lg border border-gray-200">
              <Editor
                apiKey={TINYMCE_API_KEY}
                onInit={(_, editor) => (editorRef.current = editor)}
                value={bodyHtml}
                onEditorChange={(content) => setBodyHtml(content)}
                init={{
                  height: 360,
                  menubar: false,
                  branding: false,
                  plugins: [
                    'advlist',
                    'autolink',
                    'lists',
                    'link',
                    'charmap',
                    'preview',
                    'anchor',
                    'searchreplace',
                    'visualblocks',
                    'code',
                    'fullscreen',
                    'insertdatetime',
                    'media',
                    'table',
                    'help',
                    'wordcount',
                  ],
                  toolbar:
                    'undo redo | formatselect | bold italic underline | ' +
                    'alignleft aligncenter alignright alignjustify | ' +
                    'bullist numlist outdent indent | removeformat | help',
                  content_style:
                    'body { font-family:Inter,system-ui,-apple-system,sans-serif; font-size:14px }',
                }}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Audience Scope</label>
              <select
                value={audienceScope}
                onChange={(event) => setAudienceScope(event.target.value as AnnouncementAudienceScope)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                disabled={disableAudienceSelection || scopeOptions.length === 1}
              >
                {scopeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as AnnouncementStatus)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600">
                <Pin size={16} />
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  checked={isPinned}
                  onChange={(event) => setIsPinned(event.target.checked)}
                />
                Pin announcement
              </label>
            </div>
          </div>

          {(audienceScope === 'course' ||
            audienceScope === 'module' ||
            audienceScope === 'lesson' ||
            audienceScope === 'quiz') && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Course
                  <span className="ml-1 text-xs text-rose-500">*</span>
                </label>
                <select
                  value={courseId}
                  onChange={(event) => setCourseId(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                disabled={Boolean(lockedCourseId) || coursesLoading || courses.length === 0}
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title || course.name || course.id}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {coursesLoading
                    ? 'Loading courses...'
                    : courses.length === 0
                    ? 'No courses available. Create a course first.'
                    : 'Choose the course this announcement belongs to.'}
                </p>
              </div>

              {(audienceScope === 'module' || audienceScope === 'lesson' || audienceScope === 'quiz') && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Module
                    <span className="ml-1 text-xs text-rose-500">*</span>
                  </label>
                  <select
                    value={moduleId}
                    onChange={(event) => setModuleId(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    disabled={!courseId || modulesLoading || modules.length === 0}
                  >
                    <option value="">Select a module</option>
                    {modules.map((module) => (
                      <option key={module.id} value={module.id}>
                        {module.title || module.name || module.id}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {courseId
                      ? modulesLoading
                        ? 'Loading modules...'
                        : modules.length === 0
                        ? 'No modules available for this course.'
                        : ''
                      : 'Select a course first.'}
                  </p>
                </div>
              )}

              {(audienceScope === 'lesson' || audienceScope === 'quiz') && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Lesson
                    <span className="ml-1 text-xs text-rose-500">*</span>
                  </label>
                  <select
                    value={lessonId}
                    onChange={(event) => setLessonId(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    disabled={!moduleId || lessonsLoading || lessons.length === 0}
                  >
                    <option value="">Select a lesson</option>
                    {lessons.map((lesson) => (
                      <option key={lesson.id} value={lesson.id}>
                        {lesson.title || lesson.name || lesson.id}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {moduleId
                      ? lessonsLoading
                        ? 'Loading lessons...'
                        : lessons.length === 0
                        ? 'No lessons available for this module.'
                        : ''
                      : 'Select a module first.'}
                  </p>
                </div>
              )}

              {audienceScope === 'quiz' && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Quiz
                    <span className="ml-1 text-xs text-rose-500">*</span>
                  </label>
                  <select
                    value={quizId}
                    onChange={(event) => setQuizId(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    disabled={!moduleId || quizzesLoading || quizzes.length === 0}
                  >
                    <option value="">Select a quiz</option>
                    {quizzes.map((quiz) => (
                      <option key={quiz.id} value={quiz.id}>
                        {quiz.title || quiz.name || quiz.id}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {moduleId
                      ? quizzesLoading
                        ? 'Loading quizzes...'
                        : quizzesError
                        ? quizzesError
                        : quizzes.length === 0
                        ? 'No quizzes available for this module.'
                        : ''
                      : 'Select a module first.'}
                  </p>
                </div>
              )}
            </div>
          )}

          <div>
            <span className="text-sm font-medium text-gray-700">Target Roles</span>
            <div className="mt-3 flex flex-wrap gap-3">
              {availableRoles.map((role) => (
                <label
                  key={role}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                    targetRoles.includes(role)
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={targetRoles.includes(role)}
                    onChange={() => handleRoleToggle(role)}
                  />
                  {role.replace('_', ' ')}
                </label>
              ))}
            </div>
          </div>

          {showScheduleFields && (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
                  <Calendar size={14} />
                  Scheduled Publish
                </span>
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(event) => setScheduledFor(event.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
                  <Calendar size={14} />
                  Expires At
                </span>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </label>
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <LinkIcon size={16} />
              Call-to-action URL
            </label>
            <input
              value={ctaUrl}
              onChange={(event) => setCtaUrl(event.target.value)}
              placeholder="https://example.com/details"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
            <p className="mt-2 text-xs text-gray-500">
              Optional link for “View details” buttons in the announcement card and email.
            </p>
          </div>

          <section className="space-y-4 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
            <header className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Attachments & Media</h3>
                <p className="text-xs text-gray-500">
                  Add images, documents, or media links to enrich the announcement.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddAttachment}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:border-primary-200 hover:text-primary-700"
              >
                <Plus size={14} />
                Add attachment
              </button>
            </header>

            {attachments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
                <p className="text-sm text-gray-500">
                  No attachments yet. Click "Add attachment" to add media files or links.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {attachments.map((attachment, index) => (
                <div
                  key={`attachment-${index}`}
                  className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Attachment {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(index)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                      <Trash2 size={14} />
                      Remove
                    </button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="text-sm font-medium text-gray-700">
                      Type
                      <select
                        value={attachment.mediaType}
                        onChange={(event) =>
                          handleAttachmentChange(index, 'mediaType', event.target.value)
                        }
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                      >
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                        <option value="document">Document</option>
                        <option value="embed">Embed</option>
                      </select>
                    </label>
                    {attachment.mediaType === 'embed' ? (
                      <label className="text-sm font-medium text-gray-700 md:col-span-2">
                        Embed URL
                        <input
                          value={attachment.url}
                          onChange={(event) =>
                            handleAttachmentChange(index, 'url', event.target.value)
                          }
                          placeholder="https://..."
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                        />
                        <span className="mt-1 block text-xs text-gray-500">
                          Provide the external link to the embedded media.
                        </span>
                      </label>
                    ) : (
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Upload file
                        </label>
                        <input
                          type="file"
                          accept={mediaTypeAcceptMap[attachment.mediaType] || '*'}
                          onChange={(event) =>
                            handleAttachmentFileSelect(index, event.target.files?.[0] || null)
                          }
                          disabled={attachment.uploading}
                          className="w-full cursor-pointer rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:cursor-not-allowed"
                        />
                        {attachment.uploading && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                              <div
                                className="h-2 rounded-full bg-primary-500 transition-all"
                                style={{ width: `${attachment.uploadProgress || 0}%` }}
                              />
                            </div>
                            <span>{attachment.uploadProgress || 0}%</span>
                          </div>
                        )}
                        {attachment.uploadError && (
                          <p className="text-xs text-rose-600">{attachment.uploadError}</p>
                        )}
                        {attachment.url && (
                          <div className="rounded-lg bg-primary-50/60 px-3 py-2 text-xs text-primary-700">
                            <div className="font-semibold">Current file</div>
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary-600 underline hover:text-primary-700"
                            >
                              {attachment.title || attachment.url}
                            </a>
                            {(attachment.fileSize || attachment.mimeType) && (
                              <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-primary-600">
                                {attachment.fileSize && (
                                  <span>{formatFileSize(attachment.fileSize)}</span>
                                )}
                                {attachment.mimeType && <span>{attachment.mimeType}</span>}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="text-sm font-medium text-gray-700">
                      Title
                      <input
                        value={attachment.title}
                        onChange={(event) =>
                          handleAttachmentChange(index, 'title', event.target.value)
                        }
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                      />
                    </label>
                    <label className="text-sm font-medium text-gray-700 md:col-span-2">
                      Description
                      <input
                        value={attachment.description}
                        onChange={(event) =>
                          handleAttachmentChange(index, 'description', event.target.value)
                        }
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                      />
                    </label>
                  </div>
                  {attachment.mediaType === 'image' && (
                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="text-sm font-medium text-gray-700">
                        Alt text
                        <input
                          value={attachment.altText}
                          onChange={(event) =>
                            handleAttachmentChange(index, 'altText', event.target.value)
                          }
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                        />
                      </label>
                      <div className="md:col-span-2 text-xs text-gray-500">
                        Alternative text improves accessibility and email rendering.
                      </div>
                    </div>
                  )}
                </div>
                ))}
              </div>
            )}
          </section>

          <div className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                checked={sendEmail}
                onChange={(event) => setSendEmail(event.target.checked)}
              />
              Send as email broadcast
            </label>
            <p className="text-xs text-gray-500">
              When enabled, recipients matching the target roles will receive the announcement via
              email in addition to the in-app feed.
            </p>
          </div>
        </div>

        <footer className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-gray-500">
            Fields marked with * are required. Rich content is automatically sanitized before
            saving.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={16} />
              {submitting ? 'Saving...' : isEditMode ? 'Update Announcement' : 'Create Announcement'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AnnouncementEditorModal;
