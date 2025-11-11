import { testimonialsApi } from '../lib/api';

export type TestimonialStatus = 'draft' | 'published' | 'archived';

export interface Testimonial {
  id: string;
  review_id: string | null;
  feedback_id: string | null;
  headline: string | null;
  body: string | null;
  attribution_name: string | null;
  attribution_title: string | null;
  attribution_organization: string | null;
  placement: string | null;
  display_order: number;
  status: TestimonialStatus;
  is_featured: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export async function fetchPublicTestimonials(params?: {
  placement?: string;
  limit?: number;
  featured?: boolean;
}) {
  const response = await testimonialsApi.listPublic(params);
  return (response.data as Testimonial[]) || [];
}

export async function fetchTestimonials(params?: {
  status?: TestimonialStatus;
  placement?: string;
}) {
  const response = await testimonialsApi.list(params);
  return (response.data as Testimonial[]) || [];
}

export async function createTestimonial(payload: Partial<Testimonial>) {
  const response = await testimonialsApi.create(payload);
  return response.data as Testimonial;
}

export async function updateTestimonial(id: string, payload: Partial<Testimonial>) {
  const response = await testimonialsApi.update(id, payload);
  return response.data as Testimonial;
}

export async function deleteTestimonial(id: string) {
  const response = await testimonialsApi.remove(id);
  return response;
}

export default {
  fetchPublicTestimonials,
  fetchTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
};


