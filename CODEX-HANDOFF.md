# Codex handoff — Smart ICT LMS

This package is a full rebuild of the original exam-hub MVP into a tuition website, student LMS and private administration system.

## Recommended integration approach

1. Create a new Git branch from the current production repository.
2. Copy the complete contents of this package into the repository root.
3. Preserve any production environment values; do not commit `.env.local`.
4. Run `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint` and `pnpm build`.
5. Review the visual result in desktop and mobile widths.
6. Apply the Supabase schema to a fresh project, or create a reviewed migration against the existing production database.
7. Test all access states using separate admin, pending, verified-unpaid, paid and suspended accounts.

## Database warning

`supabase/schema.sql` is a clean production schema intended for a **new Supabase project**. Do not paste it blindly over an existing database that already contains similarly named tables or enum types. Back up the current project first and either:

- migrate to a new Supabase project, or
- generate a deliberate migration after comparing the existing schema with this file.

The starter content is in `supabase/seed.sql`. Teacher-role promotion is in `supabase/create-admin.sql`.

## Environment variables

Use `.env.example` as the source of truth. The service-role key must stay server-side. The public application supports either a Supabase publishable key or the older anon key.

## Important workflows to test

### Registration and access
- A student registers using a Sri Lankan mobile number and password.
- A hidden email alias is generated internally for Supabase Auth.
- The new account enters the LMS immediately as `pending`.
- Global free content is accessible.
- Paid content stays locked until the admin verifies, enrols and records the relevant month as paid or waived.
- Suspended accounts cannot open protected content.

### Monthly access
- Programs and batches are dynamic.
- Monthly modules contain recordings, resources and assessments.
- Payment is scoped by student, program, optional batch and month.
- Cross-program, cross-batch and individual assessment audiences are supported without duplication.

### Assessments
- Flexible online assessments require a duration.
- Strict online assessments require fixed opening and closing times.
- Objective questions are marked automatically.
- Structured answers are queued for manual marking.
- Offline and school marks can be imported by CSV and updated safely on re-import.

### Student data
- Students cannot edit their registration fields.
- An initially empty NIC can be added exactly once.
- Verified corrections and password resets are handled from the private admin workspace.

## Existing production routes

The public teacher login must not be linked anywhere. Its only entry route is:

`/adminrandinu`

Security still depends on Supabase authentication, the admin role, server checks and RLS—not on the route being obscure.

## Suggested launch sequence

1. Deploy to a Vercel preview project.
2. Connect a non-production Supabase project.
3. Complete the full smoke test in `DEPLOYMENT.md`.
4. Import or recreate real students only after the access tests pass.
5. Point the production domain to the verified deployment.
