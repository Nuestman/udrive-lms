// Database Type Definitions

export interface Course {
  id: string;
  tenant_id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  status: 'draft' | 'published' | 'archived';
  duration_weeks?: number;
  price?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Computed fields from JOINs:
  instructor_name?: string;
  instructor_email?: string;
  module_count?: number;
  student_count?: number;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  estimated_duration_minutes?: number;
  created_at: string;
  updated_at: string;
  // Computed:
  lesson_count?: number;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  content: any; // JSONB - block editor content
  order_index: number;
  duration_minutes?: number;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  status: 'pending' | 'active' | 'completed' | 'suspended';
  enrolled_at: string;
  completed_at?: string;
  progress_percentage: number;
  last_accessed_at?: string;
}

export interface LessonProgress {
  id: string;
  student_id: string;
  lesson_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  started_at?: string;
  completed_at?: string;
  time_spent_seconds: number;
  last_position?: string;
}

export interface Quiz {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  passing_score: number;
  time_limit_minutes?: number;
  max_attempts?: number;
  randomize_questions: boolean;
  randomize_answers: boolean;
  show_feedback: 'immediate' | 'after_submission' | 'after_completion' | 'never';
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'matching' | 'ordering';
  question_text: string;
  options?: any; // JSONB
  correct_answer: any; // JSONB
  points: number;
  explanation?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface QuizAttempt {
  id: string;
  student_id: string;
  quiz_id: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  score?: number;
  started_at: string;
  completed_at?: string;
  time_spent_seconds?: number;
  answers: any; // JSONB
  created_at: string;
}

export interface Certificate {
  id: string;
  student_id: string;
  course_id: string;
  certificate_number: string;
  verification_code: string;
  issued_at: string;
  expires_at?: string;
  status: 'active' | 'expired' | 'revoked';
  pdf_url?: string;
  metadata: any; // JSONB
  created_at: string;
}

export interface Assignment {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  instructions?: string;
  due_date?: string;
  max_score: number;
  submission_types: any; // JSONB array
  rubric?: any; // JSONB
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  content?: string;
  file_urls?: any; // JSONB array
  status: 'draft' | 'submitted' | 'graded' | 'returned';
  score?: number;
  feedback?: string;
  graded_by?: string;
  graded_at?: string;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MediaFile {
  id: string;
  tenant_id: string;
  uploaded_by: string;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  file_url: string;
  thumbnail_url?: string;
  metadata: any; // JSONB
  tags?: string[];
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

// User - Authentication & Authorization
export interface User {
  id: string;
  tenant_id: string;
  email: string;
  role: 'super_admin' | 'school_admin' | 'instructor' | 'student';
  settings?: any; // JSONB - system settings
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

// UserProfile - Personal & Profile Data
export interface UserProfile {
  id: string;
  user_id: string;
  
  // Basic Profile Information
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  phone?: string;
  bio?: string;
  date_of_birth?: string;
  
  // Address Information
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  
  // Emergency Contact Information
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  emergency_contact_email?: string;
  
  // Guardian Information (for minor students)
  guardian_name?: string;
  guardian_email?: string;
  guardian_phone?: string;
  guardian_relationship?: string;
  guardian_address?: string;
  
  // Additional Profile Data
  nationality?: string;
  preferred_language?: string;
  timezone?: string;
  
  // User-editable preferences
  profile_preferences?: any; // JSONB
  
  // Social/Professional Links
  linkedin_url?: string;
  twitter_url?: string;
  website_url?: string;
  
  created_at: string;
  updated_at: string;
}

// Combined view for convenience (when joining both tables)
export interface UserWithProfile extends User {
  profile?: UserProfile;
  // Denormalized for convenience:
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  phone?: string;
}

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  settings: any; // JSONB
  subscription_tier: string;
  subscription_status: string;
  created_at: string;
  updated_at: string;
}

