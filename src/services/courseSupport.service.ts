import api from '../lib/api';

export type QuestionCategory = 'course_content' | 'certificates' | 'resources' | 'technical' | 'other';
export type QuestionStatus = 'open' | 'answered' | 'resolved' | 'closed';

export interface QuestionAuthor {
  id?: string;
  email?: string;
  role?: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
}

export interface SupportAttachment {
  id: string;
  file_url: string;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  metadata?: Record<string, unknown>;
}

export interface SupportQuestion {
  id: string;
  courseId: string;
  studentId: string;
  lessonId?: string | null;
  category: QuestionCategory;
  title: string;
  body: string;
  status: QuestionStatus;
  isPinned?: boolean;
  viewCount?: number;
  replyCount?: number;
  lastReplyAt?: string | null;
  metadata?: Record<string, unknown>;
  attachments?: SupportAttachment[];
  createdAt: string;
  updatedAt: string;
  author?: QuestionAuthor | null;
}

export interface SupportReply {
  id: string;
  questionId: string;
  userId: string;
  body: string;
  isAnswer?: boolean;
  isInstructorReply?: boolean;
  metadata?: Record<string, unknown>;
  attachments?: SupportAttachment[];
  createdAt: string;
  updatedAt: string;
  author?: QuestionAuthor | null;
}

export interface CreateQuestionPayload {
  course_id: string;
  category: QuestionCategory;
  title: string;
  body: string;
  lesson_id?: string | null;
  metadata?: Record<string, unknown>;
  attachments?: Array<{
    file_url: string;
    filename: string;
    original_filename: string;
    file_type: string;
    file_size: number;
    mime_type: string;
    metadata?: Record<string, unknown>;
  }>;
}

export interface CreateReplyPayload {
  body: string;
  metadata?: Record<string, unknown>;
  attachments?: Array<{
    file_url: string;
    filename: string;
    original_filename: string;
    file_type: string;
    file_size: number;
    mime_type: string;
    metadata?: Record<string, unknown>;
  }>;
}

const buildQuery = (params?: Record<string, string | number | boolean | undefined>) => {
  const query = new URLSearchParams();
  if (!params) return '';
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    query.set(key, String(value));
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
};

export async function fetchQuestions(params?: {
  course_id?: string;
  student_id?: string;
  category?: QuestionCategory;
  status?: QuestionStatus;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<SupportQuestion[]> {
  const queryString = buildQuery({
    course_id: params?.course_id,
    student_id: params?.student_id,
    category: params?.category,
    status: params?.status,
    search: params?.search,
    limit: params?.limit,
    offset: params?.offset,
  });

  const response = await api.get<{ success: boolean; data: SupportQuestion[] }>(
    `/course-support/questions${queryString}`
  );
  // api.get returns the response directly, which is { success, data }
  // So response is already { success, data }
  if (response?.data && Array.isArray(response.data)) {
    return response.data;
  }
  return [];
}

export async function fetchQuestionById(questionId: string): Promise<SupportQuestion> {
  const response = await api.get<{ success: boolean; data: SupportQuestion }>(
    `/course-support/questions/${questionId}`
  );
  if (response?.data && !Array.isArray(response.data)) {
    return response.data;
  }
  throw new Error('Question not found');
}

export async function createQuestion(payload: CreateQuestionPayload): Promise<SupportQuestion> {
  const response = await api.post<{ success: boolean; data: SupportQuestion }>(
    '/course-support/questions',
    payload
  );
  if (response?.data && !Array.isArray(response.data)) {
    return response.data;
  }
  throw new Error('Failed to create question');
}

export async function fetchQuestionReplies(questionId: string): Promise<SupportReply[]> {
  const response = await api.get<{ success: boolean; data: SupportReply[] }>(
    `/course-support/questions/${questionId}/replies`
  );
  if (response?.data && Array.isArray(response.data)) {
    return response.data;
  }
  return [];
}

export async function createReply(
  questionId: string,
  payload: CreateReplyPayload
): Promise<SupportReply> {
  const response = await api.post<{ success: boolean; data: SupportReply }>(
    `/course-support/questions/${questionId}/replies`,
    payload
  );
  if (response?.data && !Array.isArray(response.data)) {
    return response.data;
  }
  throw new Error('Failed to create reply');
}

export async function markReplyAsAnswer(
  replyId: string,
  questionId: string
): Promise<SupportReply> {
  const response = await api.put<{ success: boolean; data: SupportReply }>(
    `/course-support/replies/${replyId}/answer`,
    { question_id: questionId }
  );
  if (response?.data && !Array.isArray(response.data)) {
    return response.data;
  }
  throw new Error('Failed to mark reply as answer');
}

export async function updateQuestionStatus(
  questionId: string,
  status: QuestionStatus
): Promise<SupportQuestion> {
  const response = await api.put<{ success: boolean; data: SupportQuestion }>(
    `/course-support/questions/${questionId}/status`,
    { status }
  );
  if (response?.data && !Array.isArray(response.data)) {
    return response.data;
  }
  throw new Error('Failed to update question status');
}

export interface UpdateQuestionPayload {
  title: string;
  body: string;
  category: QuestionCategory;
  lesson_id?: string | null;
  metadata?: Record<string, unknown>;
  attachments?: Array<{
    file_url: string;
    filename: string;
    original_filename: string;
    file_type: string;
    file_size: number;
    mime_type: string;
    metadata?: Record<string, unknown>;
  }>;
}

export async function updateQuestion(
  questionId: string,
  payload: UpdateQuestionPayload
): Promise<SupportQuestion> {
  const response = await api.put<{ success: boolean; data: SupportQuestion }>(
    `/course-support/questions/${questionId}`,
    payload
  );
  if (response?.data && !Array.isArray(response.data)) {
    return response.data;
  }
  throw new Error('Failed to update question');
}

export async function deleteQuestion(questionId: string): Promise<void> {
  await api.del<{ success: boolean; message: string }>(
    `/course-support/questions/${questionId}`
  );
}

export interface UpdateReplyPayload {
  body: string;
  metadata?: Record<string, unknown>;
  attachments?: Array<{
    file_url: string;
    filename: string;
    original_filename: string;
    file_type: string;
    file_size: number;
    mime_type: string;
    metadata?: Record<string, unknown>;
  }>;
}

export async function updateReply(
  replyId: string,
  payload: UpdateReplyPayload
): Promise<SupportReply> {
  const response = await api.put<{ success: boolean; data: SupportReply }>(
    `/course-support/replies/${replyId}`,
    payload
  );
  if (response?.data && !Array.isArray(response.data)) {
    return response.data;
  }
  throw new Error('Failed to update reply');
}

export async function deleteReply(replyId: string): Promise<void> {
  await api.del<{ success: boolean; message: string }>(
    `/course-support/replies/${replyId}`
  );
}

