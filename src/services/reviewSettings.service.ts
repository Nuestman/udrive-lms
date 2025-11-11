import { reviewSettingsApi } from '../lib/api';

export type ReviewPromptTriggerType = 'percentage' | 'lesson_count' | 'manual';

export interface CourseReviewSettings {
  course_id: string;
  trigger_type: ReviewPromptTriggerType;
  trigger_value: number | null;
  cooldown_days: number;
  allow_multiple: boolean;
  manual_trigger_enabled: boolean;
  prompt_message: string | null;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export async function getCourseReviewSettings(courseId: string) {
  const response = await reviewSettingsApi.get(courseId);
  return response.data as CourseReviewSettings | null;
}

export async function updateCourseReviewSettings(courseId: string, payload: Partial<CourseReviewSettings>) {
  const response = await reviewSettingsApi.update(courseId, payload);
  return response.data as CourseReviewSettings;
}

export default {
  getCourseReviewSettings,
  updateCourseReviewSettings,
};


