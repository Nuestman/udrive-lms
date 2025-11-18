// Lesson Editor Modal - Rich text editor with TinyMCE
import React, { useState, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { X, Save, Upload, FileText, Loader2, PlaySquare } from 'lucide-react';
import { cleanLessonContent, sanitizeEditorContent } from '../../utils/htmlUtils';
import {
  uploadFileWithProgress,
  validateFile,
  getFileTypeNames,
  formatFileSize,
  FILE_SIZE_LIMITS
} from '../../utils/upload.utils';
import { renameFileForCourse, slugifySegment } from '../../utils/storagePaths';

interface LessonEditorModalProps {
  isOpen: boolean;
  lesson: any;
  onClose: () => void;
  onSave: (lessonId: string, updates: any) => Promise<void>;
  courseTitle?: string;
  courseSlug?: string;
  courseId?: string;
  tenantName?: string;
  tenantSlug?: string;
  tenantId?: string;
}

// Get TinyMCE API key from environment variables
const TINYMCE_API_KEY = import.meta.env.VITE_TINYMCE_API_KEY;
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const DOCUMENT_ACCEPT_TYPES = [
  '.pdf',
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
  '.xls',
  '.xlsx',
  '.txt',
  '.csv',
  '.rtf'
].join(',');
const VIDEO_ACCEPT_TYPES = 'video/*';

type LessonMediaMeta = {
  name?: string;
  size?: number;
  mime?: string;
  source?: 'upload' | 'manual';
};

const getFilenameFromUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  try {
    const withoutQuery = url.split('?')[0] || url;
    const segments = withoutQuery.split('/');
    const lastSegment = segments[segments.length - 1];
    return lastSegment ? decodeURIComponent(lastSegment) : undefined;
  } catch {
    return undefined;
  }
};

const extractLessonDocumentMeta = (lesson: any): LessonMediaMeta | null => {
  if (!lesson?.document_url) return null;
  const metaCandidate =
    lesson.document_metadata ||
    lesson.documentMeta ||
    lesson.document_info ||
    lesson.documentDetails ||
    lesson.document_meta;

  const inferredName =
    metaCandidate?.name ||
    metaCandidate?.filename ||
    metaCandidate?.file_name ||
    metaCandidate?.original_filename ||
    lesson.document_filename ||
    getFilenameFromUrl(lesson.document_url);

  const meta: LessonMediaMeta = {
    name: inferredName,
    size: metaCandidate?.size || metaCandidate?.file_size || lesson.document_file_size,
    mime: metaCandidate?.mime || metaCandidate?.mime_type || lesson.document_mime_type,
    source: metaCandidate ? 'upload' : 'manual',
  };

  if (!meta.name && !meta.size && !meta.mime) {
    const fallbackName = getFilenameFromUrl(lesson.document_url);
    return fallbackName ? { name: fallbackName, source: 'manual' } : null;
  }

  return meta;
};

const extractLessonVideoMeta = (lesson: any): LessonMediaMeta | null => {
  if (!lesson?.video_url) return null;
  const metaCandidate =
    lesson.video_metadata ||
    lesson.videoMeta ||
    lesson.video_info ||
    lesson.videoDetails ||
    lesson.video_meta;

  const inferredName =
    metaCandidate?.name ||
    metaCandidate?.filename ||
    metaCandidate?.file_name ||
    metaCandidate?.original_filename ||
    lesson.video_filename ||
    getFilenameFromUrl(lesson.video_url);

  const meta: LessonMediaMeta = {
    name: inferredName,
    size: metaCandidate?.size || metaCandidate?.file_size || lesson.video_file_size,
    mime: metaCandidate?.mime || metaCandidate?.mime_type || lesson.video_mime_type,
    source: metaCandidate ? 'upload' : 'manual',
  };

  if (!meta.name && !meta.size && !meta.mime) {
    const fallbackName = getFilenameFromUrl(lesson.video_url);
    return fallbackName ? { name: fallbackName, source: 'manual' } : null;
  }

  return meta;
};

