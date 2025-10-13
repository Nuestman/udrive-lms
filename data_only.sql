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
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assignments (id, module_id, title, description, instructions, due_date, max_score, submission_types, rubric, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: assignment_submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assignment_submissions (id, assignment_id, student_id, content, file_urls, status, score, feedback, graded_by, graded_at, submitted_at, created_at, updated_at) FROM stdin;
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
-- Data for Name: lesson_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lesson_progress (id, student_id, lesson_id, status, started_at, completed_at, time_spent_seconds, last_position, updated_at, created_at) FROM stdin;
2616f7e5-46b2-4eb9-b0f2-0e8177b6488b	660e8400-e29b-41d4-a716-446655440004	990e8400-e29b-41d4-a716-446655440001	completed	\N	2025-10-09 16:45:09.16363-07	1800	\N	2025-10-12 08:17:19.575294-07	2025-10-12 08:17:19.575294-07
b92649ba-3c1a-48f0-9898-29029e61e09a	660e8400-e29b-41d4-a716-446655440005	990e8400-e29b-41d4-a716-446655440001	completed	\N	2025-10-08 16:45:09.16363-07	2100	\N	2025-10-12 08:17:19.575294-07	2025-10-12 08:17:19.575294-07
a54c84fd-307c-4596-8274-7ed0c29270a4	660e8400-e29b-41d4-a716-446655440004	990e8400-e29b-41d4-a716-446655440002	completed	\N	2025-10-12 08:42:08.277304-07	1200	\N	2025-10-12 08:42:08.277304-07	2025-10-12 08:17:19.575294-07
cd1e6ebf-cabd-4ce5-a2bb-93a7ffbd406e	660e8400-e29b-41d4-a716-446655440004	990e8400-e29b-41d4-a716-446655440003	not_started	\N	\N	0	\N	2025-10-12 08:51:49.029764-07	2025-10-12 08:17:19.575294-07
\.


--
-- Data for Name: media_files; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.media_files (id, tenant_id, uploaded_by, filename, original_filename, file_type, file_size, mime_type, file_url, thumbnail_url, metadata, tags, created_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, type, title, message, link, is_read, created_at) FROM stdin;
732f9de4-a136-415b-860f-0c4fc5476aaf	660e8400-e29b-41d4-a716-446655440004	assignment	New Assignment Available	A new assignment has been posted in Basic Driving Course	/student/courses/770e8400-e29b-41d4-a716-446655440001	f	2025-10-11 16:45:09.16363-07
574af612-d44d-41a1-aec9-6dad2575e4ec	660e8400-e29b-41d4-a716-446655440004	achievement	Achievement Unlocked!	You have completed your first module!	/student/progress	f	2025-10-11 16:45:09.16363-07
\.


--
-- Data for Name: quizzes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quizzes (id, module_id, title, description, passing_score, time_limit_minutes, max_attempts, randomize_questions, randomize_answers, show_feedback, status, created_at, updated_at) FROM stdin;
aa0e8400-e29b-41d4-a716-446655440001	880e8400-e29b-41d4-a716-446655440001	Getting Started Quiz	Test your knowledge of vehicle controls and basic operations	70	10	\N	f	f	immediate	published	2025-10-11 16:45:09.16363-07	2025-10-11 16:45:09.16363-07
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
-- PostgreSQL database dump complete
--

