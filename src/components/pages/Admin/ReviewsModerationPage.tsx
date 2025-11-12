import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  Loader2,
  MessageSquareMore,
  RefreshCcw,
  Search,
  Star,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  Review,
  ReviewStatus,
  ReviewType,
  ReviewVisibility,
  fetchReviews,
  updateReviewStatus,
  updateReviewVisibility,
  createReviewComment,
} from '../../../services/reviews.service';

type StatusFilter = ReviewStatus | 'all';
type TypeFilter = ReviewType | 'all';
type VisibilityFilter = ReviewVisibility | 'all';

const statusFilters: StatusFilter[] = ['pending', 'approved', 'rejected', 'all'];
const typeFilters: TypeFilter[] = ['platform', 'course', 'school', 'all'];
const visibilityFilters: VisibilityFilter[] = ['private', 'public', 'all'];

const statusStyles: Record<ReviewStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border border-rose-200',
};

const ReviewsModerationPage: React.FC = () => {
  const { profile } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentSubmitting, setCommentSubmitting] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { limit: 100 };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (typeFilter !== 'all') {
        params.type = typeFilter;
      }
      if (visibilityFilter !== 'all') {
        params.visibility = visibilityFilter;
      }
      if (search.trim()) {
        params.search = search.trim();
      }
      const data = await fetchReviews(params);
      const normalized = (data || []).map((review) => ({
        ...review,
        comments: review.comments || [],
      }));
      setReviews(normalized);
    } catch (err: any) {
      console.error('Failed to load reviews:', err);
      setError(err.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter, visibilityFilter]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleModeration = async (reviewId: string, status: ReviewStatus) => {
    setProcessingId(reviewId);
    setError(null);
    try {
      await updateReviewStatus(reviewId, status);
      await loadReviews();
    } catch (err: any) {
      console.error('Failed to update review status:', err);
      setError(err.message || 'Failed to update review status');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCommentDraftChange = (reviewId: string, value: string) => {
    setCommentDrafts((prev) => ({
      ...prev,
      [reviewId]: value,
    }));
  };

  const handleSubmitComment = async (reviewId: string) => {
    const value = commentDrafts[reviewId]?.trim();
    if (!value) return;

    try {
      setCommentSubmitting(reviewId);
      const comment = await createReviewComment(reviewId, value);
      setReviews((prev) =>
        prev.map((item) =>
          item.id === reviewId
            ? {
                ...item,
                comments: [...(item.comments || []), comment],
              }
            : item
        )
      );
      setCommentDrafts((prev) => ({
        ...prev,
        [reviewId]: '',
      }));
    } catch (err: any) {
      console.error('Failed to submit review comment:', err);
      setError(err?.message || 'Failed to submit review comment.');
    } finally {
      setCommentSubmitting(null);
    }
  };

  const filteredReviews = useMemo(() => reviews, [reviews]);

  const handleVisibilityChange = async (reviewId: string, visibility: ReviewVisibility) => {
    setProcessingId(reviewId);
    setError(null);
    try {
      await updateReviewVisibility(reviewId, visibility);
      await loadReviews();
    } catch (err: any) {
      console.error('Failed to update review visibility:', err);
      setError(err.message || 'Failed to update review visibility');
    } finally {
      setProcessingId(null);
    }
  };

  const renderTarget = (review: Review) => {
    switch (review.reviewable_type) {
      case 'platform':
        return (
          <div>
            <div className="font-medium text-gray-900">Platform</div>
            <div className="text-xs text-gray-500">
              Submitted by {review.user?.name || review.user?.email}
            </div>
          </div>
        );
      case 'course':
        return (
          <div>
            <div className="font-medium text-gray-900">
              {review.course?.title || 'Course'}
            </div>
            <div className="text-xs text-gray-500">
              Course ID: {review.reviewable_id?.slice(0, 8)}...
            </div>
          </div>
        );
      case 'school':
        return (
          <div>
            <div className="font-medium text-gray-900">
              {review.school?.name || 'School'}
            </div>
            <div className="text-xs text-gray-500">
              Tenant ID: {review.reviewable_id?.slice(0, 8)}...
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
            <MessageSquareMore className="h-4 w-4" />
            Reviews Moderation
          </div>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">Moderate User Feedback</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Approve or reject reviews submitted by users. Approved platform reviews will surface on
            the public testimonial section to boost credibility.
          </p>
        </div>
        <button
          onClick={loadReviews}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>
      </header>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="grid flex-1 gap-3 md:grid-cols-5">
            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
                <Filter className="h-3.5 w-3.5" />
                Status
              </span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                {statusFilters.map((status) => (
                  <option key={status} value={status}>
                    {status === 'all'
                      ? 'All statuses'
                      : status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
                <Star className="h-3.5 w-3.5" />
                Type
              </span>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                {typeFilters.map((type) => (
                  <option key={type} value={type}>
                    {type === 'all'
                      ? 'All types'
                      : type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </label>

            <label className="md:col-span-2">
              <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                <Search className="h-3.5 w-3.5" />
                Search
              </span>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    loadReviews();
                  }
                }}
                placeholder="Search by user email, title, or body"
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
                <Star className="h-3.5 w-3.5" />
                Visibility
              </span>
              <select
                value={visibilityFilter}
                onChange={(event) => setVisibilityFilter(event.target.value as VisibilityFilter)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                {visibilityFilters.map((visibility) => (
                  <option key={visibility} value={visibility}>
                    {visibility === 'all'
                      ? 'All visibility states'
                      : visibility.charAt(0).toUpperCase() + visibility.slice(1)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            onClick={() => setSearch('')}
            disabled={!search}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:border-gray-300 disabled:cursor-not-allowed disabled:border-gray-100 disabled:text-gray-400"
          >
            Clear Search
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-xl border border-gray-100">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Type & Target
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Submitted By
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Rating
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Feedback
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Visibility
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Submitted
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                      <span>Loading reviews...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500">
                    No reviews match the current filters.
                  </td>
                </tr>
              ) : (
                filteredReviews.map((review) => (
                  <tr key={review.id} className="align-top">
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">
                          {review.reviewable_type.charAt(0).toUpperCase() +
                            review.reviewable_type.slice(1)}
                        </div>
                        {renderTarget(review)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      <div className="font-medium text-gray-900">
                        {review.user?.name || review.user?.email || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {review.user?.email || review.user_id.slice(0, 8)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {review.rating ? `${review.rating} / 5` : '—'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[review.status]}`}>
                        {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      <p className="max-w-xs whitespace-pre-line text-gray-700">
                        {review.body}
                      </p>
                      {review.comments && review.comments.length > 0 && (
                        <div className="mt-4 space-y-3">
                          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Staff Responses
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
                      {review.reviewable_type === 'course' && (
                        <div className="mt-4 space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Add Comment
                          </label>
                          <textarea
                            value={commentDrafts[review.id] || ''}
                            onChange={(event) => handleCommentDraftChange(review.id, event.target.value)}
                            rows={2}
                            placeholder="Reply to this review..."
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                          />
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleSubmitComment(review.id)}
                              disabled={
                                commentSubmitting === review.id ||
                                !(commentDrafts[review.id] && commentDrafts[review.id].trim().length > 0)
                              }
                              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-300"
                            >
                              {commentSubmitting === review.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : null}
                              {commentSubmitting === review.id ? 'Posting...' : 'Post Comment'}
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          review.visibility === 'public'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-gray-50 text-gray-600 border border-gray-200'
                        }`}
                      >
                        {review.visibility.charAt(0).toUpperCase() + review.visibility.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center">
                        <button
                          onClick={() => handleModeration(review.id, 'approved')}
                          disabled={processingId === review.id || review.status === 'approved'}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-200"
                        >
                          {processingId === review.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => handleModeration(review.id, 'rejected')}
                          disabled={processingId === review.id || review.status === 'rejected'}
                          className="inline-flex items-center gap-1 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-200"
                        >
                          {processingId === review.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                          Reject
                        </button>
                    <button
                      onClick={() =>
                        handleVisibilityChange(
                          review.id,
                          review.visibility === 'public' ? 'private' : 'public'
                        )
                      }
                      disabled={processingId === review.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {processingId === review.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        review.visibility === 'public' ? 'Make Private' : 'Make Public'
                      )}
                    </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="mt-6 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
          <p>
            Reviews are immutable audit records. Approving makes them visible on public and in-app
            surfaces. Rejecting keeps them hidden but preserves the submission in case you need to
            follow up with the author.
          </p>
        </footer>
      </section>
    </div>
  );
};

export default ReviewsModerationPage;


