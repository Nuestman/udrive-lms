--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: update_enrollments_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_enrollments_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_enrollments_updated_at() OWNER TO postgres;

--
-- Name: update_goals_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_goals_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_goals_updated_at() OWNER TO postgres;

--
-- Name: update_lesson_progress_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_lesson_progress_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_lesson_progress_updated_at() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assignment_submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignment_submissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    assignment_id uuid,
    student_id uuid,
    content text,
    file_urls jsonb,
    status text DEFAULT 'draft'::text,
    score integer,
    feedback text,
    graded_by uuid,
    graded_at timestamp with time zone,
    submitted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT assignment_submissions_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'submitted'::text, 'graded'::text, 'returned'::text])))
);


ALTER TABLE public.assignment_submissions OWNER TO postgres;

--
-- Name: assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    module_id uuid,
    title text NOT NULL,
    description text,
    instructions text,
    due_date timestamp with time zone,
    max_score integer DEFAULT 100,
    submission_types jsonb DEFAULT '["text"]'::jsonb,
    rubric jsonb,
    status text DEFAULT 'published'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT assignments_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])))
);


ALTER TABLE public.assignments OWNER TO postgres;

--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_log (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid,
    user_id uuid,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    changes jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.audit_log OWNER TO postgres;

--
-- Name: certificates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.certificates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid,
    course_id uuid,
    certificate_number text NOT NULL,
    verification_code text NOT NULL,
    issued_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    status text DEFAULT 'active'::text,
    pdf_url text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT certificates_status_check CHECK ((status = ANY (ARRAY['active'::text, 'expired'::text, 'revoked'::text])))
);


ALTER TABLE public.certificates OWNER TO postgres;

--
-- Name: courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.courses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid,
    title text NOT NULL,
    description text,
    thumbnail_url text,
    status text DEFAULT 'draft'::text,
    duration_weeks integer,
    price numeric(10,2) DEFAULT 0,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT courses_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])))
);


ALTER TABLE public.courses OWNER TO postgres;

--
-- Name: enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enrollments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid,
    course_id uuid,
    status text DEFAULT 'active'::text,
    enrolled_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    progress_percentage integer DEFAULT 0,
    last_accessed_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT enrollments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'completed'::text, 'suspended'::text])))
);


ALTER TABLE public.enrollments OWNER TO postgres;

--
-- Name: goals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.goals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid,
    course_id uuid,
    title text NOT NULL,
    description text,
    target_date date,
    status text DEFAULT 'in_progress'::text,
    progress_percentage integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT goals_status_check CHECK ((status = ANY (ARRAY['in_progress'::text, 'completed'::text, 'cancelled'::text])))
);


ALTER TABLE public.goals OWNER TO postgres;

--
-- Name: lesson_progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lesson_progress (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid,
    lesson_id uuid,
    status text DEFAULT 'not_started'::text,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    time_spent_seconds integer DEFAULT 0,
    last_position text,
    updated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT lesson_progress_status_check CHECK ((status = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'completed'::text])))
);


ALTER TABLE public.lesson_progress OWNER TO postgres;

--
-- Name: lessons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lessons (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    module_id uuid,
    title text NOT NULL,
    description text,
    content jsonb DEFAULT '[]'::jsonb,
    order_index integer NOT NULL,
    estimated_duration_minutes integer,
    status text DEFAULT 'draft'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    lesson_type text DEFAULT 'text'::text,
    video_url text,
    document_url text,
    CONSTRAINT lessons_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text])))
);


ALTER TABLE public.lessons OWNER TO postgres;

--
-- Name: media_files; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.media_files (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid,
    uploaded_by uuid,
    filename text NOT NULL,
    original_filename text NOT NULL,
    file_type text NOT NULL,
    file_size integer NOT NULL,
    mime_type text NOT NULL,
    file_url text NOT NULL,
    thumbnail_url text,
    metadata jsonb DEFAULT '{}'::jsonb,
    tags text[],
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.media_files OWNER TO postgres;

--
-- Name: modules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.modules (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    course_id uuid,
    title text NOT NULL,
    description text,
    order_index integer NOT NULL,
    estimated_duration_minutes integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.modules OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    link text,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: quiz_attempts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quiz_attempts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid,
    quiz_id uuid,
    status text DEFAULT 'in_progress'::text,
    score integer,
    started_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    time_spent_seconds integer,
    answers jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT quiz_attempts_status_check CHECK ((status = ANY (ARRAY['in_progress'::text, 'completed'::text, 'abandoned'::text])))
);


ALTER TABLE public.quiz_attempts OWNER TO postgres;

--
-- Name: quiz_questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quiz_questions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    quiz_id uuid,
    question_type text NOT NULL,
    question_text text NOT NULL,
    options jsonb,
    correct_answer jsonb NOT NULL,
    points integer DEFAULT 1,
    explanation text,
    order_index integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT quiz_questions_question_type_check CHECK ((question_type = ANY (ARRAY['multiple_choice'::text, 'true_false'::text, 'short_answer'::text, 'matching'::text, 'ordering'::text])))
);


