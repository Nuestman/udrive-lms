import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCcw, MessageSquareHeart, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  getPlatformFeedbackSummary,
  listPlatformFeedback,
  PlatformFeedbackEntry,
  PlatformFeedbackSummary,
} from '../../../services/platformFeedback.service';

const metricLabels: Array<{ key: keyof PlatformFeedbackSummary; title: string }> = [
  { key: 'avg_onboarding_score', title: 'Onboarding' },
  { key: 'avg_usability_score', title: 'Ease of Use' },
  { key: 'avg_ui_score', title: 'Interface' },
  { key: 'avg_navigation_score', title: 'Navigation' },
  { key: 'avg_support_score', title: 'Support' },
];

const FeedbackInsightsPage: React.FC = () => {
  const { profile } = useAuth();
  const [summary, setSummary] = useState<PlatformFeedbackSummary | null>(null);
  const [entries, setEntries] = useState<PlatformFeedbackEntry[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      setLoadingSummary(true);
      setLoadingList(true);

      const tenantId = profile?.role === 'super_admin' ? undefined : profile?.tenant_id;

      const [summaryResponse, listResponse] = await Promise.all([
        getPlatformFeedbackSummary(tenantId ? { tenant_id: tenantId } : undefined),
        listPlatformFeedback(tenantId ? { tenant_id: tenantId, limit: 50 } : { limit: 50 }),
      ]);

      setSummary(summaryResponse);
      setEntries(listResponse);
    } catch (err: any) {
      console.error('Failed to load platform feedback:', err);
      setError(err.message || 'Unable to load feedback insights right now.');
    } finally {
      setLoadingSummary(false);
      setLoadingList(false);
    }
  }, [profile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatScore = (value: number | null | undefined) => {
    if (!value) return '—';
    return Number(value).toFixed(2);
  };

  return (
    <div className="space-y-8 pb-16">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
            <MessageSquareHeart className="h-4 w-4" />
            Platform Feedback Insights
          </div>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">Understand sentiment and friction</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Review aggregated feedback across onboarding, usability, interface, navigation, and support. This view surfaces internal signals only.
          </p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>
      </header>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Response Overview</h2>
            <p className="mt-1 text-sm text-gray-600">
              Average score across each dimension (scale 1-5). Higher is better.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700">
            <Users className="h-4 w-4" />
            {loadingSummary
              ? 'Loading responses...'
              : `${summary?.total_responses ?? 0} total responses`}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {metricLabels.map((metric) => (
            <div key={metric.key} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-5">
              <div className="text-sm font-medium text-gray-500">{metric.title}</div>
              <div className="mt-2 flex items-baseline gap-2">
                {loadingSummary ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
                ) : (
                  <>
                    <span className="text-2xl font-semibold text-gray-900">
                      {formatScore(summary?.[metric.key])}
                    </span>
                    <span className="text-xs uppercase tracking-wide text-gray-400">/5</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Recent feedback</h2>
            <p className="text-sm text-gray-600">
              Raw responses for qualitative analysis. Use quick tags to spot recurring themes.
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Submitted
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Scores
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Comments
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loadingList ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
                      Loading responses...
                    </div>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-sm text-gray-500">
                    No feedback responses yet.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="flex flex-wrap gap-2 text-xs">
                        {['onboarding_score', 'usability_score', 'ui_score', 'navigation_score', 'support_score']
                          .filter((key) => entry[key as keyof PlatformFeedbackEntry])
                          .map((key) => (
                            <span
                              key={key}
                              className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 font-semibold text-primary-700"
                            >
                              <TrendingUp className="h-3 w-3" />
                              {key.replace('_score', '').replace('_', ' ')}:{' '}
                              {entry[key as keyof PlatformFeedbackEntry]}
                            </span>
                          ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {entry.role_context || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {entry.comments ? (
                        <p className="whitespace-pre-line">{entry.comments}</p>
                      ) : (
                        <span className="text-gray-400">No additional comments</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default FeedbackInsightsPage;


