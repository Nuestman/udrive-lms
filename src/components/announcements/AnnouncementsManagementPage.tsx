import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  Edit,
  Filter,
  Loader2,
  MoreVertical,
  Pin as PinIcon,
  PinOff,
  Plus,
  RefreshCcw,
  Send,
  Target,
  Trash2,
  Undo2,
  Users as UsersIcon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  Announcement,
  AnnouncementPayload,
  archiveAnnouncementRequest,
  createAnnouncement,
  deleteAnnouncementRequest,
  fetchAnnouncements,
  updateAnnouncementRequest,
} from '../../services/announcements.service';
import AnnouncementEditorModal from './AnnouncementEditorModal';
import ConfirmationModal from '../ui/ConfirmationModal';

type ManagementRole = 'super_admin' | 'school_admin' | 'instructor';

interface AnnouncementsManagementPageProps {
  role: ManagementRole;
}

type StatusFilter = 'all' | 'draft' | 'scheduled' | 'published' | 'archived';

const statusFilters: StatusFilter[] = ['all', 'published', 'draft', 'scheduled', 'archived'];

const getAnnouncementCardStyles = (announcement: Announcement) => {
  if (announcement.authorRole === 'super_admin') {
    return {
      headerBg: 'bg-rose-50',
      headerText: 'text-rose-800',
      border: 'border-rose-200',
      statusBadge: 'bg-rose-100 text-rose-700',
    };
  }

  switch (announcement.status) {
    case 'scheduled':
      return {
        headerBg: 'bg-amber-50',
        headerText: 'text-amber-800',
        border: 'border-amber-200',
        statusBadge: 'bg-amber-100 text-amber-700',
      };
    case 'draft':
      return {
        headerBg: 'bg-slate-100',
        headerText: 'text-slate-800',
        border: 'border-slate-200',
        statusBadge: 'bg-slate-200 text-slate-700',
      };
    case 'archived':
      return {
        headerBg: 'bg-gray-100',
        headerText: 'text-gray-600',
        border: 'border-gray-200',
        statusBadge: 'bg-gray-200 text-gray-700',
      };
    case 'published':
    default:
      return {
        headerBg: 'bg-primary-50',
        headerText: 'text-primary-800',
        border: 'border-primary-200',
        statusBadge: 'bg-primary-100 text-primary-700',
      };
  }
};