ALTER TABLE public.quiz_questions OWNER TO postgres;

--
-- Name: quizzes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quizzes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    module_id uuid,
    title text NOT NULL,
    description text,
    passing_score integer DEFAULT 70,
    time_limit_minutes integer,
    max_attempts integer,
    randomize_questions boolean DEFAULT false,
    randomize_answers boolean DEFAULT false,
    show_feedback text DEFAULT 'immediate'::text,
    status text DEFAULT 'draft'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT quizzes_show_feedback_check CHECK ((show_feedback = ANY (ARRAY['immediate'::text, 'after_submission'::text, 'after_completion'::text, 'never'::text]))),
    CONSTRAINT quizzes_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])))
);


ALTER TABLE public.quizzes OWNER TO postgres;

--
-- Name: tenants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenants (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    subdomain text NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb,
    subscription_tier text DEFAULT 'basic'::text,
    subscription_status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    contact_email text,
    contact_phone text,
    address text,
    is_active boolean DEFAULT true
);


ALTER TABLE public.tenants OWNER TO postgres;

--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_profiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid,
    email text NOT NULL,
    password_hash text NOT NULL,
    first_name text,
    last_name text,
    role text NOT NULL,
    avatar_url text,
    phone text,
    settings jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_profiles_role_check CHECK ((role = ANY (ARRAY['super_admin'::text, 'school_admin'::text, 'instructor'::text, 'student'::text])))
);


ALTER TABLE public.user_profiles OWNER TO postgres;

--
-- Name: assignment_submissions assignment_submissions_assignment_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_assignment_id_student_id_key UNIQUE (assignment_id, student_id);


--
-- Name: assignment_submissions assignment_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_pkey PRIMARY KEY (id);


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: certificates certificates_certificate_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_certificate_number_key UNIQUE (certificate_number);


--
-- Name: certificates certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_pkey PRIMARY KEY (id);


--
-- Name: certificates certificates_verification_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_verification_code_key UNIQUE (verification_code);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);


--
-- Name: enrollments enrollments_student_id_course_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_student_id_course_id_key UNIQUE (student_id, course_id);


--
-- Name: goals goals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_pkey PRIMARY KEY (id);


--
-- Name: lesson_progress lesson_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_pkey PRIMARY KEY (id);


--
-- Name: lesson_progress lesson_progress_student_id_lesson_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_student_id_lesson_id_key UNIQUE (student_id, lesson_id);


--
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- Name: media_files media_files_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_files
    ADD CONSTRAINT media_files_pkey PRIMARY KEY (id);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: quiz_attempts quiz_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_pkey PRIMARY KEY (id);


--
-- Name: quiz_questions quiz_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_pkey PRIMARY KEY (id);


--
-- Name: quizzes quizzes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_subdomain_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_subdomain_key UNIQUE (subdomain);


--
-- Name: user_profiles user_profiles_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_email_key UNIQUE (email);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: idx_assignment_submissions_assignment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignment_submissions_assignment_id ON public.assignment_submissions USING btree (assignment_id);


--
-- Name: idx_assignment_submissions_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignment_submissions_student_id ON public.assignment_submissions USING btree (student_id);


--
-- Name: idx_assignments_module_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignments_module_id ON public.assignments USING btree (module_id);


--
-- Name: idx_audit_log_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_log_created_at ON public.audit_log USING btree (created_at);


--
-- Name: idx_audit_log_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_log_tenant_id ON public.audit_log USING btree (tenant_id);


--
-- Name: idx_audit_log_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_log_user_id ON public.audit_log USING btree (user_id);


--
-- Name: idx_certificates_course_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_certificates_course_id ON public.certificates USING btree (course_id);


--
-- Name: idx_certificates_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_certificates_student_id ON public.certificates USING btree (student_id);


--
-- Name: idx_certificates_verification_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_certificates_verification_code ON public.certificates USING btree (verification_code);


--
-- Name: idx_courses_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_courses_created_by ON public.courses USING btree (created_by);


