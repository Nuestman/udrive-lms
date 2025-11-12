import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MessageSquare,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Eye,
  MessageCircle,
  User,
  HelpCircle,
  Award,
  BookOpen,
  Settings,
  X,
  Paperclip,
  Trash2,
  Download,
  Pencil,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  fetchQuestions,
  fetchQuestionById,
  createQuestion,
  fetchQuestionReplies,
  createReply,
  markReplyAsAnswer,
  updateQuestionStatus,
  updateQuestion,
  deleteQuestion,
  updateReply,
  deleteReply,
  type SupportQuestion,
  type SupportReply,
  type SupportAttachment,
  type QuestionCategory,
  type QuestionStatus,
} from '../../services/courseSupport.service';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmationModal from '../ui/ConfirmationModal';
import { useModules } from '../../hooks/useModules';
import api from '../../lib/api';
import { uploadFileWithProgress } from '../../utils/upload.utils';

interface CourseSupportTabProps {
  courseId: string;
  currentLessonId?: string | null;
}

const CATEGORY_OPTIONS: { value: QuestionCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'course_content', label: 'Course Content', icon: <BookOpen size={16} /> },
  { value: 'certificates', label: 'Certificates', icon: <Award size={16} /> },
  { value: 'resources', label: 'Resources', icon: <Settings size={16} /> },
  { value: 'technical', label: 'Technical', icon: <Settings size={16} /> },
  { value: 'other', label: 'Other', icon: <HelpCircle size={16} /> },
];

