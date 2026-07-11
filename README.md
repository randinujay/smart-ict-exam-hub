# Smart ICT Exam Hub

A mobile-first examination platform prototype for Sri Lankan O/L ICT students. This first milestone contains a complete browser-based demonstration and a Supabase-ready data model.

## Included in this build

- Landing page with exam-code entry (`ICT26`)
- Student dashboard with progress and weak-lesson cards
- Timed 10-question diagnostic exam
- Automatic local answer saving and session restoration
- Question navigation and flag-for-review workflow
- Submit confirmation and automatic submission at zero time
- Instant marking, grades, lesson breakdown and answer explanations
- Teacher dashboard with exam and class analytics
- Functional objective-question builder with locally saved drafts
- PostgreSQL/Supabase schema, indexes, triggers and Row Level Security policies
- Browser and server Supabase client helpers

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and enter `ICT26`, or visit these routes directly:

- `/student`
- `/exam/ol-ict-diagnostic-01`
- `/teacher`
- `/teacher/exams/new`
- `/results/demo-attempt`

## Connect Supabase

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and add your project values.
3. Run `supabase/schema.sql` in the Supabase SQL editor.
4. Run `supabase/seed.sql`.
5. Replace the mock data in `src/lib/mock-data.ts` with queries/server actions.

The schema deliberately separates `question_keys` from student-readable question data. In production, objective marking should happen in a trusted server action, route handler, Edge Function or security-definer database function. Never send correct answers to the student browser before submission.

## Recommended next milestone

1. Email/phone authentication with teacher and student roles
2. Real class creation and student enrolment
3. Database-backed exam builder and publishing
4. Server-side attempt creation, deadline validation and marking
5. Sinhala-language question support and image uploads
6. Structured-answer manual marking

## Current prototype limitation

The demonstration uses `localStorage`, so it is designed for product testing rather than high-stakes live examinations. The Supabase schema is ready for replacing that local state with authenticated, database-backed attempts.
