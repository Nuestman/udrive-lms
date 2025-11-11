import { reviewsApi } from '../lib/api';

export type ReviewType = 'platform' | 'course' | 'school';
export type ReviewSubmissionType = 'course' | 'school';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type ReviewVisibility = 'private' | 'public';

export interface ReviewUserSummary {
  id: string;
  email: string;
  name?: string | null;
  role?: string | null;
}

export interface ReviewCourseSummary {
  id: string;
  title?: string | null;
  tenant_id?: string | null;
}

export interface ReviewSchoolSummary {
  id: string;
  name?: string | null;
  subdomain?: string | null;
}

export interface Review {
  id: string;
  user_id: string;
  reviewable_type: ReviewType;
  reviewable_id: string | null;
  rating: number | null;
  title: string | null;
  body: string;
  status: ReviewStatus;
  visibility: ReviewVisibility;
  approved_at: string | null;
  approved_by: string | null;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  user?: ReviewUserSummary;
  course?: ReviewCourseSummary;
  school?: ReviewSchoolSummary;
}

export interface SubmitReviewPayload {
  type: ReviewSubmissionType;
  targetId?: string;
  rating?: number | null;
  title?: string | null;
  body: string;
}

export interface ReviewQueryParams {
  status?: ReviewStatus;
  type?: ReviewType;
  user_id?: string;
  reviewable_id?: string;
  search?: string;
  visibility?: ReviewVisibility;
  limit?: number;
  offset?: number;
}

export async function submitReview(payload: SubmitReviewPayload): Promise<Review> {
  const response = await reviewsApi.submit(payload);
  return response.data as Review;
}

export async function fetchMyReviews(): Promise<Review[]> {
  const response = await reviewsApi.mine();
  return (response.data as Review[]) || [];
}

export async function fetchReviews(params?: ReviewQueryParams): Promise<Review[]> {
  const response = await reviewsApi.list(params);
  return (response.data as Review[]) || [];
}

export async function updateReviewStatus(
  id: string,
  status: ReviewStatus
): Promise<Review> {
  const response = await reviewsApi.updateStatus(id, status);
  return response.data as Review;
}

export async function updateReviewVisibility(
  id: string,
  visibility: ReviewVisibility
): Promise<Review> {
  const response = await reviewsApi.updateVisibility(id, visibility);
  return response.data as Review;
}

export async function fetchPublicReviews(params?: {
  type?: ReviewType;
  limit?: number;
  reviewable_id?: string;
}): Promise<Review[]> {
  const response = await reviewsApi.getPublic(params);
  return (response.data as Review[]) || [];
}

export default {
  submitReview,
  fetchMyReviews,
  fetchReviews,
  updateReviewStatus,
  updateReviewVisibility,
  fetchPublicReviews,
};


