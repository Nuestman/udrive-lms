import { feedbackApi } from '../lib/api';

export interface PlatformFeedbackPayload {
  onboarding_score?: number | null;
  usability_score?: number | null;
  ui_score?: number | null;
  navigation_score?: number | null;
  support_score?: number | null;
  role_context?: string | null;
  comments?: string | null;
  submitted_from?: string | null;
  additional_context?: Record<string, any>;
}

export interface PlatformFeedbackEntry extends PlatformFeedbackPayload {
  id: string;
  user_id: string;
  tenant_id: string | null;
  created_at: string;
}

export interface PlatformFeedbackSummary {
  total_responses: number;
  avg_onboarding_score: number | null;
  avg_usability_score: number | null;
  avg_ui_score: number | null;
  avg_navigation_score: number | null;
  avg_support_score: number | null;
  first_response_at: string | null;
  last_response_at: string | null;
}

export async function submitPlatformFeedback(payload: PlatformFeedbackPayload) {
  const response = await feedbackApi.submitPlatform(payload);
  return response.data as PlatformFeedbackEntry;
}

export async function listPlatformFeedback(params?: {
  tenant_id?: string;
  limit?: number;
  offset?: number;
}) {
  const response = await feedbackApi.listPlatform(params);
  return (response.data as PlatformFeedbackEntry[]) || [];
}

export async function getPlatformFeedbackSummary(params?: { tenant_id?: string }) {
  const response = await feedbackApi.getSummary(params);
  return response.data as PlatformFeedbackSummary;
}

export default {
  submitPlatformFeedback,
  listPlatformFeedback,
  getPlatformFeedbackSummary,
};


