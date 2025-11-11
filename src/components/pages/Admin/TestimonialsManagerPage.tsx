import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MessageSquarePlus,
  RefreshCcw,
  Sparkles,
  XCircle,
} from 'lucide-react';
import {
  createTestimonial,
  deleteTestimonial,
  fetchTestimonials,
  Testimonial,
  updateTestimonial,
} from '../../../services/testimonials.service';

const statusBadgeClasses: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 border border-gray-200',
  published: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  archived: 'bg-rose-50 text-rose-700 border border-rose-200',
};

const TestimonialsManagerPage: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createPayload, setCreatePayload] = useState({
    headline: '',
    body: '',
    attribution_name: '',
    attribution_title: '',
    attribution_organization: '',
    placement: '',
    status: 'draft',
    is_featured: false,
  });
  const [creating, setCreating] = useState(false);

  const loadTestimonials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTestimonials();
      setTestimonials(data);
    } catch (err: any) {
      console.error('Failed to load testimonials:', err);
      setError(err.message || 'Unable to load testimonials right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTestimonials();
  }, [loadTestimonials]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await createTestimonial(createPayload);
      setShowCreateForm(false);
      setCreatePayload({
        headline: '',
        body: '',
        attribution_name: '',
        attribution_title: '',
        attribution_organization: '',
        placement: '',
        status: 'draft',
        is_featured: false,
      });
      await loadTestimonials();
    } catch (err: any) {
      console.error('Failed to create testimonial:', err);
      setError(err.message || 'Unable to create testimonial.');
    } finally {
      setCreating(false);
    }
  };

  const mutateTestimonial = async (id: string, updates: Partial<Testimonial>) => {
    setProcessingId(id);
    setError(null);
    try {
      await updateTestimonial(id, updates);
      await loadTestimonials();
    } catch (err: any) {
      console.error('Failed to update testimonial:', err);
      setError(err.message || 'Unable to update testimonial.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this testimonial? This cannot be undone.')) return;
    setProcessingId(id);
    setError(null);
    try {
      await deleteTestimonial(id);
      await loadTestimonials();
    } catch (err: any) {
      console.error('Failed to delete testimonial:', err);
      setError(err.message || 'Unable to delete testimonial.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
            <MessageSquarePlus className="h-4 w-4" />
            Testimonials Manager
          </div>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">Curate marketing-ready stories</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Elevate your landing pages with vetted success stories. Feature submissions sourced from reviews or craft custom endorsements.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={loadTestimonials}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateForm((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
          >
            <Sparkles className="h-4 w-4" />
            {showCreateForm ? 'Close form' : 'Add testimonial'}
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {showCreateForm && (
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Create manual testimonial</h2>
          <p className="mb-4 text-sm text-gray-600">
            Attach a glowing testimonial even if it didn&apos;t originate from a review. You can link reviews later from the detail view.
          </p>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Headline</label>
              <input
                type="text"
                value={createPayload.headline}
                onChange={(event) =>
                  setCreatePayload((prev) => ({ ...prev, headline: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="e.g. Seamless roll-out across 30 locations"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Story</label>
              <textarea
                required
                rows={4}
                value={createPayload.body}
                onChange={(event) =>
                  setCreatePayload((prev) => ({ ...prev, body: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="Add a concise narrative about outcomes, transformations, or measurable wins."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={createPayload.attribution_name}
                onChange={(event) =>
                  setCreatePayload((prev) => ({ ...prev, attribution_name: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="e.g. Ama Boateng"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={createPayload.attribution_title}
                onChange={(event) =>
                  setCreatePayload((prev) => ({ ...prev, attribution_title: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="e.g. Head of Training"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Organization</label>
              <input
                type="text"
                value={createPayload.attribution_organization}
                onChange={(event) =>
                  setCreatePayload((prev) => ({
                    ...prev,
                    attribution_organization: event.target.value,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="e.g. Uptown School Group"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Placement (optional)</label>
              <input
                type="text"
                value={createPayload.placement}
                onChange={(event) =>
                  setCreatePayload((prev) => ({ ...prev, placement: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="e.g. landing-page, pricing"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={createPayload.status}
                onChange={(event) =>
                  setCreatePayload((prev) => ({ ...prev, status: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="create-is-featured"
                type="checkbox"
                checked={createPayload.is_featured}
                onChange={(event) =>
                  setCreatePayload((prev) => ({ ...prev, is_featured: event.target.checked }))
                }
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="create-is-featured" className="text-sm text-gray-700">
                Mark as featured
              </label>
            </div>

            <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || !createPayload.body.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {creating ? 'Saving...' : 'Create testimonial'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Existing testimonials</h2>
        <p className="text-sm text-gray-600">
          Toggle status to publish or archive. Use feature to prioritize on landing pages.
        </p>

        <div className="mt-4 overflow-hidden rounded-xl border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Headline
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Attribution
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Placement
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
                      Loading testimonials...
                    </div>
                  </td>
                </tr>
              ) : testimonials.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500">
                    No testimonials yet. Publish stories to boost trust.
                  </td>
                </tr>
              ) : (
                testimonials.map((testimonial) => (
                  <tr key={testimonial.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {testimonial.headline || 'Untitled testimonial'}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-600">{testimonial.body}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {testimonial.attribution_name ? (
                        <>
                          <div className="font-medium text-gray-900">{testimonial.attribution_name}</div>
                          <div className="text-xs text-gray-500">
                            {[testimonial.attribution_title, testimonial.attribution_organization]
                              .filter(Boolean)
                              .join(' • ')}
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-400">No attribution yet</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {testimonial.placement || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          statusBadgeClasses[testimonial.status] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {testimonial.status.charAt(0).toUpperCase() + testimonial.status.slice(1)}
                        {testimonial.is_featured && (
                          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-700">
                            Featured
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() =>
                            mutateTestimonial(testimonial.id, {
                              status: testimonial.status === 'published' ? 'archived' : 'published',
                            })
                          }
                          disabled={processingId === testimonial.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {processingId === testimonial.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : testimonial.status === 'published' ? (
                            <>
                              <XCircle className="h-3.5 w-3.5" /> Archive
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" /> Publish
                            </>
                          )}
                        </button>
                        <button
                          onClick={() =>
                            mutateTestimonial(testimonial.id, {
                              is_featured: !testimonial.is_featured,
                            })
                          }
                          disabled={processingId === testimonial.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:border-amber-300 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {testimonial.is_featured ? 'Unfeature' : 'Feature'}
                        </button>
                        <button
                          onClick={() => handleDelete(testimonial.id)}
                          disabled={processingId === testimonial.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
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

export default TestimonialsManagerPage;