--
-- Name: idx_courses_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_courses_status ON public.courses USING btree (status);


--
-- Name: idx_courses_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_courses_tenant_id ON public.courses USING btree (tenant_id);


--
-- Name: idx_enrollments_course_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollments_course_id ON public.enrollments USING btree (course_id);


--
-- Name: idx_enrollments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollments_status ON public.enrollments USING btree (status);


--
-- Name: idx_enrollments_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollments_student_id ON public.enrollments USING btree (student_id);


--
-- Name: idx_goals_course_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_goals_course_id ON public.goals USING btree (course_id);


--
-- Name: idx_goals_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_goals_student_id ON public.goals USING btree (student_id);


--
-- Name: idx_lesson_progress_lesson_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lesson_progress_lesson_id ON public.lesson_progress USING btree (lesson_id);


--
-- Name: idx_lesson_progress_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lesson_progress_student_id ON public.lesson_progress USING btree (student_id);


--
-- Name: idx_lessons_module_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lessons_module_id ON public.lessons USING btree (module_id);


--
-- Name: idx_lessons_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lessons_order ON public.lessons USING btree (module_id, order_index);


--
-- Name: idx_media_files_file_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_media_files_file_type ON public.media_files USING btree (file_type);


--
-- Name: idx_media_files_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_media_files_tenant_id ON public.media_files USING btree (tenant_id);


--
-- Name: idx_media_files_uploaded_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_media_files_uploaded_by ON public.media_files USING btree (uploaded_by);


--
-- Name: idx_modules_course_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_modules_course_id ON public.modules USING btree (course_id);


--
-- Name: idx_modules_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_modules_order ON public.modules USING btree (course_id, order_index);


--
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (user_id, is_read);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_quiz_attempts_quiz_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quiz_attempts_quiz_id ON public.quiz_attempts USING btree (quiz_id);


--
-- Name: idx_quiz_attempts_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quiz_attempts_student_id ON public.quiz_attempts USING btree (student_id);


--
-- Name: idx_quiz_questions_quiz_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quiz_questions_quiz_id ON public.quiz_questions USING btree (quiz_id);


--
-- Name: idx_quizzes_module_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quizzes_module_id ON public.quizzes USING btree (module_id);


--
-- Name: idx_user_profiles_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_profiles_email ON public.user_profiles USING btree (email);


--
-- Name: idx_user_profiles_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_profiles_role ON public.user_profiles USING btree (role);


--
-- Name: idx_user_profiles_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_profiles_tenant_id ON public.user_profiles USING btree (tenant_id);


--
-- Name: enrollments enrollments_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER enrollments_updated_at_trigger BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.update_enrollments_updated_at();


--
-- Name: goals goals_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER goals_updated_at_trigger BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_goals_updated_at();


--
-- Name: lesson_progress lesson_progress_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER lesson_progress_updated_at_trigger BEFORE UPDATE ON public.lesson_progress FOR EACH ROW EXECUTE FUNCTION public.update_lesson_progress_updated_at();


--
-- Name: assignment_submissions update_assignment_submissions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_assignment_submissions_updated_at BEFORE UPDATE ON public.assignment_submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: assignments update_assignments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: courses update_courses_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: lessons update_lessons_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: modules update_modules_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: quiz_questions update_quiz_questions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_quiz_questions_updated_at BEFORE UPDATE ON public.quiz_questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: quizzes update_quizzes_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tenants update_tenants_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_profiles update_user_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: assignment_submissions assignment_submissions_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE;


--
-- Name: assignment_submissions assignment_submissions_graded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_graded_by_fkey FOREIGN KEY (graded_by) REFERENCES public.user_profiles(id);


--
-- Name: assignment_submissions assignment_submissions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: assignments assignments_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: audit_log audit_log_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: audit_log audit_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id);


--
-- Name: certificates certificates_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: certificates certificates_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: courses courses_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profiles(id);


--
-- Name: courses courses_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: enrollments enrollments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: enrollments enrollments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: goals goals_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: goals goals_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: lesson_progress lesson_progress_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: lesson_progress lesson_progress_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: lessons lessons_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: media_files media_files_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_files
    ADD CONSTRAINT media_files_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: media_files media_files_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_files
    ADD CONSTRAINT media_files_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.user_profiles(id);


--
-- Name: modules modules_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: quiz_attempts quiz_attempts_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;


--
-- Name: quiz_attempts quiz_attempts_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: quiz_questions quiz_questions_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;


--
-- Name: quizzes quizzes_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: user_profiles user_profiles_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

