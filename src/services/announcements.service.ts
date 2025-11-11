import api from '../lib/api';

export type AnnouncementAudienceScope =
  | 'global'
  | 'tenant'
  | 'course'
  | 'module'
  | 'lesson'
  | 'quiz';

export type AnnouncementContextType =
  | 'general'
  | 'course'
  | 'module'
  | 'lesson'
  | 'quiz';

export interface AnnouncementMedia {
  id: string;
  mediaType: 'image' | 'video' | 'audio' | 'document' | 'embed';
  url: string;
  thumbnailUrl?: string | null;
  title?: string | null;
  description?: string | null;
  altText?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export interface AnnouncementAuthor {
  id?: string;
  email?: string;
  role?: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
}

export interface Announcement {
  id: string;
  tenantId?: string | null;
  authorId?: string | null;
  authorRole: string;
  audienceScope: AnnouncementAudienceScope;
  title: string;
  summary?: string | null;
  bodyHtml: string;
  bodyJson?: unknown;
  contextType: AnnouncementContextType;
  courseId?: string | null;
  moduleId?: string | null;
  lessonId?: string | null;
  quizId?: string | null;
  targetRoles: string[];
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  publishedAt?: string | null;
  scheduledFor?: string | null;
  expiresAt?: string | null;
  emailSentAt?: string | null;
  isPinned?: boolean;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  media: AnnouncementMedia[];
  author?: AnnouncementAuthor | null;
  isRead?: boolean;
  readAt?: string | null;
}

export interface AnnouncementPayload {
  tenant_id?: string | null;
  title: string;
  summary?: string | null;
  body_html: string;
  body_json?: unknown;
  context_type?: AnnouncementContextType;
  audience_scope: AnnouncementAudienceScope;
  target_roles: string[];
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  publish_now?: boolean;
  scheduled_for?: string | null;
  expires_at?: string | null;
  is_pinned?: boolean;
  course_id?: string | null;
  module_id?: string | null;
  lesson_id?: string | null;
  quiz_id?: string | null;
  metadata?: Record<string, unknown>;
  media?: Array<{
    id?: string;
    mediaType: AnnouncementMedia['mediaType'];
    url: string;
    thumbnailUrl?: string | null;
    title?: string | null;
    description?: string | null;
    altText?: string | null;
    mimeType?: string | null;
    fileSize?: number | null;
    metadata?: Record<string, unknown>;
  }>;
  send_email?: boolean;
}

interface AnnouncementListResponse {
  success: boolean;
  data: Announcement[];
}

interface AnnouncementResponse {
  success: boolean;
  data: Announcement;
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

export async function fetchAnnouncements(params?: {
  courseId?: string;
  moduleId?: string;
  lessonId?: string;
  quizId?: string;
  includeGlobal?: boolean;
  limit?: number;
  status?: 'draft' | 'scheduled' | 'published' | 'archived' | 'all';
  includeExpired?: boolean;
  tenantId?: string;
  search?: string;
}) {
  const queryString = buildQuery({
    course_id: params?.courseId,
    module_id: params?.moduleId,
    lesson_id: params?.lessonId,
    quiz_id: params?.quizId,
    include_global: params?.includeGlobal,
    limit: params?.limit,
    status: params?.status,
    include_expired: params?.includeExpired,
    tenant_id: params?.tenantId,
    search: params?.search,
  });

  const response = await api.get<AnnouncementListResponse | Announcement[]>(
    `/announcements${queryString}`
  );

  if (Array.isArray(response)) {
    return response;
  }

  if (response && typeof response === 'object' && 'data' in response) {
    const payload = (response as AnnouncementListResponse).data;
    return Array.isArray(payload) ? payload : [];
  }

  return [];
}

export async function markAnnouncementAsRead(announcementId: string) {
  const response = await api.post<AnnouncementResponse | Announcement>(
    `/announcements/${announcementId}/read`
  );

  if (response && typeof response === 'object' && 'data' in response) {
    return (response as AnnouncementResponse).data;
  }

  return response as Announcement;
}

export async function createAnnouncement(payload: AnnouncementPayload) {
  const response = await api.post<AnnouncementResponse | Announcement>(
    '/announcements',
    payload
  );

  if (response && typeof response === 'object' && 'data' in response) {
    return (response as AnnouncementResponse).data;
  }

  return response as Announcement;
}

export async function updateAnnouncementRequest(id: string, payload: Partial<AnnouncementPayload>) {
  const response = await api.put<AnnouncementResponse | Announcement>(
    `/announcements/${id}`,
    payload
  );

  if (response && typeof response === 'object' && 'data' in response) {
    return (response as AnnouncementResponse).data;
  }

  return response as Announcement;
}

export async function archiveAnnouncementRequest(id: string) {
  const response = await api.put<AnnouncementResponse | Announcement>(
    `/announcements/${id}/archive`,
    {}
  );

  if (response && typeof response === 'object' && 'data' in response) {
    return (response as AnnouncementResponse).data;
  }

  return response as Announcement;
}

export async function deleteAnnouncementRequest(id: string) {
  const response = await api.del<{ success: boolean; data: { id: string } }>(`/announcements/${id}`);

  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { success: boolean; data: { id: string } }).data;
  }

  return response as unknown;
}

export default {
  fetchAnnouncements,
  markAnnouncementAsRead,
  createAnnouncement,
  updateAnnouncementRequest,
  archiveAnnouncementRequest,
  deleteAnnouncementRequest,
};


