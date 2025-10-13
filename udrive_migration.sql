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

ALTER TABLE IF EXISTS ONLY public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quizzes DROP CONSTRAINT IF EXISTS quizzes_module_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quiz_questions DROP CONSTRAINT IF EXISTS quiz_questions_quiz_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quiz_attempts DROP CONSTRAINT IF EXISTS quiz_attempts_student_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quiz_attempts DROP CONSTRAINT IF EXISTS quiz_attempts_quiz_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.modules DROP CONSTRAINT IF EXISTS modules_course_id_fkey;
ALTER TABLE IF EXISTS ONLY public.media_files DROP CONSTRAINT IF EXISTS media_files_uploaded_by_fkey;
ALTER TABLE IF EXISTS ONLY public.media_files DROP CONSTRAINT IF EXISTS media_files_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.lessons DROP CONSTRAINT IF EXISTS lessons_module_id_fkey;
ALTER TABLE IF EXISTS ONLY public.lesson_progress DROP CONSTRAINT IF EXISTS lesson_progress_student_id_fkey;
ALTER TABLE IF EXISTS ONLY public.lesson_progress DROP CONSTRAINT IF EXISTS lesson_progress_lesson_id_fkey;
ALTER TABLE IF EXISTS ONLY public.goals DROP CONSTRAINT IF EXISTS goals_student_id_fkey;
ALTER TABLE IF EXISTS ONLY public.goals DROP CONSTRAINT IF EXISTS goals_course_id_fkey;
ALTER TABLE IF EXISTS ONLY public.enrollments DROP CONSTRAINT IF EXISTS enrollments_student_id_fkey;
ALTER TABLE IF EXISTS ONLY public.enrollments DROP CONSTRAINT IF EXISTS enrollments_course_id_fkey;
ALTER TABLE IF EXISTS ONLY public.courses DROP CONSTRAINT IF EXISTS courses_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.courses DROP CONSTRAINT IF EXISTS courses_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.certificates DROP CONSTRAINT IF EXISTS certificates_student_id_fkey;
ALTER TABLE IF EXISTS ONLY public.certificates DROP CONSTRAINT IF EXISTS certificates_course_id_fkey;
ALTER TABLE IF EXISTS ONLY public.audit_log DROP CONSTRAINT IF EXISTS audit_log_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.audit_log DROP CONSTRAINT IF EXISTS audit_log_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assignments DROP CONSTRAINT IF EXISTS assignments_module_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assignment_submissions DROP CONSTRAINT IF EXISTS assignment_submissions_student_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assignment_submissions DROP CONSTRAINT IF EXISTS assignment_submissions_graded_by_fkey;
ALTER TABLE IF EXISTS ONLY public.assignment_submissions DROP CONSTRAINT IF EXISTS assignment_submissions_assignment_id_fkey;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
DROP TRIGGER IF EXISTS update_quizzes_updated_at ON public.quizzes;
DROP TRIGGER IF EXISTS update_quiz_questions_updated_at ON public.quiz_questions;
DROP TRIGGER IF EXISTS update_modules_updated_at ON public.modules;
DROP TRIGGER IF EXISTS update_lessons_updated_at ON public.lessons;
DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
DROP TRIGGER IF EXISTS update_assignments_updated_at ON public.assignments;
DROP TRIGGER IF EXISTS update_assignment_submissions_updated_at ON public.assignment_submissions;
DROP TRIGGER IF EXISTS lesson_progress_updated_at_trigger ON public.lesson_progress;
DROP TRIGGER IF EXISTS goals_updated_at_trigger ON public.goals;
DROP TRIGGER IF EXISTS enrollments_updated_at_trigger ON public.enrollments;
DROP INDEX IF EXISTS public.idx_user_profiles_tenant_id;
DROP INDEX IF EXISTS public.idx_user_profiles_role;
DROP INDEX IF EXISTS public.idx_user_profiles_email;
DROP INDEX IF EXISTS public.idx_quizzes_module_id;
DROP INDEX IF EXISTS public.idx_quiz_questions_quiz_id;
DROP INDEX IF EXISTS public.idx_quiz_attempts_student_id;
DROP INDEX IF EXISTS public.idx_quiz_attempts_quiz_id;
DROP INDEX IF EXISTS public.idx_notifications_user_id;
DROP INDEX IF EXISTS public.idx_notifications_is_read;
DROP INDEX IF EXISTS public.idx_modules_order;
DROP INDEX IF EXISTS public.idx_modules_course_id;
DROP INDEX IF EXISTS public.idx_media_files_uploaded_by;
DROP INDEX IF EXISTS public.idx_media_files_tenant_id;
DROP INDEX IF EXISTS public.idx_media_files_file_type;
DROP INDEX IF EXISTS public.idx_lessons_order;
DROP INDEX IF EXISTS public.idx_lessons_module_id;
DROP INDEX IF EXISTS public.idx_lesson_progress_student_id;
DROP INDEX IF EXISTS public.idx_lesson_progress_lesson_id;
DROP INDEX IF EXISTS public.idx_goals_student_id;
DROP INDEX IF EXISTS public.idx_goals_course_id;
DROP INDEX IF EXISTS public.idx_enrollments_student_id;
DROP INDEX IF EXISTS public.idx_enrollments_status;
DROP INDEX IF EXISTS public.idx_enrollments_course_id;
DROP INDEX IF EXISTS public.idx_courses_tenant_id;
DROP INDEX IF EXISTS public.idx_courses_status;
DROP INDEX IF EXISTS public.idx_courses_created_by;
DROP INDEX IF EXISTS public.idx_certificates_verification_code;
DROP INDEX IF EXISTS public.idx_certificates_student_id;
DROP INDEX IF EXISTS public.idx_certificates_course_id;
DROP INDEX IF EXISTS public.idx_audit_log_user_id;
DROP INDEX IF EXISTS public.idx_audit_log_tenant_id;
DROP INDEX IF EXISTS public.idx_audit_log_created_at;
DROP INDEX IF EXISTS public.idx_assignments_module_id;
DROP INDEX IF EXISTS public.idx_assignment_submissions_student_id;
DROP INDEX IF EXISTS public.idx_assignment_submissions_assignment_id;
ALTER TABLE IF EXISTS ONLY public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_pkey;
ALTER TABLE IF EXISTS ONLY public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_email_key;
ALTER TABLE IF EXISTS ONLY public.tenants DROP CONSTRAINT IF EXISTS tenants_subdomain_key;
ALTER TABLE IF EXISTS ONLY public.tenants DROP CONSTRAINT IF EXISTS tenants_pkey;
ALTER TABLE IF EXISTS ONLY public.quizzes DROP CONSTRAINT IF EXISTS quizzes_pkey;
ALTER TABLE IF EXISTS ONLY public.quiz_questions DROP CONSTRAINT IF EXISTS quiz_questions_pkey;
ALTER TABLE IF EXISTS ONLY public.quiz_attempts DROP CONSTRAINT IF EXISTS quiz_attempts_pkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.modules DROP CONSTRAINT IF EXISTS modules_pkey;
ALTER TABLE IF EXISTS ONLY public.media_files DROP CONSTRAINT IF EXISTS media_files_pkey;
ALTER TABLE IF EXISTS ONLY public.lessons DROP CONSTRAINT IF EXISTS lessons_pkey;
ALTER TABLE IF EXISTS ONLY public.lesson_progress DROP CONSTRAINT IF EXISTS lesson_progress_student_id_lesson_id_key;
ALTER TABLE IF EXISTS ONLY public.lesson_progress DROP CONSTRAINT IF EXISTS lesson_progress_pkey;
ALTER TABLE IF EXISTS ONLY public.goals DROP CONSTRAINT IF EXISTS goals_pkey;
ALTER TABLE IF EXISTS ONLY public.enrollments DROP CONSTRAINT IF EXISTS enrollments_student_id_course_id_key;
ALTER TABLE IF EXISTS ONLY public.enrollments DROP CONSTRAINT IF EXISTS enrollments_pkey;
ALTER TABLE IF EXISTS ONLY public.courses DROP CONSTRAINT IF EXISTS courses_pkey;
ALTER TABLE IF EXISTS ONLY public.certificates DROP CONSTRAINT IF EXISTS certificates_verification_code_key;
ALTER TABLE IF EXISTS ONLY public.certificates DROP CONSTRAINT IF EXISTS certificates_pkey;
ALTER TABLE IF EXISTS ONLY public.certificates DROP CONSTRAINT IF EXISTS certificates_certificate_number_key;
ALTER TABLE IF EXISTS ONLY public.audit_log DROP CONSTRAINT IF EXISTS audit_log_pkey;
ALTER TABLE IF EXISTS ONLY public.assignments DROP CONSTRAINT IF EXISTS assignments_pkey;
ALTER TABLE IF EXISTS ONLY public.assignment_submissions DROP CONSTRAINT IF EXISTS assignment_submissions_pkey;
ALTER TABLE IF EXISTS ONLY public.assignment_submissions DROP CONSTRAINT IF EXISTS assignment_submissions_assignment_id_student_id_key;
DROP TABLE IF EXISTS public.user_profiles;
DROP TABLE IF EXISTS public.tenants;
DROP TABLE IF EXISTS public.quizzes;
DROP TABLE IF EXISTS public.quiz_questions;
DROP TABLE IF EXISTS public.quiz_attempts;
DROP TABLE IF EXISTS public.notifications;
DROP TABLE IF EXISTS public.modules;
DROP TABLE IF EXISTS public.media_files;
DROP TABLE IF EXISTS public.lessons;
DROP TABLE IF EXISTS public.lesson_progress;
DROP TABLE IF EXISTS public.goals;
DROP TABLE IF EXISTS public.enrollments;
DROP TABLE IF EXISTS public.courses;
DROP TABLE IF EXISTS public.certificates;
DROP TABLE IF EXISTS public.audit_log;
DROP TABLE IF EXISTS public.assignments;
DROP TABLE IF EXISTS public.assignment_submissions;
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.update_lesson_progress_updated_at();
DROP FUNCTION IF EXISTS public.update_goals_updated_at();
DROP FUNCTION IF EXISTS public.update_enrollments_updated_at();
DROP EXTENSION IF EXISTS "uuid-ossp";
DROP EXTENSION IF EXISTS pgcrypto;
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
-- Data for Name: assignment_submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assignment_submissions (id, assignment_id, student_id, content, file_urls, status, score, feedback, graded_by, graded_at, submitted_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assignments (id, module_id, title, description, instructions, due_date, max_score, submission_types, rubric, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_log (id, tenant_id, user_id, action, entity_type, entity_id, changes, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: certificates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.certificates (id, student_id, course_id, certificate_number, verification_code, issued_at, expires_at, status, pdf_url, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.courses (id, tenant_id, title, description, thumbnail_url, status, duration_weeks, price, created_by, created_at, updated_at) FROM stdin;
770e8400-e29b-41d4-a716-446655440001	550e8400-e29b-41d4-a716-446655440000	Basic Driving Course	Learn the fundamentals of safe driving including traffic laws, vehicle operation, and defensive driving techniques.	\N	published	6	499.99	660e8400-e29b-41d4-a716-446655440003	2025-10-11 16:45:09.16363-07	2025-10-11 16:45:09.16363-07
770e8400-e29b-41d4-a716-446655440002	550e8400-e29b-41d4-a716-446655440000	Advanced Defensive Driving	Master advanced driving techniques for handling challenging road conditions and emergency situations.	\N	published	4	699.99	660e8400-e29b-41d4-a716-446655440003	2025-10-11 16:45:09.16363-07	2025-10-11 16:45:09.16363-07
770e8400-e29b-41d4-a716-446655440003	550e8400-e29b-41d4-a716-446655440000	Traffic Laws Review	Comprehensive review of state traffic laws and regulations for license renewal or knowledge refresh.	\N	published	2	199.99	660e8400-e29b-41d4-a716-446655440003	2025-10-11 16:45:09.16363-07	2025-10-11 16:45:09.16363-07
daed5b66-23f9-4563-8d46-5ce6cfda4eee	550e8400-e29b-41d4-a716-446655440000	Test Course	Test description	\N	draft	6	50.00	67e0428c-44fd-4fc8-b195-ffe33c2366bb	2025-10-12 03:32:03.704312-07	2025-10-12 03:32:03.704312-07
6ca25710-4162-4030-978f-06fd49624640	145d918b-65f1-43c3-a812-ac2f5baa1fdc	Uptown Test	Testing uptown	\N	published	12	1000.00	660e8400-e29b-41d4-a716-446655440001	2025-10-12 06:06:18.71451-07	2025-10-12 07:54:30.888388-07
\.


--
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enrollments (id, student_id, course_id, status, enrolled_at, completed_at, progress_percentage, last_accessed_at, updated_at, created_at) FROM stdin;
68203984-1c67-4d31-a900-e3e90705c979	660e8400-e29b-41d4-a716-446655440005	770e8400-e29b-41d4-a716-446655440001	active	2025-10-11 16:45:09.16363-07	\N	45	\N	2025-10-12 08:45:26.949687-07	2025-10-12 08:45:26.949687-07
342e4e9c-697e-4d1f-b38b-64a12a5c47fc	660e8400-e29b-41d4-a716-446655440006	770e8400-e29b-41d4-a716-446655440002	active	2025-10-11 16:45:09.16363-07	\N	30	\N	2025-10-12 08:45:26.949687-07	2025-10-12 08:45:26.949687-07
e6a30b4d-c163-482d-8497-6d7881fc4e94	660e8400-e29b-41d4-a716-446655440004	770e8400-e29b-41d4-a716-446655440001	active	2025-10-11 16:45:09.16363-07	\N	67	\N	2025-10-12 08:51:49.042241-07	2025-10-12 08:45:26.949687-07
\.


--
-- Data for Name: goals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.goals (id, student_id, course_id, title, description, target_date, status, progress_percentage, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: lesson_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lesson_progress (id, student_id, lesson_id, status, started_at, completed_at, time_spent_seconds, last_position, updated_at, created_at) FROM stdin;
2616f7e5-46b2-4eb9-b0f2-0e8177b6488b	660e8400-e29b-41d4-a716-446655440004	990e8400-e29b-41d4-a716-446655440001	completed	\N	2025-10-09 16:45:09.16363-07	1800	\N	2025-10-12 08:17:19.575294-07	2025-10-12 08:17:19.575294-07
b92649ba-3c1a-48f0-9898-29029e61e09a	660e8400-e29b-41d4-a716-446655440005	990e8400-e29b-41d4-a716-446655440001	completed	\N	2025-10-08 16:45:09.16363-07	2100	\N	2025-10-12 08:17:19.575294-07	2025-10-12 08:17:19.575294-07
a54c84fd-307c-4596-8274-7ed0c29270a4	660e8400-e29b-41d4-a716-446655440004	990e8400-e29b-41d4-a716-446655440002	completed	\N	2025-10-12 08:42:08.277304-07	1200	\N	2025-10-12 08:42:08.277304-07	2025-10-12 08:17:19.575294-07
cd1e6ebf-cabd-4ce5-a2bb-93a7ffbd406e	660e8400-e29b-41d4-a716-446655440004	990e8400-e29b-41d4-a716-446655440003	not_started	\N	\N	0	\N	2025-10-12 08:51:49.029764-07	2025-10-12 08:17:19.575294-07
\.


--
-- Data for Name: lessons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lessons (id, module_id, title, description, content, order_index, estimated_duration_minutes, status, created_at, updated_at, lesson_type, video_url, document_url) FROM stdin;
990e8400-e29b-41d4-a716-446655440001	880e8400-e29b-41d4-a716-446655440001	Vehicle Controls	Understanding all vehicle controls and their functions	[{"id": "block-1", "type": "text", "content": {"text": "Welcome to your first lesson on vehicle controls!"}}]	1	30	published	2025-10-11 16:45:09.16363-07	2025-10-11 16:45:09.16363-07	text	\N	\N
990e8400-e29b-41d4-a716-446655440002	880e8400-e29b-41d4-a716-446655440001	Safety Check	Pre-driving safety inspection procedures	[{"id": "block-2", "type": "text", "content": {"text": "Always perform a safety check before driving."}}]	2	20	published	2025-10-11 16:45:09.16363-07	2025-10-11 16:45:09.16363-07	text	\N	\N
990e8400-e29b-41d4-a716-446655440003	880e8400-e29b-41d4-a716-446655440002	Parking Techniques	Master parallel and perpendicular parking	[{"id": "block-3", "type": "text", "content": {"text": "Parking is an essential skill for every driver."}}]	1	45	published	2025-10-11 16:45:09.16363-07	2025-10-11 16:45:09.16363-07	text	\N	\N
ee078762-eef7-40d3-ba61-608b59e7e098	9b54daee-8066-4f41-a7c3-8a24b83cd351	Test lesson	\N	{}	1	\N	draft	2025-10-12 06:21:40.883976-07	2025-10-12 06:21:40.883976-07	text	\N	\N
9c625ac5-d3db-4474-9a01-9e827a923d8f	9b54daee-8066-4f41-a7c3-8a24b83cd351	dsafdafdf	\N	{}	2	\N	draft	2025-10-12 06:22:01.346373-07	2025-10-12 06:22:01.346373-07	text	\N	\N
\.


--
-- Data for Name: media_files; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.media_files (id, tenant_id, uploaded_by, filename, original_filename, file_type, file_size, mime_type, file_url, thumbnail_url, metadata, tags, created_at) FROM stdin;
\.


--
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.modules (id, course_id, title, description, order_index, estimated_duration_minutes, created_at, updated_at) FROM stdin;
880e8400-e29b-41d4-a716-446655440001	770e8400-e29b-41d4-a716-446655440001	Getting Started	Introduction to vehicle controls and basic operations	1	120	2025-10-11 16:45:09.16363-07	2025-10-11 16:45:09.16363-07
880e8400-e29b-41d4-a716-446655440002	770e8400-e29b-41d4-a716-446655440001	Basic Maneuvers	Learn essential driving maneuvers including parking and turns	2	180	2025-10-11 16:45:09.16363-07	2025-10-11 16:45:09.16363-07
880e8400-e29b-41d4-a716-446655440003	770e8400-e29b-41d4-a716-446655440001	Traffic Navigation	Understanding and navigating various traffic situations	3	150	2025-10-11 16:45:09.16363-07	2025-10-11 16:45:09.16363-07
880e8400-e29b-41d4-a716-446655440004	770e8400-e29b-41d4-a716-446655440002	Hazard Recognition	Identifying and responding to potential hazards	1	90	2025-10-11 16:45:09.16363-07	2025-10-11 16:45:09.16363-07
880e8400-e29b-41d4-a716-446655440005	770e8400-e29b-41d4-a716-446655440002	Emergency Procedures	Handling emergency situations safely	2	120	2025-10-11 16:45:09.16363-07	2025-10-11 16:45:09.16363-07
6d9f81eb-6d80-4962-8c14-a588f3062767	daed5b66-23f9-4563-8d46-5ce6cfda4eee	Test Module	\N	1	\N	2025-10-12 04:48:22.986164-07	2025-10-12 04:48:22.986164-07
9b54daee-8066-4f41-a7c3-8a24b83cd351	6ca25710-4162-4030-978f-06fd49624640	Test Module	\N	1	\N	2025-10-12 06:07:11.456048-07	2025-10-12 06:07:11.456048-07
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, type, title, message, link, is_read, created_at) FROM stdin;
732f9de4-a136-415b-860f-0c4fc5476aaf	660e8400-e29b-41d4-a716-446655440004	assignment	New Assignment Available	A new assignment has been posted in Basic Driving Course	/student/courses/770e8400-e29b-41d4-a716-446655440001	f	2025-10-11 16:45:09.16363-07
574af612-d44d-41a1-aec9-6dad2575e4ec	660e8400-e29b-41d4-a716-446655440004	achievement	Achievement Unlocked!	You have completed your first module!	/student/progress	f	2025-10-11 16:45:09.16363-07
\.


--
-- Data for Name: quiz_attempts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quiz_attempts (id, student_id, quiz_id, status, score, started_at, completed_at, time_spent_seconds, answers, created_at) FROM stdin;
\.


--
-- Data for Name: quiz_questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quiz_questions (id, quiz_id, question_type, question_text, options, correct_answer, points, explanation, order_index, created_at, updated_at) FROM stdin;
abc19118-f61b-4934-bde5-e34ae87b9753	aa0e8400-e29b-41d4-a716-446655440001	multiple_choice	What should you do when approaching a yellow traffic light?	["Speed up to get through", "Prepare to stop if it is safe to do so", "Always stop immediately", "Ignore it if no other cars are present"]	"Prepare to stop if it is safe to do so"	10	A yellow light indicates that the signal is about to turn red. You should prepare to stop if you can do so safely.	1	2025-10-11 16:45:09.16363-07	2025-10-11 16:45:09.16363-07
db9334c4-34cb-41b5-b7e9-b8c317dfecd8	aa0e8400-e29b-41d4-a716-446655440001	true_false	In most states, it is legal to turn right on a red light after coming to a complete stop, unless otherwise posted.	null	true	5	Right turns on red are generally permitted after a complete stop, unless a sign prohibits it.	2	2025-10-11 16:45:09.16363-07	2025-10-11 16:45:09.16363-07
ef062889-12d1-4ae4-bbc8-19c0740b2aea	aa0e8400-e29b-41d4-a716-446655440001	multiple_choice	What is the proper following distance in good weather conditions?	["1 second", "2 seconds", "3 seconds", "5 seconds"]	"3 seconds"	10	The three-second rule provides a safe following distance in good weather conditions.	3	2025-10-11 16:45:09.16363-07	2025-10-11 16:45:09.16363-07
\.


--
-- Data for Name: quizzes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quizzes (id, module_id, title, description, passing_score, time_limit_minutes, max_attempts, randomize_questions, randomize_answers, show_feedback, status, created_at, updated_at) FROM stdin;
aa0e8400-e29b-41d4-a716-446655440001	880e8400-e29b-41d4-a716-446655440001	Getting Started Quiz	Test your knowledge of vehicle controls and basic operations	70	10	\N	f	f	immediate	published	2025-10-11 16:45:09.16363-07	2025-10-11 16:45:09.16363-07
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenants (id, name, subdomain, settings, subscription_tier, subscription_status, created_at, updated_at, contact_email, contact_phone, address, is_active) FROM stdin;
550e8400-e29b-41d4-a716-446655440000	Premier Driving Academy	premier	{"theme": "blue", "logo_url": ""}	premium	active	2025-10-11 16:45:09.16363-07	2025-10-11 16:45:09.16363-07	\N	\N	\N	t
36b2ae0d-c53c-47d7-9e80-71c933a1cc2a	Downtown Driving Academy	downtown-academy	{}	basic	active	2025-10-12 05:51:25.715475-07	2025-10-12 05:51:25.715475-07	info@downtown-academy.com	\N	\N	t
145d918b-65f1-43c3-a812-ac2f5baa1fdc	Uptown Driving School	uptown	{}	premium	active	2025-10-12 05:53:27.06998-07	2025-10-12 06:00:38.238526-07	uptown@udrivelms.com	0546979534	Somewhere, Uptown.	t
\.


--
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_profiles (id, tenant_id, email, password_hash, first_name, last_name, role, avatar_url, phone, settings, is_active, last_login, created_at, updated_at) FROM stdin;
660e8400-e29b-41d4-a716-446655440003	550e8400-e29b-41d4-a716-446655440000	instructor@premier.com	$2b$10$I3E5zmQo9hAzGbyffKMm0OzpDBLZHb73E6G.hf9Lndna81cdeNgYm	John	Smith	instructor	\N	+1234567890	{}	t	2025-10-12 08:03:13.69457-07	2025-10-11 16:45:09.16363-07	2025-10-12 08:03:13.69457-07
660e8400-e29b-41d4-a716-446655440004	550e8400-e29b-41d4-a716-446655440000	student1@example.com	$2b$10$I3E5zmQo9hAzGbyffKMm0OzpDBLZHb73E6G.hf9Lndna81cdeNgYm	Michael	Chen	student	\N	\N	{}	t	2025-10-12 08:06:19.327666-07	2025-10-11 16:45:09.16363-07	2025-10-12 08:06:19.327666-07
660e8400-e29b-41d4-a716-446655440002	550e8400-e29b-41d4-a716-446655440000	schooladmin@premier.com	$2b$10$I3E5zmQo9hAzGbyffKMm0OzpDBLZHb73E6G.hf9Lndna81cdeNgYm	Sarah	Johnson	school_admin	\N	\N	{}	t	\N	2025-10-11 16:45:09.16363-07	2025-10-12 08:03:12.753423-07
660e8400-e29b-41d4-a716-446655440005	550e8400-e29b-41d4-a716-446655440000	student2@example.com	$2b$10$I3E5zmQo9hAzGbyffKMm0OzpDBLZHb73E6G.hf9Lndna81cdeNgYm	Emily	Rodriguez	student	\N	\N	{}	t	\N	2025-10-11 16:45:09.16363-07	2025-10-12 08:03:12.753423-07
660e8400-e29b-41d4-a716-446655440006	550e8400-e29b-41d4-a716-446655440000	student3@example.com	$2b$10$I3E5zmQo9hAzGbyffKMm0OzpDBLZHb73E6G.hf9Lndna81cdeNgYm	David	Kim	student	\N	\N	{}	t	\N	2025-10-11 16:45:09.16363-07	2025-10-12 08:03:12.753423-07
d2f92a00-f0dd-4bf1-bdcf-080cd84c4783	550e8400-e29b-41d4-a716-446655440000	studentuser@udrive.com	$2b$10$I3E5zmQo9hAzGbyffKMm0OzpDBLZHb73E6G.hf9Lndna81cdeNgYm	Student	User	student	\N	0206484034	{}	t	\N	2025-10-12 04:36:51.827227-07	2025-10-12 08:03:12.753423-07
ac5b9b0c-23b0-46dc-9a64-1aa2c24611a3	145d918b-65f1-43c3-a812-ac2f5baa1fdc	test@test.com	$2b$10$I3E5zmQo9hAzGbyffKMm0OzpDBLZHb73E6G.hf9Lndna81cdeNgYm	Test	Student	student	\N	65453216546	{}	t	\N	2025-10-12 07:12:23.438246-07	2025-10-12 08:03:12.753423-07
67e0428c-44fd-4fc8-b195-ffe33c2366bb	\N	admin@udrivelms.com	$2b$10$I3E5zmQo9hAzGbyffKMm0OzpDBLZHb73E6G.hf9Lndna81cdeNgYm	Numan	Usman	super_admin	\N	0206484034	{}	t	2025-10-12 07:27:03.338689-07	2025-10-12 01:28:13.092253-07	2025-10-12 08:03:12.753423-07
660e8400-e29b-41d4-a716-446655440001	145d918b-65f1-43c3-a812-ac2f5baa1fdc	admin@uptown.udrive.com	$2b$10$I3E5zmQo9hAzGbyffKMm0OzpDBLZHb73E6G.hf9Lndna81cdeNgYm	Admin	User	school_admin	\N	\N	{}	t	2025-10-12 07:53:53.152182-07	2025-10-11 16:45:09.16363-07	2025-10-12 08:03:12.753423-07
\.


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

