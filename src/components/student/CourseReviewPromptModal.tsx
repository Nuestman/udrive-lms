import React, { useState } from 'react';
import { AlertTriangle, Loader2, Star, X } from 'lucide-react';
import { submitReview } from '../../services/reviews.service';

interface CourseReviewPromptModalProps {
  open: boolean;
  courseId: string;
  courseTitle?: string;
  onSubmitted?: () => void;
  onClose: () => void;
}

const RATING_CHOICES = [1, 2, 3, 4, 5];

const CourseReviewPromptModal: React.FC<CourseReviewPromptModalProps> = ({
  open,
  courseId,
  courseTitle,
  onSubmitted,
  onClose,
}) => {
  const [rating, setRating] = useState<number | null>(5);
  const [headline, setHeadline] = useState('');
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!courseId) {
      setError('Course information is not available yet.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await submitReview({
        type: 'course',
        targetId: courseId,
        rating,
        title: headline.trim() || null,
        body: body.trim(),
      });

      setSuccess('Review submitted! Once approved, it will be visible to other learners.');
      setBody('');
      setHeadline('');
      setRating(5);
      onSubmitted?.();
    } catch (err: any) {
      setError(err.message || 'Unable to submit your review right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-gray-100 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Share your experience</h3>
              <p className="text-sm text-gray-600">
                Tell other learners what it&apos;s like to take{' '}
                <span className="font-medium text-gray-900">{courseTitle || 'this course'}</span>.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-gray-300 hover:text-gray-700"
              aria-label="Close review dialog"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Rating</label>
            <div className="mt-2 flex items-center gap-1">
              {RATING_CHOICES.map((choice) => {
                const isActive = rating !== null && choice <= rating;
                return (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => setRating(choice)}
                    className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                      isActive
                        ? 'bg-primary-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-400 hover:bg-primary-50 hover:text-primary-500'
                    }`}
                    aria-label={`${choice} star${choice > 1 ? 's' : ''}`}
                  >
                    <Star className={`h-4 w-4 ${isActive ? 'fill-current' : ''}`} />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Headline (optional)
            </label>
            <input
              type="text"
              value={headline}
              onChange={(event) => setHeadline(event.target.value)}
              placeholder="What did you appreciate most?"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Your feedback</label>
            <textarea
              required
              minLength={10}
              rows={4}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Talk about the structure, instructors, key takeaways, and who would benefit most."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            >
              Not now
            </button>
            <button
              type="submit"
              disabled={isSubmitting || body.trim().length < 10}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Submit review'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseReviewPromptModal;

