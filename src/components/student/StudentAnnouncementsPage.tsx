import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Pin, RefreshCcw, Search, Target } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { fetchAnnouncements, Announcement } from '../../services/announcements.service';
import { useAuth } from '../../contexts/AuthContext';

const getStudentAnnouncementStyles = (announcement: Announcement) => {
  if (announcement.isPinned) {
    return {
      headerBg: 'bg-amber-50',
      headerText: 'text-amber-800',
      border: 'border-amber-200',
      statusBadge: 'bg-amber-100 text-amber-700',
    };
  }

  return {
    headerBg: 'bg-primary-50',
    headerText: 'text-primary-800',
    border: 'border-primary-200',
    statusBadge: 'bg-primary-100 text-primary-700',
  };
};

const StudentAnnouncementsPage: React.FC = () => {
  const { profile } = useAuth();
  const { error: showError } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [includeGlobal, setIncludeGlobal] = useState(true);

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAnnouncements({
        includeGlobal,
        status: 'published',
        includeExpired: false,
        limit: 100,
        search: search.trim() || undefined,
      });
      setAnnouncements(data);
    } catch (err: any) {
      console.error('Failed to load announcements:', err);
      showError(err?.message || 'Unable to load announcements right now.');
    } finally {
      setLoading(false);
    }
  }, [includeGlobal, search, showError]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const sortedAnnouncements = useMemo(() => {
    const items = [...announcements];
    items.sort((a, b) => {
      if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
        return Boolean(b.isPinned) ? 1 : -1;
      }
      const aDate = new Date(a.publishedAt || a.createdAt || 0).getTime();
      const bDate = new Date(b.publishedAt || b.createdAt || 0).getTime();
      return bDate - aDate;
    });
    return items;
  }, [announcements]);

  const formatDate = (value?: string | null) => {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleString();
  };

  const tenantName = profile?.tenant?.name || profile?.tenant_name || null;

  return (
    <div className="space-y-8 pb-16">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
          <Target size={16} />
          Announcements
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Latest Updates & Alerts</h1>
        <p className="max-w-3xl text-sm text-gray-600">
          Stay current with course updates, policy changes, and community news published by your
          instructors and administrators. Pinned announcements remain at the top until you read them.
          {tenantName ? ` You are viewing announcements from ${tenantName}.` : ''}
        </p>
      </header>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
            <Search size={16} className="text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search announcements..."
              className="flex-1 text-sm outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                checked={includeGlobal}
                onChange={(event) => setIncludeGlobal(event.target.checked)}
              />
              Include platform-wide notices
            </label>
            <button
              onClick={loadAnnouncements}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
            >
              <RefreshCcw size={16} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section>
        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-gray-100 bg-white py-20 shadow-sm">
            <div className="flex items-center gap-3 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading announcements...
            </div>
          </div>
        ) : sortedAnnouncements.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center shadow-sm">
            <Pin className="h-8 w-8 text-gray-300" />
            <div className="max-w-md text-sm text-gray-500">
              No announcements available right now. When instructors or admins publish news, you'll
              see it here.
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {sortedAnnouncements.map((announcement) => {
              const metadata = (announcement.metadata || {}) as Record<string, any>;
              const ctaUrl =
                metadata?.ctaUrl || metadata?.cta_url || metadata?.link || undefined;
              const styles = getStudentAnnouncementStyles(announcement);
              const publishedLabel = formatDate(announcement.publishedAt || announcement.createdAt);

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
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-1 font-semibold text-gray-700">
                        {announcement.audienceScope}
                      </span>
                      {announcement.contextType !== 'general' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-1 font-semibold text-gray-700">
                          {announcement.contextType}
                        </span>
                      )}
                      {announcement.author && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-1 font-semibold text-gray-700">
                          Posted by {announcement.author.fullName || 
                            `${announcement.author.firstName || ''} ${announcement.author.lastName || ''}`.trim() || 
                            announcement.author.email || 
                            announcement.authorRole || 
                            'Unknown'}
                        </span>
                      )}
                      <span className="text-gray-500">
                        Published {publishedLabel}
                      </span>
                    </div>
                    <h2 className={`text-lg font-semibold ${styles.headerText}`}>
                      {announcement.title}
                    </h2>
                  </div>

                  <div className="px-4 py-4 sm:px-6 space-y-4">
                    {announcement.summary && (
                      <p className="text-sm text-gray-600">{announcement.summary}</p>
                    )}

                    <div
                      className="prose prose-sm max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{ __html: announcement.bodyHtml }}
                    />

                    {announcement.media && announcement.media.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {announcement.media.map((media) => (
                          <a
                            key={media.id}
                            href={media.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-primary-200 hover:text-primary-700"
                          >
                            <Pin size={12} />
                            {media.title || media.mediaType}
                          </a>
                        ))}
                      </div>
                    )}

                    {ctaUrl && (
                      <a
                        href={ctaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-fit items-center gap-2 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 transition hover:bg-primary-100"
                      >
                        Visit link
                      </a>
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

export default StudentAnnouncementsPage;