const STATUS_OPTIONS: { value: QuestionStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Questions' },
  { value: 'open', label: 'Open' },
  { value: 'answered', label: 'Answered' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const CourseSupportTab: React.FC<CourseSupportTabProps> = ({ courseId, currentLessonId }) => {
  const { profile } = useAuth();
  const { success, error: showError } = useToast();
  const [questions, setQuestions] = useState<SupportQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<SupportQuestion | null>(null);
  const [replies, setReplies] = useState<SupportReply[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [showAskModal, setShowAskModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
  const [showEditReplyModal, setShowEditReplyModal] = useState(false);
  const [editingReply, setEditingReply] = useState<SupportReply | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'question' | 'reply'; id: string } | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<QuestionCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<QuestionStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Ask question form
  const [questionCategory, setQuestionCategory] = useState<QuestionCategory>('course_content');
  const [questionTitle, setQuestionTitle] = useState('');
  const [questionBody, setQuestionBody] = useState('');
  const [questionLessonId, setQuestionLessonId] = useState<string | null>(currentLessonId || null);
  const [questionAttachments, setQuestionAttachments] = useState<Array<{
    file: File | null;
    uploading: boolean;
    progress: number;
    error?: string;
    uploaded?: SupportAttachment;
  }>>([]);

  // Reply form
  const [replyBody, setReplyBody] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<Array<{
    file: File | null;
    uploading: boolean;
    progress: number;
    error?: string;
    uploaded?: SupportAttachment;
  }>>([]);

  // Fetch all lessons for the course
  const { modules = [] } = useModules(courseId) || {};
  const [allLessons, setAllLessons] = useState<Array<{ id: string; title: string; module_title: string }>>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);

  useEffect(() => {
    const fetchAllLessons = async () => {
      if (!courseId || !modules || modules.length === 0) return;
      setLoadingLessons(true);
      try {
        const lessonsPromises = modules.map((module: any) =>
          api.get(`/lessons/module/${module.id}?audience=student`)
        );
        const lessonsResults = await Promise.all(lessonsPromises);
        const lessonsFlat: Array<{ id: string; title: string; module_title: string }> = [];
        modules.forEach((module: any, idx: number) => {
          if (lessonsResults[idx]?.success && lessonsResults[idx]?.data) {
            lessonsResults[idx].data.forEach((lesson: any) => {
              lessonsFlat.push({
                id: lesson.id,
                title: lesson.title,
                module_title: module.title,
              });
            });
          }
        });
        setAllLessons(lessonsFlat);
      } catch (err) {
        console.error('Failed to fetch lessons:', err);
      } finally {
        setLoadingLessons(false);
      }
    };
    fetchAllLessons();
  }, [courseId, modules]);

  const isInstructor = useMemo(
    () => ['super_admin', 'school_admin', 'instructor'].includes(profile?.role || ''),
    [profile?.role]
  );

  const loadQuestions = useCallback(async () => {
    if (!courseId) return;

    setLoading(true);
    try {
      const data = await fetchQuestions({
        course_id: courseId,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery.trim() || undefined,
        limit: 50,
      });
      setQuestions(data);
    } catch (err: any) {
      console.error('Failed to load questions:', err);
      showError(err?.message || 'Unable to load questions right now.');
    } finally {
      setLoading(false);
    }
  }, [courseId, categoryFilter, statusFilter, searchQuery, showError]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const loadQuestionDetails = useCallback(async (questionId: string) => {
    setLoadingReplies(true);
    try {
      const [questionData, repliesData] = await Promise.all([
        fetchQuestionById(questionId),
        fetchQuestionReplies(questionId),
      ]);
      setSelectedQuestion(questionData);
      setReplies(repliesData);
    } catch (err: any) {
      console.error('Failed to load question details:', err);
      showError(err?.message || 'Unable to load question details.');
    } finally {
      setLoadingReplies(false);
    }
  }, [showError]);

  const handleFileUpload = async (
    file: File,
    setAttachments: React.Dispatch<React.SetStateAction<Array<{
      file: File;
      uploading: boolean;
      progress: number;
      error?: string;
      uploaded?: SupportAttachment;
    }>>>,
    index: number,
    lessonId?: string | null
  ) => {
    setAttachments((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, uploading: true, progress: 0, error: undefined } : item
      )
    );

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await uploadFileWithProgress(
        file,
        `${API_BASE}/media/upload`,
        'files',
        {
          category: 'document',
          storageCategory: 'course-support',
          courseId,
          lessonId: lessonId || undefined,
        },
        (progress) => {
          setAttachments((prev) =>
            prev.map((item, idx) => (idx === index ? { ...item, progress } : item))
          );
        }
      );

      const uploaded = response?.files?.[0];
      if (!uploaded) {
        throw new Error('Upload failed. No file returned.');
      }

      setAttachments((prev) =>
        prev.map((item, idx) =>
          idx === index
            ? {
                ...item,
                uploading: false,
                progress: 100,
                uploaded: {
                  id: uploaded.id,
                  file_url: uploaded.file_url,
                  filename: uploaded.filename,
                  original_filename: uploaded.original_filename || file.name,
                  file_type: uploaded.file_type || 'document',
                  file_size: uploaded.file_size || file.size,
                  mime_type: uploaded.mime_type || file.type,
                },
              }
            : item
        )
      );
    } catch (err: any) {
      setAttachments((prev) =>
        prev.map((item, idx) =>
          idx === index ? { ...item, uploading: false, error: err?.message || 'Upload failed' } : item
        )
      );
      showError(err?.message || 'File upload failed');
    }
  };

  const handleAskQuestion = async () => {
    if (!questionTitle.trim() || !questionBody.trim()) {
      showError('Please provide both a title and question body.');
      return;
    }

    // Upload any pending files first
    const attachmentsToUpload = questionAttachments.filter((a) => a.file && !a.uploaded);
    if (attachmentsToUpload.length > 0) {
      for (let i = 0; i < attachmentsToUpload.length; i++) {
        const attachment = questionAttachments.find((a) => a.file && !a.uploaded);
        if (attachment && attachment.file) {
          const index = questionAttachments.indexOf(attachment);
          await handleFileUpload(attachment.file, setQuestionAttachments, index, questionLessonId);
        }
      }
    }

    setSubmitting(true);
    try {
      const uploadedAttachments = questionAttachments
        .filter((a) => a.uploaded)
        .map((a) => ({
          file_url: a.uploaded!.file_url,
          filename: a.uploaded!.filename,
          original_filename: a.uploaded!.original_filename,
          file_type: a.uploaded!.file_type,
          file_size: a.uploaded!.file_size,
          mime_type: a.uploaded!.mime_type,
        }));

      await createQuestion({
        course_id: courseId,
        category: questionCategory,
        title: questionTitle.trim(),
        body: questionBody.trim(),
        lesson_id: questionCategory === 'course_content' ? questionLessonId : null,
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      });
      success('Question posted successfully!');
      setShowAskModal(false);
      setQuestionTitle('');
      setQuestionBody('');
      setQuestionCategory('course_content');
      setQuestionLessonId(currentLessonId || null);
      setQuestionAttachments([]);
      await loadQuestions();
    } catch (err: any) {
      showError(err?.message || 'Failed to post question.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!selectedQuestion || !replyBody.trim()) {
      showError('Please provide a reply.');
      return;
    }

    // Upload any pending files first
    const attachmentsToUpload = replyAttachments.filter((a) => a.file && !a.uploaded);
    if (attachmentsToUpload.length > 0) {
      for (let i = 0; i < attachmentsToUpload.length; i++) {
        const attachment = replyAttachments.find((a) => a.file && !a.uploaded);
        if (attachment && attachment.file) {
          const index = replyAttachments.indexOf(attachment);
          await handleFileUpload(attachment.file, setReplyAttachments, index, selectedQuestion?.lessonId || null);
        }
      }
    }

    setSubmitting(true);
    try {
      const uploadedAttachments = replyAttachments
        .filter((a) => a.uploaded)
        .map((a) => ({
          file_url: a.uploaded!.file_url,
          filename: a.uploaded!.filename,
          original_filename: a.uploaded!.original_filename,
          file_type: a.uploaded!.file_type,
          file_size: a.uploaded!.file_size,
          mime_type: a.uploaded!.mime_type,
        }));

      await createReply(selectedQuestion.id, {
        body: replyBody.trim(),
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      });
      success('Reply posted successfully!');
      setReplyBody('');
      setReplyAttachments([]);
      setShowReplyModal(false);
      await loadQuestionDetails(selectedQuestion.id);
      await loadQuestions();
    } catch (err: any) {
      showError(err?.message || 'Failed to post reply.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsAnswer = async (replyId: string) => {
    if (!selectedQuestion) return;

    try {
      await markReplyAsAnswer(replyId, selectedQuestion.id);
      success('Reply marked as answer!');
      await loadQuestionDetails(selectedQuestion.id);
      await loadQuestions();
    } catch (err: any) {
      showError(err?.message || 'Failed to mark reply as answer.');
    }
  };

  const handleUpdateStatus = async (status: QuestionStatus) => {
    if (!selectedQuestion) return;

    try {
      await updateQuestionStatus(selectedQuestion.id, status);
      success('Question status updated!');
      await loadQuestionDetails(selectedQuestion.id);
      await loadQuestions();
    } catch (err: any) {
      showError(err?.message || 'Failed to update question status.');
    }
  };

  const handleEditQuestion = () => {
    if (!selectedQuestion) return;
    setQuestionTitle(selectedQuestion.title);
    setQuestionBody(selectedQuestion.body);
    setQuestionCategory(selectedQuestion.category);
    setQuestionLessonId(selectedQuestion.lessonId || null);
    setQuestionAttachments(
      (selectedQuestion.attachments || []).map((att) => ({
        file: null,
        uploading: false,
        progress: 100,
        uploaded: att,
      }))
    );
    setShowEditQuestionModal(true);
  };

  const handleUpdateQuestion = async () => {
    if (!selectedQuestion || !questionTitle.trim() || !questionBody.trim()) {
      showError('Please provide both a title and question body.');
      return;
    }

    // Upload any pending files first
    const attachmentsToUpload = questionAttachments.filter((a) => a.file && !a.uploaded);
    if (attachmentsToUpload.length > 0) {
      for (let i = 0; i < attachmentsToUpload.length; i++) {
        const attachment = questionAttachments.find((a) => a.file && !a.uploaded);
        if (attachment && attachment.file) {
          const index = questionAttachments.indexOf(attachment);
          await handleFileUpload(attachment.file, setQuestionAttachments, index, questionLessonId);
        }
      }
    }

    setSubmitting(true);
    try {
      const uploadedAttachments = questionAttachments
        .filter((a) => a.uploaded)
        .map((a) => ({
          file_url: a.uploaded!.file_url,
          filename: a.uploaded!.filename,
          original_filename: a.uploaded!.original_filename,
          file_type: a.uploaded!.file_type,
          file_size: a.uploaded!.file_size,
          mime_type: a.uploaded!.mime_type,
        }));

      await updateQuestion(selectedQuestion.id, {
        title: questionTitle.trim(),
        body: questionBody.trim(),
        category: questionCategory,
        lesson_id: questionCategory === 'course_content' ? questionLessonId : null,
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      });
      success('Question updated successfully!');
      setShowEditQuestionModal(false);
      await loadQuestionDetails(selectedQuestion.id);
      await loadQuestions();
    } catch (err: any) {
      showError(err?.message || 'Failed to update question.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!selectedQuestion || !deleteConfirm || deleteConfirm.type !== 'question') return;

    try {
      await deleteQuestion(deleteConfirm.id);
      success('Question deleted successfully!');
      setDeleteConfirm(null);
      setSelectedQuestion(null);
      setReplies([]);
      await loadQuestions();
    } catch (err: any) {
      showError(err?.message || 'Failed to delete question.');
    }
  };

  const handleEditReply = (reply: SupportReply) => {
    setEditingReply(reply);
    setReplyBody(reply.body);
    setReplyAttachments(
      (reply.attachments || []).map((att) => ({
        file: null,
        uploading: false,
        progress: 100,
        uploaded: att,
      }))
    );
    setShowEditReplyModal(true);
  };

  const handleUpdateReply = async () => {
    if (!editingReply || !replyBody.trim()) {
      showError('Please provide a reply.');
      return;
    }

    // Upload any pending files first
    const attachmentsToUpload = replyAttachments.filter((a) => a.file && !a.uploaded);
    if (attachmentsToUpload.length > 0) {
      for (let i = 0; i < attachmentsToUpload.length; i++) {
        const attachment = replyAttachments.find((a) => a.file && !a.uploaded);
        if (attachment && attachment.file) {
          const index = replyAttachments.indexOf(attachment);
          await handleFileUpload(attachment.file, setReplyAttachments, index, selectedQuestion?.lessonId || null);
        }
      }
    }

    setSubmitting(true);
    try {
      const uploadedAttachments = replyAttachments
        .filter((a) => a.uploaded)
        .map((a) => ({
          file_url: a.uploaded!.file_url,
          filename: a.uploaded!.filename,
          original_filename: a.uploaded!.original_filename,
          file_type: a.uploaded!.file_type,
          file_size: a.uploaded!.file_size,
          mime_type: a.uploaded!.mime_type,
        }));

      await updateReply(editingReply.id, {
        body: replyBody.trim(),
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      });
      success('Reply updated successfully!');
      setShowEditReplyModal(false);
      setEditingReply(null);
      setReplyBody('');
      setReplyAttachments([]);
      if (selectedQuestion) {
        await loadQuestionDetails(selectedQuestion.id);
      }
    } catch (err: any) {
      showError(err?.message || 'Failed to update reply.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReply = async () => {
    if (!deleteConfirm || deleteConfirm.type !== 'reply') return;

    try {
      await deleteReply(deleteConfirm.id);
      success('Reply deleted successfully!');
      setDeleteConfirm(null);
      if (selectedQuestion) {
        await loadQuestionDetails(selectedQuestion.id);
      }
    } catch (err: any) {
      showError(err?.message || 'Failed to delete reply.');
    }
  };

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (categoryFilter !== 'all' && q.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && q.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          q.title.toLowerCase().includes(query) || q.body.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [questions, categoryFilter, statusFilter, searchQuery]);

  const getStatusColor = (status: QuestionStatus) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-700';
      case 'answered':
        return 'bg-green-100 text-green-700';
      case 'resolved':
        return 'bg-gray-100 text-gray-700';
      case 'closed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryLabel = (category: QuestionCategory) => {
    return CATEGORY_OPTIONS.find((opt) => opt.value === category)?.label || category;
  };

  const getAuthorName = (author?: { fullName?: string | null; firstName?: string | null; lastName?: string | null; email?: string | null } | null) => {
    if (!author) return 'Unknown';
    return (
      author.fullName ||
      `${author.firstName || ''} ${author.lastName || ''}`.trim() ||
      author.email ||
      'Unknown'
    );
  };

  if (!courseId) {
    return (
      <div className="p-4 sm:p-6">
        <p className="text-gray-600">Course ID is required.</p>
      </div>
    );
  }

  if (selectedQuestion) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <button
          onClick={() => {
            setSelectedQuestion(null);
            setReplies([]);
          }}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <X size={16} />
          Back to Questions
        </button>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(selectedQuestion.status)}`}>
                    {selectedQuestion.status}
                  </span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-primary-50 text-primary-700">
                    {getCategoryLabel(selectedQuestion.category)}
                  </span>
                  {selectedQuestion.isPinned && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-amber-50 text-amber-700">
                      Pinned
                    </span>
                  )}
                </div>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900 flex-1">{selectedQuestion.title}</h2>
                  {selectedQuestion.studentId === profile?.id && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleEditQuestion}
                        className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit question"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'question', id: selectedQuestion.id })}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete question"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <User size={14} />
                    {getAuthorName(selectedQuestion.author)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {formatDistanceToNow(new Date(selectedQuestion.createdAt), { addSuffix: true })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye size={14} />
                    {selectedQuestion.viewCount || 0} views
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle size={14} />
                    {selectedQuestion.replyCount || 0} replies
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {selectedQuestion.lessonId && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-sm font-medium text-blue-900">
                  Related to lesson: {allLessons.find((l) => l.id === selectedQuestion.lessonId)?.title || 'Unknown Lesson'}
                </span>
              </div>
            )}
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap mb-4">
              {selectedQuestion.body}
            </div>
            {selectedQuestion.attachments && selectedQuestion.attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Attachments:</h4>
                {selectedQuestion.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100"
                  >
                    <Paperclip size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-700">{attachment.original_filename}</span>
                    <Download size={14} className="text-gray-400 ml-auto" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {isInstructor && (
            <div className="px-6 pb-4 flex gap-2">
              {selectedQuestion.status !== 'resolved' && (
                <button
                  onClick={() => handleUpdateStatus('resolved')}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Mark as Resolved
                </button>
              )}
              {selectedQuestion.status !== 'closed' && (
                <button
                  onClick={() => handleUpdateStatus('closed')}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Close Question
                </button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Replies ({replies.length})
            </h3>
            <button
              onClick={() => setShowReplyModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
            >
              <Plus size={16} />
              Add Reply
            </button>
          </div>

          {loadingReplies ? (
            <div className="text-center py-8 text-gray-500">Loading replies...</div>
          ) : replies.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
              No replies yet. Be the first to help!
            </div>
          ) : (
            <div className="space-y-4">
              {replies.map((reply) => (
                <div
                  key={reply.id}
                  className={`bg-white rounded-lg border ${
                    reply.isAnswer ? 'border-green-200 bg-green-50' : 'border-gray-200'
                  } shadow-sm`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {reply.isAnswer && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">
                            <CheckCircle size={12} />
                            Accepted Answer
                          </span>
                        )}
                        {reply.isInstructorReply && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-primary-100 text-primary-700">
                            Instructor
                          </span>
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {getAuthorName(reply.author)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {reply.userId === profile?.id && (
                          <>
                            <button
                              onClick={() => handleEditReply(reply)}
                              className="p-1.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                              title="Edit reply"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ type: 'reply', id: reply.id })}
                              className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete reply"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                        {!reply.isAnswer && isInstructor && (
                          <button
                            onClick={() => handleMarkAsAnswer(reply.id)}
                            className="text-xs text-primary-600 hover:text-primary-700"
                          >
                            Mark as Answer
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap mb-2">
                      {reply.body}
                    </div>
                    {reply.attachments && reply.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {reply.attachments.map((attachment) => (
                          <a
                            key={attachment.id}
                            href={attachment.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100"
                          >
                            <Paperclip size={16} className="text-gray-500" />
                            <span className="text-sm text-gray-700">{attachment.original_filename}</span>
                            <Download size={14} className="text-gray-400 ml-auto" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reply Modal */}
        {showReplyModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Add Reply</h3>
                  <button
                    onClick={() => setShowReplyModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Reply
                  </label>
                  <textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    rows={6}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    placeholder="Type your reply here..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attachments (Optional)
                  </label>
                  <div className="space-y-2">
                    {replyAttachments.map((attachment, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded">
                        {attachment.uploaded ? (
                          <>
                            <Paperclip size={16} className="text-gray-500" />
                            <span className="flex-1 text-sm text-gray-700">{attachment.uploaded.original_filename}</span>
                            <button
                              type="button"
                              onClick={() => setReplyAttachments((prev) => prev.filter((_, i) => i !== index))}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        ) : attachment.uploading ? (
                          <>
                            <div className="flex-1">
                              <div className="text-sm text-gray-600 mb-1">
                                Uploading {attachment.file?.name}... {attachment.progress}%
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-primary-600 h-2 rounded-full transition-all"
                                  style={{ width: `${attachment.progress}%` }}
                                />
                              </div>
                            </div>
                          </>
                        ) : attachment.error ? (
                          <>
                            <span className="flex-1 text-sm text-red-600">{attachment.error}</span>
                            <button
                              type="button"
                              onClick={() => setReplyAttachments((prev) => prev.filter((_, i) => i !== index))}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <input
                              type="file"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setReplyAttachments((prev) =>
                                    prev.map((item, i) => (i === index ? { ...item, file } : item))
                                  );
                                  handleFileUpload(file, setReplyAttachments, index, selectedQuestion?.lessonId || null);
                                }
                              }}
                              className="flex-1 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setReplyAttachments((prev) => prev.filter((_, i) => i !== index))}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setReplyAttachments((prev) => [
                          ...prev,
                          { file: null as any, uploading: false, progress: 0 },
                        ])
                      }
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      <Plus size={16} />
                      Add Attachment
                    </button>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowReplyModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReply}
                    disabled={submitting || !replyBody.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Posting...' : 'Post Reply'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Question Modal */}
        {showEditQuestionModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Edit Question</h3>
                  <button
                    onClick={() => setShowEditQuestionModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={questionCategory}
                    onChange={(e) => {
                      setQuestionCategory(e.target.value as QuestionCategory);
                      if (e.target.value !== 'course_content') {
                        setQuestionLessonId(null);
                      }
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                {questionCategory === 'course_content' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Related Lesson (Optional)
                    </label>
                    <select
                      value={questionLessonId || ''}
                      onChange={(e) => setQuestionLessonId(e.target.value || null)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    >
                      <option value="">Select a lesson (optional)</option>
                      {allLessons.map((lesson) => (
                        <option key={lesson.id} value={lesson.id}>
                          {lesson.module_title}: {lesson.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={questionTitle}
                    onChange={(e) => setQuestionTitle(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    placeholder="Enter your question title..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={questionBody}
                    onChange={(e) => setQuestionBody(e.target.value)}
                    rows={6}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    placeholder="Describe your question in detail..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attachments (Optional)
                  </label>
                  <div className="space-y-2">
                    {questionAttachments.map((attachment, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded">
                        {attachment.uploaded ? (
                          <>
                            <Paperclip size={16} className="text-gray-500" />
                            <span className="flex-1 text-sm text-gray-700">{attachment.uploaded.original_filename}</span>
                            <button
                              type="button"
                              onClick={() => setQuestionAttachments((prev) => prev.filter((_, i) => i !== index))}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        ) : attachment.uploading ? (
                          <>
                            <div className="flex-1">
                              <div className="text-sm text-gray-600 mb-1">
                                Uploading {attachment.file?.name}... {attachment.progress}%
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-primary-600 h-2 rounded-full transition-all"
                                  style={{ width: `${attachment.progress}%` }}
                                />
                              </div>
                            </div>
                          </>
                        ) : attachment.error ? (
                          <>
                            <span className="flex-1 text-sm text-red-600">{attachment.error}</span>
                            <button
                              type="button"
                              onClick={() => setQuestionAttachments((prev) => prev.filter((_, i) => i !== index))}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <input
                              type="file"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setQuestionAttachments((prev) =>
                                    prev.map((item, i) => (i === index ? { ...item, file } : item))
                                  );
                                  handleFileUpload(file, setQuestionAttachments, index, questionLessonId);
                                }
                              }}
                              className="flex-1 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setQuestionAttachments((prev) => prev.filter((_, i) => i !== index))}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setQuestionAttachments((prev) => [
                          ...prev,
                          { file: null, uploading: false, progress: 0 },
                        ])
                      }
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      <Plus size={16} />
                      Add Attachment
                    </button>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowEditQuestionModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateQuestion}
                    disabled={submitting || !questionTitle.trim() || !questionBody.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Updating...' : 'Update Question'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Reply Modal */}
        {showEditReplyModal && editingReply && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Edit Reply</h3>
                  <button
                    onClick={() => {
                      setShowEditReplyModal(false);
                      setEditingReply(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Reply
                  </label>
                  <textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    rows={6}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    placeholder="Type your reply here..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attachments (Optional)
                  </label>
                  <div className="space-y-2">
                    {replyAttachments.map((attachment, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded">
                        {attachment.uploaded ? (
                          <>
                            <Paperclip size={16} className="text-gray-500" />
                            <span className="flex-1 text-sm text-gray-700">{attachment.uploaded.original_filename}</span>
                            <button
                              type="button"
                              onClick={() => setReplyAttachments((prev) => prev.filter((_, i) => i !== index))}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        ) : attachment.uploading ? (
                          <>
                            <div className="flex-1">
                              <div className="text-sm text-gray-600 mb-1">
                                Uploading {attachment.file?.name}... {attachment.progress}%
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-primary-600 h-2 rounded-full transition-all"
                                  style={{ width: `${attachment.progress}%` }}
                                />
                              </div>
                            </div>
                          </>
                        ) : attachment.error ? (
                          <>
                            <span className="flex-1 text-sm text-red-600">{attachment.error}</span>
                            <button
                              type="button"
                              onClick={() => setReplyAttachments((prev) => prev.filter((_, i) => i !== index))}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <input
                              type="file"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setReplyAttachments((prev) =>
                                    prev.map((item, i) => (i === index ? { ...item, file } : item))
                                  );
                                  handleFileUpload(file, setReplyAttachments, index, selectedQuestion?.lessonId || null);
                                }
                              }}
                              className="flex-1 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setReplyAttachments((prev) => prev.filter((_, i) => i !== index))}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setReplyAttachments((prev) => [
                          ...prev,
                          { file: null, uploading: false, progress: 0 },
                        ])
                      }
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      <Plus size={16} />
                      Add Attachment
                    </button>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowEditReplyModal(false);
                      setEditingReply(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateReply}
                    disabled={submitting || !replyBody.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Updating...' : 'Update Reply'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <ConfirmationModal
            isOpen={!!deleteConfirm}
            onClose={() => setDeleteConfirm(null)}
            onConfirm={() => {
              if (deleteConfirm.type === 'question') {
                handleDeleteQuestion();
              } else {
                handleDeleteReply();
              }
            }}
            title={deleteConfirm.type === 'question' ? 'Delete Question' : 'Delete Reply'}
            message={
              deleteConfirm.type === 'question'
                ? 'Are you sure you want to delete this question? This action cannot be undone.'
                : 'Are you sure you want to delete this reply? This action cannot be undone.'
            }
            confirmText="Delete"
            confirmButtonClass="bg-red-600 hover:bg-red-700"
          />
        )}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Intro Section */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-6 border border-primary-200">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="text-white" size={24} />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Support</h2>
            <p className="text-gray-700 mb-4">
              Have a question about the course content, certificates, resources, or anything else?
              Ask your instructors and fellow students for help. Our community is here to support
              your learning journey!
            </p>
            <button
              onClick={() => setShowAskModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              <Plus size={18} />
              Ask a Question
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as QuestionCategory | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <option value="all">All Categories</option>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as QuestionStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading questions...</div>
      ) : filteredQuestions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <MessageSquare className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No questions yet</h3>
          <p className="text-gray-600 mb-4">
            Be the first to ask a question and get help from instructors and peers!
          </p>
          <button
            onClick={() => setShowAskModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
          >
            <Plus size={18} />
            Ask a Question
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((question) => (
            <div
              key={question.id}
              onClick={() => loadQuestionDetails(question.id)}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer"
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(question.status)}`}>
                        {question.status}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-primary-50 text-primary-700">
                        {getCategoryLabel(question.category)}
                      </span>
                      {question.isPinned && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-amber-50 text-amber-700">
                          Pinned
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{question.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{question.body}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <User size={12} />
                    {getAuthorName(question.author)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle size={12} />
                    {question.replyCount || 0} replies
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye size={12} />
                    {question.viewCount || 0} views
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ask Question Modal */}
      {showAskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Ask a Question</h3>
                <button
                  onClick={() => setShowAskModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={questionCategory}
                  onChange={(e) => {
                    setQuestionCategory(e.target.value as QuestionCategory);
                    if (e.target.value !== 'course_content') {
                      setQuestionLessonId(null);
                    } else {
                      setQuestionLessonId(currentLessonId || null);
                    }
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              {questionCategory === 'course_content' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Related Lesson (Optional)
                  </label>
                  <select
                    value={questionLessonId || ''}
                    onChange={(e) => setQuestionLessonId(e.target.value || null)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  >
                    <option value="">Select a lesson (optional)</option>
                    {allLessons.map((lesson) => (
                      <option key={lesson.id} value={lesson.id}>
                        {lesson.module_title}: {lesson.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={questionTitle}
                  onChange={(e) => setQuestionTitle(e.target.value)}
                  placeholder="What's your question?"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={questionBody}
                  onChange={(e) => setQuestionBody(e.target.value)}
                  rows={8}
                  placeholder="Provide more details about your question..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attachments (Optional)
                </label>
                <div className="space-y-2">
                  {questionAttachments.map((attachment, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded">
                      {attachment.uploaded ? (
                        <>
                          <Paperclip size={16} className="text-gray-500" />
                          <span className="flex-1 text-sm text-gray-700">{attachment.uploaded.original_filename}</span>
                          <button
                            type="button"
                            onClick={() => setQuestionAttachments((prev) => prev.filter((_, i) => i !== index))}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : attachment.uploading ? (
                        <>
                          <div className="flex-1">
                            <div className="text-sm text-gray-600 mb-1">
                              Uploading {attachment.file?.name}... {attachment.progress}%
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary-600 h-2 rounded-full transition-all"
                                style={{ width: `${attachment.progress}%` }}
                              />
                            </div>
                          </div>
                        </>
                      ) : attachment.error ? (
                        <>
                          <span className="flex-1 text-sm text-red-600">{attachment.error}</span>
                          <button
                            type="button"
                            onClick={() => setQuestionAttachments((prev) => prev.filter((_, i) => i !== index))}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <input
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setQuestionAttachments((prev) =>
                                  prev.map((item, i) => (i === index ? { ...item, file } : item))
                                );
                                handleFileUpload(file, setQuestionAttachments, index, questionLessonId);
                              }
                            }}
                            className="flex-1 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setQuestionAttachments((prev) => prev.filter((_, i) => i !== index))}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setQuestionAttachments((prev) => [
                        ...prev,
                        { file: null as any, uploading: false, progress: 0 },
                      ])
                    }
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    <Plus size={16} />
                    Add Attachment
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAskModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAskQuestion}
                  disabled={submitting || !questionTitle.trim() || !questionBody.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Posting...' : 'Post Question'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseSupportTab;