const LessonEditorModal: React.FC<LessonEditorModalProps> = ({
  isOpen,
  lesson,
  onClose,
  onSave,
  courseTitle,
  courseSlug,
  courseId,
  tenantName,
  tenantSlug,
  tenantId
}) => {
  const editorRef = useRef<any>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(lesson?.title || '');
  const [lessonType, setLessonType] = useState(lesson?.lesson_type || 'text');
  const [videoUrl, setVideoUrl] = useState(lesson?.video_url || '');
  const [documentUrl, setDocumentUrl] = useState(lesson?.document_url || '');
  const [documentMeta, setDocumentMeta] = useState<LessonMediaMeta | null>(() => extractLessonDocumentMeta(lesson));
  const [videoMeta, setVideoMeta] = useState<LessonMediaMeta | null>(() => extractLessonVideoMeta(lesson));

  // Only allow http/https URLs
  const isSafeUrl = (url: string): boolean => {
    if (!url) return false;
    try {
      const parsed = new URL(url, window.location.origin); // support relative URLs if needed
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };
  const [documentUploading, setDocumentUploading] = useState(false);
  const [documentUploadProgress, setDocumentUploadProgress] = useState(0);
  const [documentUploadError, setDocumentUploadError] = useState<string | null>(null);
  const [pendingDocumentName, setPendingDocumentName] = useState<string | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoUploadError, setVideoUploadError] = useState<string | null>(null);
  const [pendingVideoName, setPendingVideoName] = useState<string | null>(null);
  const [duration, setDuration] = useState(lesson?.estimated_duration_minutes || '');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(lesson?.status || 'draft');
  const [error, setError] = useState('');

  // Initialize editor content from lesson
  const initialContent = React.useMemo(() => {
    return cleanLessonContent(lesson?.content);
  }, [lesson]);

  const normalizedCourseTitle = (courseTitle?.trim() || lesson?.course_title?.trim() || lesson?.courseTitle?.trim() || 'course') as string;
  const normalizedCourseSlugSource = courseSlug?.trim() || lesson?.course_slug?.trim() || lesson?.courseSlug?.trim() || normalizedCourseTitle;
  const normalizedTenantName = (tenantName?.trim() || lesson?.tenant_name?.trim() || lesson?.tenantName?.trim() || 'tenant') as string;
  const normalizedTenantSlugSource = tenantSlug?.trim() || lesson?.tenant_slug?.trim() || lesson?.tenantSlug?.trim() || normalizedTenantName;
  const resolvedCourseTitle = normalizedCourseTitle;
  const resolvedCourseSlug = slugifySegment(normalizedCourseSlugSource, 'course');
  const resolvedTenantName = normalizedTenantName;
  const resolvedTenantSlug = slugifySegment(normalizedTenantSlugSource, 'tenant');
  const resolvedCourseId = courseId || lesson?.course_id || lesson?.courseId || lesson?.module?.course_id || '';
  const resolvedTenantId = tenantId || lesson?.tenant_id || lesson?.tenantId || '';


  const resetDocumentInput = () => {
    if (documentInputRef.current) {
      documentInputRef.current.value = '';
    }
  };

  const resetVideoInput = () => {
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const lessonTitleForStorage = () => (title?.trim()?.length ? title.trim() : lesson?.title || 'lesson');
  // Note: filenames will use a slugified lesson title via renameFileForCourse()

  const buildLessonUploadPayload = (category: 'document' | 'video') => {
    const payload: Record<string, string> = {
      category,
      storageCategory: category === 'document' ? 'lesson-document' : 'lesson-video',
      lessonTitle: lessonTitleForStorage(),
      lessonSlug: slugifySegment(lessonTitleForStorage(), 'lesson'),
      tenantName: resolvedTenantName,
      tenantSlug: resolvedTenantSlug,
      courseTitle: resolvedCourseTitle,
      courseSlug: resolvedCourseSlug,
      storagePath: `sunlms-blob/tenants/${resolvedTenantSlug}/courses/${resolvedCourseSlug}/lessons`,
    };

    if (resolvedCourseId) {
      payload.courseId = resolvedCourseId;
    }

    if (resolvedTenantId) {
      payload.tenantId = resolvedTenantId;
    }

    if (lesson?.module_id) {
      payload.moduleId = lesson.module_id;
    } else if (lesson?.moduleId) {
      payload.moduleId = lesson.moduleId;
    }

    if (lesson?.id) {
      payload.lessonId = lesson.id;
    }

    return payload;
  };

  const uploadDocumentFile = async (file: File) => {
    setDocumentUploading(true);
    setDocumentUploadProgress(0);
    setDocumentUploadError(null);
    setPendingDocumentName(file.name);

    try {
      const renamedFile = renameFileForCourse(file, lessonTitleForStorage());
      const response = await uploadFileWithProgress(
        renamedFile,
        `${API_BASE}/media/upload`,
        'files',
        buildLessonUploadPayload('document'),
        (progress) => setDocumentUploadProgress(progress)
      );

      const uploaded = response?.files?.[0];
      if (!uploaded) {
        throw new Error('Upload failed. Please try again.');
      }

      const uploadedUrl = uploaded.file_url || uploaded.fileUrl || uploaded.url;
      if (!uploadedUrl) {
        throw new Error('Upload failed. File URL missing.');
      }

      setDocumentUrl(uploadedUrl);
      setDocumentMeta({
        name: uploaded.original_filename || uploaded.filename || uploaded.file_name || renamedFile.name,
        size: uploaded.file_size || uploaded.size || file.size,
        mime: uploaded.mime_type || uploaded.mimeType || file.type,
        source: 'upload',
      });
      setDocumentUploadProgress(100);
    } catch (err: any) {
      setDocumentUploadProgress(0);
      setDocumentUploadError(err?.message || 'Document upload failed. Please try again.');
    } finally {
      setDocumentUploading(false);
      setPendingDocumentName(null);
      resetDocumentInput();
    }
  };

  const handleDocumentFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setDocumentUploadError(null);

    const validation = validateFile(file, 'document');
    if (!validation.valid) {
      setDocumentUploadError(validation.error || 'Invalid file selected.');
      resetDocumentInput();
      return;
    }

    await uploadDocumentFile(file);
  };

  const handleRemoveDocument = () => {
    setDocumentUrl('');
    setDocumentMeta(null);
    setDocumentUploadProgress(0);
    setDocumentUploadError(null);
    setPendingDocumentName(null);
    resetDocumentInput();
  };

  const uploadVideoFile = async (file: File) => {
    setVideoUploading(true);
    setVideoUploadProgress(0);
    setVideoUploadError(null);
    setPendingVideoName(file.name);

    try {
      const renamedFile = renameFileForCourse(file, lessonTitleForStorage());
      const response = await uploadFileWithProgress(
        renamedFile,
        `${API_BASE}/media/upload`,
        'files',
        buildLessonUploadPayload('video'),
        (progress) => setVideoUploadProgress(progress)
      );

      const uploaded = response?.files?.[0];
      if (!uploaded) {
        throw new Error('Upload failed. Please try again.');
      }

      const uploadedUrl = uploaded.file_url || uploaded.fileUrl || uploaded.url;
      if (!uploadedUrl) {
        throw new Error('Upload failed. File URL missing.');
      }

      setVideoUrl(uploadedUrl);
      setVideoMeta({
        name: uploaded.original_filename || uploaded.filename || uploaded.file_name || renamedFile.name,
        size: uploaded.file_size || uploaded.size || file.size,
        mime: uploaded.mime_type || uploaded.mimeType || file.type,
        source: 'upload',
      });
      setVideoUploadProgress(100);
    } catch (err: any) {
      setVideoUploadProgress(0);
      setVideoUploadError(err?.message || 'Video upload failed. Please try again.');
    } finally {
      setVideoUploading(false);
      setPendingVideoName(null);
      resetVideoInput();
    }
  };

  const handleVideoFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setVideoUploadError(null);

    const validation = validateFile(file, 'video');
    if (!validation.valid) {
      setVideoUploadError(validation.error || 'Invalid file selected.');
      resetVideoInput();
      return;
    }

    await uploadVideoFile(file);
  };

  const handleRemoveUploadedVideo = () => {
    setVideoMeta(null);
    setVideoUploadProgress(0);
    setVideoUploadError(null);
    setPendingVideoName(null);
    resetVideoInput();
    setVideoUrl('');
  };

  const handleVideoUrlChange = (value: string) => {
    setVideoUrl(value);
    if (videoMeta?.source === 'upload') {
      setVideoMeta(null);
    }
  };

  const handleSave = async () => {
    setError('');
    
    if (!title.trim()) {
      setError('Lesson title is required');
      return;
    }

    if (lessonType === 'document') {
      if (documentUploading) {
        setError('Please wait for the document upload to finish.');
        return;
      }

      if (!documentUrl) {
        setError('Please upload a document file for this lesson.');
        return;
      }
    }

    if (lessonType === 'video' && videoUploading) {
      setError('Please wait for the video upload to finish.');
      return;
    }

    try {
      setSaving(true);
      
      // Get content from TinyMCE and sanitize it
      const rawEditorContent = editorRef.current ? editorRef.current.getContent() : '';
      const sanitizedContent = sanitizeEditorContent(rawEditorContent);
      
      // Debug: Log the content to see what's being saved
      console.log('Raw editor content:', rawEditorContent);
      console.log('Sanitized content:', sanitizedContent);
      
      // Store as simple JSON block for now (compatible with JSONB)
      const contentBlock = [{
        type: 'html',
        content: sanitizedContent
      }];

      await onSave(lesson.id, {
        title,
        content: contentBlock,
        lesson_type: lessonType,
        video_url: lessonType === 'video' ? (videoUrl || null) : null,
        document_url: lessonType === 'document' ? (documentUrl || null) : null,
        estimated_duration_minutes: duration ? parseInt(duration) : null,
        status,
      });

      onClose();
    } catch (err: any) {
      console.error('Lesson save error:', err);
      if (err.message?.includes('request entity too large')) {
        setError('Content too large. Please reduce image sizes or remove some content.');
      } else if (err.message?.includes('network')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(err.message || 'Failed to save lesson');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !lesson) return null;

  const documentDisplayName =
    documentMeta?.name ||
    getFilenameFromUrl(documentUrl) ||
    (documentUrl ? 'Lesson document' : '');

  const videoDisplayName =
    videoMeta?.name ||
    getFilenameFromUrl(videoUrl) ||
    (videoUrl ? 'Lesson video' : '');

  const isUploadedVideoActive = Boolean(videoUrl && videoMeta?.source === 'upload');

  const disableSave = saving || documentUploading || videoUploading;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Lesson</h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close editor"
            title="Close editor"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lesson Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Lesson title..."
            />
          </div>

          {/* Lesson Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="lesson-type" className="block text-sm font-medium text-gray-700 mb-1">
                Lesson Type
              </label>
              <select
                id="lesson-type"
                value={lessonType}
                onChange={(e) => setLessonType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Lesson Type"
                title="Select lesson type"
              >
                <option value="text">Text Content</option>
                <option value="video">Video</option>
                <option value="document">Document</option>
                <option value="quiz">Quiz</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="30"
                min="0"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              title="Lesson status"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          {/* Video URL & Upload (if video type) */}
          {lessonType === 'video' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Video URL
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => handleVideoUrlChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://youtube.com/watch?v=..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Paste a streaming link (YouTube, Vimeo, etc.) or upload a video file below.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Video
                </label>
                <div
                  className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                    videoUploading
                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-80'
                      : 'border-gray-300 bg-white hover:border-primary-400 cursor-pointer'
                  }`}
                  onClick={() => {
                    if (!videoUploading) {
                      videoInputRef.current?.click();
                    }
                  }}
                >
                  {videoUploading ? (
                    <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-2" />
                  ) : (
                    <Upload className="w-8 h-8 text-primary-600 mb-2" />
                  )}
                  <p className="text-sm font-medium text-gray-700">
                    {videoUploading ? 'Uploading video...' : 'Click to upload video file'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Supports {getFileTypeNames('video')} • Max {FILE_SIZE_LIMITS.video}MB
                  </p>
                </div>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept={VIDEO_ACCEPT_TYPES}
                  onChange={handleVideoFileSelect}
                  className="hidden"
                  title="Select a video file to upload"
                  aria-label="Select video file"
                />
                {videoUploading && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Uploading {pendingVideoName || 'video'}...</span>
                      <span>{videoUploadProgress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full bg-primary-500 transition-all"
                        style={{ width: `${videoUploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                {isUploadedVideoActive && !videoUploading && (
                  <div className="mt-4 rounded-lg border border-primary-100 bg-primary-50/70 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <PlaySquare className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary-900 break-words">{videoDisplayName}</p>
                        {(videoMeta?.mime || videoMeta?.size) && (
                          <div className="text-xs text-primary-700 space-x-2">
                            {videoMeta?.mime && <span>{videoMeta.mime}</span>}
                            {videoMeta?.size && <span>{formatFileSize(videoMeta.size)}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSafeUrl(videoUrl) && (
                        <a
                          href={videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-sm font-medium text-primary-700 bg-white border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
                        >
                          Open
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={handleRemoveUploadedVideo}
                        className="px-3 py-1.5 text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
                {videoUploadError && (
                  <p className="mt-2 text-sm text-rose-600">{videoUploadError}</p>
                )}
              </div>
            </div>
          )}

          {/* Document Upload (if document type) */}
          {lessonType === 'document' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lesson Document *
              </label>
              <div
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                  documentUploading
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-80'
                    : 'border-gray-300 bg-white hover:border-primary-400 cursor-pointer'
                }`}
                onClick={() => {
                  if (!documentUploading) {
                    documentInputRef.current?.click();
                  }
                }}
              >
                {documentUploading ? (
                  <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-2" />
                ) : (
                  <Upload className="w-8 h-8 text-primary-600 mb-2" />
                )}
                <p className="text-sm font-medium text-gray-700">
                  {documentUploading ? 'Uploading document...' : documentUrl ? 'Replace document' : 'Click to upload document'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supports {getFileTypeNames('document')} • Max {FILE_SIZE_LIMITS.document}MB
                </p>
              </div>
              <input
                ref={documentInputRef}
                type="file"
                accept={DOCUMENT_ACCEPT_TYPES}
                onChange={handleDocumentFileSelect}
                className="hidden"
                title="Select a document file to upload"
                aria-label="Select document file"
              />
              {documentUploading && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Uploading {pendingDocumentName || 'document'}...</span>
                    <span>{documentUploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full bg-primary-500 transition-all"
                      style={{ width: `${documentUploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              {documentUrl && !documentUploading && (
                <div className="mt-4 rounded-lg border border-primary-100 bg-primary-50/70 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <FileText className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary-900 break-words">{documentDisplayName}</p>
                      {(documentMeta?.mime || documentMeta?.size) && (
                        <div className="text-xs text-primary-700 space-x-2">
                          {documentMeta?.mime && <span>{documentMeta.mime}</span>}
                          {documentMeta?.size && <span>{formatFileSize(documentMeta.size)}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-sm font-medium text-primary-700 bg-white border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
                    >
                      Open
                    </a>
                    <button
                      type="button"
                      onClick={handleRemoveDocument}
                      className="px-3 py-1.5 text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
              {documentUploadError && (
                <p className="mt-2 text-sm text-rose-600">{documentUploadError}</p>
              )}
              {!documentUrl && !documentUploading && (
                <p className="mt-2 text-xs text-gray-500">
                  Upload PowerPoint or Word files to enable the in-app lesson viewer for students.
                </p>
              )}
            </div>
          )}

          {/* Rich Text Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lesson Content
            </label>
            <p className="text-xs text-gray-500 mb-2">
              💡 Tip: Keep images under 2MB for best performance. You can upload images via the Upload tab or drag & drop them directly into the editor. For YouTube videos, use the Media button and paste the YouTube URL.
            </p>
            <Editor
              apiKey={TINYMCE_API_KEY}
              onInit={(evt, editor) => editorRef.current = editor}
              initialValue={initialContent}
              init={{
                height: 400,
                menubar: false,
                plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount code fullscreen',
                toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | code fullscreen | removeformat',
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px; line-height:1.6; }',
                branding: false,
                promotion: false,
                // Additional settings for better editor experience
                resize: true,
                statusbar: true,
                elementpath: false,
                // Image upload settings (can be configured later with backend)
                images_upload_handler: (blobInfo: any) => {
                  return new Promise((resolve, reject) => {
                    // Check file size (limit to 2MB for base64 conversion)
                    if (blobInfo.blob().size > 2 * 1024 * 1024) {
                      reject('Image size must be less than 2MB');
                      return;
                    }
                    
                    // For now, convert to base64 (you can implement server upload later)
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      resolve(reader.result as string);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blobInfo.blob());
                  });
                },
                // Image settings
                image_advtab: true,
                image_uploadtab: true,
                // Auto-resize images to prevent huge content
                automatic_uploads: true,
                file_picker_types: 'image',
                // Enable drag and drop for images
                paste_data_images: true,
                // Image dialog settings
                image_caption: true,
                image_title: true,
                // File picker callback for additional file handling
                file_picker_callback: (callback: any, value: any, meta: any) => {
                  if (meta.filetype === 'image') {
                    const input = document.createElement('input');
                    input.setAttribute('type', 'file');
                    input.setAttribute('accept', 'image/*');
                    input.click();
                    
                    input.onchange = function() {
                      const file = (input.files as FileList)[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = function() {
                          callback(reader.result, { alt: file.name });
                        };
                        reader.readAsDataURL(file);
                      }
                    };
                  }
                },
                // Auto-save settings
                setup: (editor: any) => {
                  editor.on('change', () => {
                    editor.save();
                  });
                }
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={disableSave}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} className="mr-2" />
            {saving ? 'Saving...' : documentUploading ? 'Uploading document...' : videoUploading ? 'Uploading video...' : 'Save Lesson'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonEditorModal;