const AnnouncementsManagementPage: React.FC<AnnouncementsManagementPageProps> = ({ role }) => {
  const { profile } = useAuth();
  const { success, error: showError } = useToast();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [tenantIdFilter, setTenantIdFilter] = useState('');
  const [includeExpired, setIncludeExpired] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuContainerRef = useRef<HTMLDivElement | null>(null);
  const [confirmation, setConfirmation] = useState<{
    type: 'archive' | 'delete';
    announcement: Announcement;
  } | null>(null);
  const [confirming, setConfirming] = useState(false);

  const profileId =
    profile?.id || (profile as any)?.user_id || (profile as any)?.user?.id || null;
  const activeRole = (profile?.active_role || profile?.role || role) as ManagementRole;
  const isSuperAdmin = activeRole === 'super_admin';
  const canCreate = ['super_admin', 'school_admin', 'instructor'].includes(activeRole);
  const canDelete = isSuperAdmin;
  const allowTenantSelection = isSuperAdmin;

  const tenantIdFromProfile = profile?.tenant_id || '';

  const canModifyAnnouncement = useCallback(
    (announcement: Announcement) => {
      if (announcement.authorRole === 'super_admin') {
        return isSuperAdmin;
      }
      if (isSuperAdmin) return true;
      const authorId = announcement.author?.id || announcement.authorId;
      return Boolean(authorId && profileId && authorId === profileId);
    },
    [isSuperAdmin, profileId]
  );

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const requestStatus = statusFilter;
      const data = await fetchAnnouncements({
        status: requestStatus,
        includeExpired,
        includeGlobal: true,
        tenantId: allowTenantSelection && tenantIdFilter.trim() ? tenantIdFilter.trim() : undefined,
        search: searchTerm.trim() || undefined,
        limit: 100,
      });
      setAnnouncements(data);
    } catch (err: any) {
      console.error('Failed to load announcements:', err);
      const message = err?.message || 'Unable to load announcements right now.';
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [allowTenantSelection, includeExpired, statusFilter, tenantIdFilter, searchTerm, showError]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  useEffect(() => {
    if (!menuOpenId) {
      menuContainerRef.current = null;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (!menuOpenId) return;
      const target = event.target as Node;
      if (menuContainerRef.current && !menuContainerRef.current.contains(target)) {
        setMenuOpenId(null);
      }
    };

    if (menuOpenId) {
      document.addEventListener('click', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [menuOpenId]);

  const sortedAnnouncements = useMemo(() => {
    const list = [...announcements];
    list.sort((a, b) => {
      if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
        return Boolean(b.isPinned) ? 1 : -1;
      }
      const aDate = new Date(a.publishedAt || a.createdAt || 0).getTime();
      const bDate = new Date(b.publishedAt || b.createdAt || 0).getTime();
      return bDate - aDate;
    });
    return list;
  }, [announcements]);

  const handleCreateClick = () => {
    if (!canCreate) return;
    setEditorMode('create');
    setSelectedAnnouncement(null);
    setModalOpen(true);
  };

  const requestArchive = (announcement: Announcement) => {
    if (!announcement) return;
    if (!canModifyAnnouncement(announcement)) {
      showError('You can only archive announcements you created.');
      return;
    }
    setConfirmation({ type: 'archive', announcement });
  };

  const requestDelete = (announcement: Announcement) => {
    if (!canDelete) return;
    if (!canModifyAnnouncement(announcement)) {
      showError('You can only delete announcements you created.');
      return;
    }
    setConfirmation({ type: 'delete', announcement });
  };

  const handleQuickUpdate = async (
    announcement: Announcement,
    updates: Partial<AnnouncementPayload>,
    successMessage: string
  ) => {
    try {
      await updateAnnouncementRequest(announcement.id, updates);
      success(successMessage);
      setMenuOpenId(null);
      await loadAnnouncements();
    } catch (err: any) {
      console.error('Announcement quick update failed:', err);
      showError(err?.message || 'Unable to update announcement.');
    }
  };

  const handlePublishNow = (announcement: Announcement) => {
    handleQuickUpdate(
      announcement,
      { status: 'published', publish_now: true },
      'Announcement published.'
    );
  };

  const handleMarkDraft = (announcement: Announcement) => {
    handleQuickUpdate(announcement, { status: 'draft' }, 'Announcement moved to draft.');
  };

  const handleTogglePin = (announcement: Announcement) => {
    handleQuickUpdate(
      announcement,
      { is_pinned: !announcement.isPinned },
      announcement.isPinned ? 'Announcement unpinned.' : 'Announcement pinned.'
    );
  };

  const handleEditClick = (announcement: Announcement) => {
    if (!canModifyAnnouncement(announcement)) return;
    setEditorMode('edit');
    setSelectedAnnouncement(announcement);
    setModalOpen(true);
  };

  const archiveAnnouncementAction = async (announcement: Announcement) => {
    if (!announcement) return;
    if (!canModifyAnnouncement(announcement)) {
      showError('You can only archive announcements you created.');
      return;
    }
    try {
      await archiveAnnouncementRequest(announcement.id);
      success('Announcement archived.');
      setMenuOpenId(null);
      await loadAnnouncements();
    } catch (err: any) {
      console.error('Archive failed:', err);
      showError(err?.message || 'Unable to archive announcement.');
    }
  };

  const deleteAnnouncementAction = async (announcement: Announcement) => {
    if (!canDelete) return;
    if (!canModifyAnnouncement(announcement)) {
      showError('You can only delete announcements you created.');
      return;
    }
    try {
      await deleteAnnouncementRequest(announcement.id);
      success('Announcement deleted.');
      setMenuOpenId(null);
      await loadAnnouncements();
    } catch (err: any) {
      console.error('Delete failed:', err);
      showError(err?.message || 'Unable to delete announcement.');
    }
  };

  const handleSubmit = async (payload: AnnouncementPayload) => {
    setSubmitting(true);
    try {
      if (editorMode === 'create') {
        if (!canCreate) {
          showError('You do not have permission to create announcements.');
          return;
        }
        if (!allowTenantSelection && tenantIdFromProfile) {
          payload.tenant_id = undefined;
        }
        await createAnnouncement(payload);
        success('Announcement created successfully.');
      } else if (selectedAnnouncement) {
        if (!canModifyAnnouncement(selectedAnnouncement)) {
          showError('You can only modify announcements you created.');
          return;
        }
        await updateAnnouncementRequest(selectedAnnouncement.id, payload);
        success('Announcement updated successfully.');
      }
      setModalOpen(false);
      setSelectedAnnouncement(null);
      await loadAnnouncements();
    } catch (err: any) {
      console.error('Announcement submit failed:', err);
      showError(err?.message || 'Unable to save announcement.');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleString();
  };

  return (
    <div className="space-y-8 pb-16">
      <AnnouncementEditorModal
        open={modalOpen}
        mode={editorMode}
        initialAnnouncement={selectedAnnouncement ?? undefined}
        allowTenantId={allowTenantSelection}
        onClose={() => {
          setModalOpen(false);
          setSelectedAnnouncement(null);
        }}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      <ConfirmationModal
        isOpen={Boolean(confirmation)}
        onClose={() => {
          if (!confirming) {
            setConfirmation(null);
          }
        }}
        onConfirm={async () => {
          if (!confirmation || confirming) return;
          setConfirming(true);
          try {
            if (confirmation.type === 'archive') {
              await archiveAnnouncementAction(confirmation.announcement);
            } else {
              await deleteAnnouncementAction(confirmation.announcement);
            }
            setConfirmation(null);
          } finally {
            setConfirming(false);
          }
        }}
        title={
          confirmation?.type === 'delete'
            ? 'Delete announcement'
            : 'Archive announcement'
        }
        message={
          confirmation?.type === 'delete'
            ? 'Are you sure you want to permanently delete this announcement? This action cannot be undone.'
            : 'Archive this announcement? Students will no longer see it, but it will remain available in your records.'
        }
        confirmText={confirmation?.type === 'delete' ? 'Delete' : 'Archive'}
        cancelText="Cancel"
        variant={confirmation?.type === 'delete' ? 'danger' : 'warning'}
        isLoading={confirming}
      />

      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
            <Target size={16} />
            Announcements
          </div>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            Broadcast Updates & Important Messages
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Publish platform-wide notices, tenant announcements, and course-specific updates with
            optional email delivery. Pinned items stay at the top of the feed for students.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadAnnouncements}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
          {canCreate && (
            <button
              onClick={handleCreateClick}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
            >
              <Plus size={16} />
              New Announcement
            </button>
          )}
        </div>
      </header>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-5">
          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
              <Filter size={14} />
              Status
            </span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              {statusFilters.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 lg:col-span-2">
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
              <UsersIcon size={14} />
              Search Title or Summary
            </span>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search announcements..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </label>

          {allowTenantSelection && (
            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
                <Target size={14} />
                Tenant ID Filter
              </span>
              <input
                value={tenantIdFilter}
                onChange={(event) => setTenantIdFilter(event.target.value)}
                placeholder="Optional tenant UUID"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </label>
          )}

          <label className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600">
            <input
              type="checkbox"
              checked={includeExpired}
              onChange={(event) => setIncludeExpired(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Include expired announcements
          </label>
        </div>
      </section>

      <section className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-gray-100 bg-white py-20 shadow-sm">
            <div className="flex items-center gap-3 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading announcements...
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700 shadow-sm">
            {error}
          </div>
        ) : sortedAnnouncements.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center shadow-sm">
            <PinIcon className="h-8 w-8 text-gray-300" />
            <div className="text-sm text-gray-500">
              No announcements match the current filters. Create one to get started.
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sortedAnnouncements.map((item) => {
              const metadata = (item.metadata || {}) as Record<string, any>;
              const ctaLink =
                metadata?.ctaUrl || metadata?.cta_url || metadata?.link || undefined;
              const styles = getAnnouncementCardStyles(item);
              const canModify = canModifyAnnouncement(item);
              const authorLabel =
                item.author?.fullName ||
                [item.author?.firstName, item.author?.lastName].filter(Boolean).join(' ').trim() ||
                item.author?.email ||
                null;
              const publishedLabel = formatDate(item.publishedAt || item.createdAt);
              const scheduledLabel = item.scheduledFor ? formatDate(item.scheduledFor) : null;
              const expiresLabel = item.expiresAt ? formatDate(item.expiresAt) : null;
              const isDraft = item.status === 'draft';
              const isPublished = item.status === 'published';

              return (
                <article
                  key={item.id}
                  className={`bg-white border ${styles.border} rounded-lg shadow-sm transition hover:shadow-md overflow-hidden`}
                >
                  <div
                    className={`flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between px-4 py-3 sm:px-6 ${styles.headerBg}`}
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold ${styles.statusBadge}`}
                        >
                          {item.status}
                        </span>
                        {item.isPinned && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-700">
                            <PinIcon size={12} />
                            Pinned
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-1 font-semibold text-gray-700">
                          {item.audienceScope}
                        </span>
                        {item.authorRole === 'super_admin' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-1 font-semibold text-rose-700">
                            System
                          </span>
                        )}
                        {item.contextType !== 'general' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-1 font-semibold text-gray-700">
                            {item.contextType}
                          </span>
                        )}
                      </div>
                      <h2 className={`text-lg font-semibold ${styles.headerText}`}>
                        {item.title}
                      </h2>
                      {authorLabel && (
                        <p className="text-xs text-gray-500">Posted by {authorLabel}</p>
                      )}
                    </div>

                    {canModify && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setMenuOpenId((current) => (current === item.id ? null : item.id));
                          }}
                          className="rounded-lg border border-white/60 bg-white/80 p-2 text-gray-500 transition hover:border-gray-300 hover:text-gray-700"
                          aria-label="Announcement actions"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {menuOpenId === item.id && (
                          <div
                            ref={(node) => {
                              if (menuOpenId === item.id) {
                                menuContainerRef.current = node;
                              }
                            }}
                            onClick={(event) => event.stopPropagation()}
                            className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-gray-100 bg-white py-2 text-sm shadow-lg"
                          >
                            {!isPublished && (
                              <button
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handlePublishNow(item);
                                }}
                              >
                                <Send size={14} />
                                Publish now
                              </button>
                            )}
                            {!isDraft && (
                              <button
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleMarkDraft(item);
                                }}
                              >
                                <Undo2 size={14} />
                                Move to draft
                              </button>
                            )}
                            <button
                              className="flex w-full items-center gap-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleTogglePin(item);
                              }}
                            >
                              {item.isPinned ? <PinOff size={14} /> : <PinIcon size={14} />}
                              {item.isPinned ? 'Unpin' : 'Pin to top'}
                            </button>
                            <button
                              className="flex w-full items-center gap-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                              onClick={(event) => {
                                event.stopPropagation();
                                setMenuOpenId(null);
                                handleEditClick(item);
                              }}
                            >
                              <Edit size={14} />
                              Edit
                            </button>
                            <button
                              className="flex w-full items-center gap-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                              onClick={(event) => {
                                event.stopPropagation();
                                requestArchive(item);
                              }}
                            >
                              <Archive size={14} />
                              Archive
                            </button>
                            {canDelete && (
                              <button
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-rose-600 hover:bg-rose-50"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  requestDelete(item);
                                }}
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="px-4 py-4 sm:px-6 space-y-4">
                    {item.summary && (
                      <p className="text-sm text-gray-600">{item.summary}</p>
                    )}
                    <div
                      className="prose prose-sm max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{ __html: item.bodyHtml }}
                    />

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span>
                        Published: <strong>{publishedLabel}</strong>
                      </span>
                      {scheduledLabel && (
                        <span>
                          Scheduled: <strong>{scheduledLabel}</strong>
                        </span>
                      )}
                      {expiresLabel && (
                        <span>
                          Expires: <strong>{expiresLabel}</strong>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <UsersIcon size={12} />
                      Target roles: {item.targetRoles.join(', ')}
                    </div>

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

                    {ctaLink && (
                      <a
                        href={ctaLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-fit items-center gap-2 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 transition hover:bg-primary-100"
                      >
                        Visit link
                      </a>
                    )}

                    {item.media && item.media.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {item.media.map((media) => (
                          <a
                            key={media.id}
                            href={media.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-primary-200 hover:text-primary-700"
                          >
                            <PinIcon size={12} />
                            {media.title || media.mediaType}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default AnnouncementsManagementPage;

