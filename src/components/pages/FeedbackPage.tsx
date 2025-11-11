import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  MessageSquareHeart,
  Sparkles,
  ThumbsUp,
} from 'lucide-react';
import {
  PlatformFeedbackPayload,
  submitPlatformFeedback,
} from '../../services/platformFeedback.service';

const LIKERT_SCALE = [
  { value: 1, label: 'Very Poor' },
  { value: 2, label: 'Needs Work' },
  { value: 3, label: 'Average' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Excellent' },
];

const PLATFORM_METRICS: Array<{
  key: keyof PlatformFeedbackPayload;
  title: string;
  description: string;
}> = [
  {
    key: 'onboarding_score',
    title: 'Onboarding Experience',
    description: 'How smooth was it to get started and understand the core flows?',
  },
  {
    key: 'usability_score',
    title: 'Ease of Use',
    description: 'How intuitive is the platform for day-to-day tasks?',
  },
  {
    key: 'ui_score',
    title: 'Interface & Visuals',
    description: 'Rate the clarity of layouts, typography, and information hierarchy.',
  },
  {
    key: 'navigation_score',
    title: 'Navigation & Speed',
    description: 'How quickly can you move between modules and find what you need?',
  },
  {
    key: 'support_score',
    title: 'Support & Helpfulness',
    description: 'How satisfied are you with support resources and response times?',
  },
];

const QUICK_TAGS = [
  'Smooth onboarding',
  'Needs clearer navigation',
  'Love the dashboards',
  'Mobile experience issues',
  'Great instructor tools',
  'Course creation is confusing',
  'Would like more analytics',
  'Support was helpful',
];

const FeedbackPage: React.FC = () => {
  const [scores, setScores] = useState<Record<string, number | null>>(
    PLATFORM_METRICS.reduce(
      (acc, metric) => ({
        ...acc,
        [metric.key]: null,
      }),
      {}
    )
  );
  const [comments, setComments] = useState('');
  const [roleContext, setRoleContext] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    const hasScore = PLATFORM_METRICS.some((metric) => scores[metric.key] !== null);
    return (
      !isSubmitting &&
      (hasScore || comments.trim().length > 0)
    );
  }, [scores, comments, isSubmitting]);

  const handleScoreChange = (metricKey: string, value: number) => {
    setScores((prev) => ({
      ...prev,
      [metricKey]: value,
    }));
  };

  const handleTagClick = (tag: string) => {
    setComments((prev) => {
      if (!prev) return tag;
      if (prev.includes(tag)) return prev;
      return `${prev}\n${tag}`;
    });
  };

  const resetForm = () => {
    setScores(
      PLATFORM_METRICS.reduce(
        (acc, metric) => ({
          ...acc,
          [metric.key]: null,
        }),
        {}
      )
    );
    setComments('');
    setRoleContext('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const payload: PlatformFeedbackPayload = {
        ...scores,
        comments: comments.trim() || undefined,
        role_context: roleContext.trim() || undefined,
        submitted_from: 'web-dashboard',
      };

      await submitPlatformFeedback(payload);
      setStatusMessage('Thanks for the insight! Your feedback helps us shape the roadmap.');
      resetForm();
    } catch (error: any) {
      console.error('Platform feedback submission failed:', error);
      setErrorMessage(error.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-20">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-700">
          <MessageSquareHeart className="h-4 w-4" />
          Platform Feedback
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Help Us Improve UDrive</h1>
        <p className="max-w-2xl text-gray-600">
          Share quick feedback on the parts of the platform you use most. 
          Your responses stay internal and directly inform product decisions. 
          Reviews for courses and schools now happen in-context while learning.
        </p>
      </header>

      {statusMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
          <div className="flex items-start gap-2">
            <CheckCircle className="mt-0.5 h-4 w-4" />
            <span>{statusMessage}</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-10">
        <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <header className="border-b border-gray-100 px-6 py-6">
            <h2 className="text-xl font-semibold text-gray-900">Rate key experience areas</h2>
            <p className="mt-2 text-sm text-gray-600">
              Choose the option that best matches your current experience. Leave blank if unsure.
            </p>
          </header>

          <div className="divide-y divide-gray-100">
            {PLATFORM_METRICS.map((metric) => (
              <div key={metric.key} className="px-6 py-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="max-w-xl">
                    <h3 className="text-base font-medium text-gray-900">{metric.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{metric.description}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {LIKERT_SCALE.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleScoreChange(metric.key, option.value)}
                        className={`inline-flex min-w-[100px] flex-col items-center rounded-lg border px-3 py-2 text-sm transition ${
                          scores[metric.key] === option.value
                            ? 'border-primary-500 bg-primary-50 text-primary-600'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-primary-200 hover:bg-primary-50/60 hover:text-primary-600'
                        }`}
                      >
                        <span className="text-base font-semibold">{option.value}</span>
                        <span className="text-[11px] uppercase tracking-wide">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <header className="border-b border-gray-100 px-6 py-6">
            <h2 className="text-xl font-semibold text-gray-900">Add context or highlights</h2>
            <p className="mt-2 text-sm text-gray-600">
              Optional, but incredibly helpful. Use the quick tags to spark ideas or add your own notes.
            </p>
          </header>

          <div className="space-y-4 px-6 py-6">
            <label className="block text-sm font-medium text-gray-700">
              What best describes your role when using UDrive?
            </label>
            <input
              type="text"
              value={roleContext}
              onChange={(event) => setRoleContext(event.target.value)}
              placeholder="e.g. Instructor, Student, School Admin"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />

            <label className="block text-sm font-medium text-gray-700">
              Tell us what&apos;s working well or what could be smoother
            </label>
            <textarea
              rows={5}
              value={comments}
              onChange={(event) => setComments(event.target.value)}
              placeholder="Share specific moments, workflows, or suggestions..."
              className="w-full rounded-lg border border-gray-300 px-3 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />

            <div>
              <span className="text-sm font-medium text-gray-700">Quick tags</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagClick(tag)}
                    className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600"
                  >
                    <Sparkles className="h-3 w-3" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-6 py-5 text-sm text-gray-600 shadow-sm md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <ThumbsUp className="h-5 w-5 text-primary-500" />
            <p>
              Want to highlight a specific course or school? You&apos;ll be prompted in the learning
              experience once you reach the configured milestone.
            </p>
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending feedback...
              </>
            ) : (
              'Send feedback'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FeedbackPage;


