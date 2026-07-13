# Randinu Jayaratne | Smart ICT LMS

A production-oriented tuition website, student learning management system and private teacher administration workspace built with Next.js 16, Supabase and Vercel.

## What is included

### Public tuition website
- Brand-first homepage for **Randinu Jayaratne | Smart ICT**
- Dynamic O/L and future A/L program catalogue
- Teacher background, teaching approach and Smart ICT LMS showcase
- Results/testimonials, FAQ, contact and social links
- Mobile-first red, black and white visual system
- No public teacher/admin link and no exam-code workflow

### Student LMS
- Phone number + password registration and login
- Dashboard access immediately after registration
- Pending students can use free content while paid/exclusive content remains locked
- Dynamic monthly modules containing recordings, resources and assessments
- Free, paid, program, batch and individual access rules
- Online timed/flexible examinations with autosave, flags and automatic objective marking
- Offline/school paper marks in the same results system
- Smart ICT assessment and school-term progress graphs
- Data-derived Smart Insights
- Manual payment history, locked registration details and one-time NIC addition
- Support request workflow

### Private administration
- Hidden entry route: `/adminrandinu`
- Programs, batches, students, modules, recordings and resources
- Account verification/suspension and enrolment assignment
- Monthly payment recording
- Flexible online/offline assessment builder
- Cross-program and batch audiences
- Offline marks CSV import
- Results, structured-answer manual marking, testimonials, homepage/social settings and support requests
- Administrator-only student detail correction and temporary password reset
- Program, batch and individual student assessment audiences

## Stack

- Next.js 16 App Router
- React 19
- Supabase Auth, PostgreSQL, Row Level Security and private Storage
- pnpm 10
- Vercel

## Local demo

The app contains realistic demo data and works without Supabase so the complete interface can be reviewed first.

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

- Student login redirects to the demo LMS when Supabase variables are absent.
- `/adminrandinu` redirects to the demo administration workspace when Supabase variables are absent.

## Supabase setup

1. Create a new Supabase project.
2. Open **SQL Editor** and run `supabase/schema.sql` once.
3. Run `supabase/seed.sql`.
4. In **Authentication → Users**, create the teacher user with:
   - `randinujayaratne15@gmail.com`
   - a strong private password
   - email confirmed
5. Run `supabase/create-admin.sql`.
6. Copy `.env.example` to `.env.local` and add your project values.
7. Add the same variables in Vercel.

Required environment variables:

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAIL=randinujayaratne15@gmail.com
STUDENT_EMAIL_DOMAIN=students.smartict.local
```

The service-role key is server-only. Never expose it with a `NEXT_PUBLIC_` prefix.

## Bank and social settings

The initial values can be supplied through environment variables:

```env
NEXT_PUBLIC_BANK_NAME=
NEXT_PUBLIC_BANK_BRANCH=
NEXT_PUBLIC_BANK_ACCOUNT_NAME=
NEXT_PUBLIC_BANK_ACCOUNT_NUMBER=
NEXT_PUBLIC_WHATSAPP_CHANNEL_URL=
NEXT_PUBLIC_FACEBOOK_URL=
NEXT_PUBLIC_YOUTUBE_URL=
```

They can then be managed from the administration workspace. Payments remain manual: the student transfers funds, sends the receipt through WhatsApp, and the administrator records the month as paid.

## Vercel deployment

This repository is configured for Node.js 22+ and pnpm:

```bash
pnpm install --frozen-lockfile
pnpm build
```

On Vercel:

1. Import the GitHub repository.
2. Set Node.js to **22.x**.
3. Add all production environment variables.
4. Deploy.
5. In Supabase Auth URL configuration, add:
   - Site URL: your production URL
   - Redirect URL: `https://your-domain.vercel.app/auth/callback`

## Access model

Content access is resolved in this order:

1. Administrator access
2. Student-specific access override
3. Explicit program/batch/student audience
4. Free content for registered, non-suspended users
5. Verified account + active enrolment + paid/waived module month

A resource or assessment can belong to one monthly module while also being shared with additional programs or batches without duplication.

## Security notes

- Student profile editing is denied by RLS; only an empty NIC can be added once through a controlled database function.
- Correct answer keys are never returned by the student assessment RPC.
- Paid resource files are stored in a private bucket and delivered through one-minute signed URLs.
- Admin routes require a valid session and an admin role. The hidden URL is convenience, not the security boundary.
- All student, result, payment and content tables have Row Level Security policies.

## Before inviting real students

- Replace bank placeholders and add official social URLs.
- Create the teacher admin and confirm `/adminrandinu` works.
- Create programs/batches and assign test accounts.
- Upload a free and a paid resource to verify access behaviour.
- Create one flexible assessment, one strict assessment and one offline result record.
- Test registration, pending access, verification, payment unlocking and suspension using separate student accounts.
- Add a privacy notice appropriate to your final data-retention practices.

## Implementation handoff

See `CODEX-HANDOFF.md` for repository replacement, database migration cautions and the recommended launch sequence.
