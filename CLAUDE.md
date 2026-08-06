# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Smart ICT LMS — a Next.js 16 (App Router) + Supabase application for a Sri Lankan
ICT tuition class: a public marketing site, a student learning-management portal,
and a hidden teacher admin workspace. Deployed on Vercel as **smart-ict-vercel-final**
(live at `smart-ict-lms.vercel.app`).

**This project deploys straight from `vercel deploy` / the Vercel dashboard — it is
not connected to Git.** The `main` branch of `randinujay/smart-ict-exam-hub` on
GitHub is kept as a manually-pushed rollback snapshot, not a source of truth. Before
trusting any local checkout, verify it actually matches the live deployment (pull the
current production deployment's files via `vercel link` + `vercel api
/v13/deployments/<id>/files` and `/v7/deployments/<id>/files/<fileUid>` if in doubt —
there is no `vercel pull`-equivalent for deployment source, only project
settings/env vars). Local drift has happened before and cost a full audit cycle.

## Commands

```bash
pnpm install --frozen-lockfile   # this repo pins pnpm 10.34.5 as packageManager
pnpm dev                         # Next dev server (Turbopack), http://localhost:3000
pnpm build                       # production build
pnpm start                       # run a production build
pnpm lint                        # eslint .
pnpm typecheck                   # tsc --noEmit, no separate test runner in this repo
```

There is no test suite. Node engine is pinned to `22.x` (`package.json#engines`).

The app runs fully **without Supabase configured**: `isDemoMode()` (`src/lib/env.ts`)
is true whenever `NEXT_PUBLIC_SUPABASE_URL`/key env vars are absent outside of
production, and every data-fetching function in `src/lib/data.ts` falls back to the
fixtures in `src/lib/demo-data.ts`. Use this for UI work when Supabase isn't set up;
don't rely on it to validate real auth/RLS/session behavior.

## Architecture

**Three Supabase client entry points, one shape.** `src/lib/supabase/client.ts`
(browser) and `src/lib/supabase/server.ts` (Server Components/Actions, cookie-backed)
both read `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (falling back to
`NEXT_PUBLIC_SUPABASE_ANON_KEY` for older Supabase projects). There is **no
service-role client in the Next.js app** — that privileged surface lives entirely in
the Supabase Edge Function at `supabase/functions/user-admin/index.ts`, called via
`src/lib/server/user-admin.ts::callUserAdminFunction`. If you find yourself wanting
the service-role key inside a Next.js route/action, that's a sign the operation
belongs in that Edge Function instead, not a new admin client in the app.

**`src/proxy.ts` is this project's middleware** (Next 16 renamed the convention;
`vercel.json`/Next wires it up the same as `middleware.ts` would). It currently only
runs on `/app/:path*` and `/adminrandinu/:path*` — it does *not* run on `/`, `/login`,
or `/register`, even though those pages still construct a Supabase server client to
read public data. Session refresh/cookie-persistence for those routes therefore
depends on whatever calls `createClient()` in the Server Component, which cannot
reliably persist refreshed cookies (see the comment in `supabase/server.ts`). Keep
this in mind before assuming "the middleware already handles session refresh
everywhere" — currently it doesn't.

**Business logic lives in Postgres, exposed via RPC**, not in the Next.js server
layer. `supabase/schema.sql` defines ~40 `SECURITY DEFINER`-style functions
(`get_student_dashboard`, `get_admin_workspace`, `can_access_module`,
`start_assessment_attempt`, `save_assessment_answers`, `import_offline_results`,
etc.) that `src/lib/data.ts` and `src/app/actions/*.ts` call via `.rpc(...)`. Access
control (free/paid, program/batch/student audience, verified/suspended status) is
computed **in SQL**, mirrored client-side only for UI gating in `src/lib/access.ts`
(`hasPaidModuleAccess`, `canOpenAssessment`) — never trust the client-side copy for
security, it exists to avoid flashing locked content, not to enforce access.

**Class model**: `academic_batches` (an exam-year cohort, e.g. "2026 O/L") →
`batches` (a specific program's class within that cohort, unique on
`(program_id, name)` and on `(id, program_id)` so composite FKs can point at both) →
`enrollments`/`modules`/`payments` reference `(batch_id, program_id)` with `on delete
restrict`. Content (`modules`, `recordings`, `resources`, `assessments`) can also be
shared across additional programs/batches/individual students via the generic
`content_audiences` join table (cascading delete, unlike the restrict above) — check
both the direct FK and `content_audiences` when reasoning about what's blocking a
delete or who can see a piece of content.

**Students authenticate by phone, not email.** Supabase Auth still requires an email,
so `src/lib/auth.ts::studentEmailAlias` synthesizes one as
`{normalizedPhone}@{STUDENT_EMAIL_DOMAIN or students.smartict.lk}` — normalization
(`normalizeSriLankanPhone`) and validation (`isValidSriLankanMobile`, pattern
`94(7[0-8])\d{7}` after normalization) live in that one file and should stay the
single source of truth; don't reimplement phone regex/format logic elsewhere.
Note the Edge Function (`user-admin/index.ts`) independently hardcodes
`@students.smartict.lk` when creating/updating auth users — if
`STUDENT_EMAIL_DOMAIN` is ever changed away from that default, registration and
login would compute different aliases for the same phone number.

**Server Actions return `ActionState`** (`src/lib/action-state.ts`) — `{ ok, message,
fieldErrors?, values? }` — consumed via `useActionState` in the matching `"use
client"` form component, so validation errors render inline without a full
navigation. This pattern is only used for the auth/profile forms. Admin CRUD forms
(`src/app/adminrandinu/(workspace)/**`) instead call plain Server Actions directly
from server-rendered `<form action={...}>` elements with no `ActionState` wiring and
**no error boundary anywhere in the app** (`error.tsx` doesn't exist at any route
segment) — a thrown error in one of those actions currently has nowhere good to go.
If you add error handling to an admin action, prefer redirecting back with a
query-string message the page can render, matching the read-only-friendly,
progressive-enhancement style already used elsewhere, rather than introducing
client-side `useActionState` wiring purely for error display.

**Route groups**: `src/app/app/**` is the student portal (guarded by `proxy.ts`),
`src/app/adminrandinu/**` is the teacher workspace — `/adminrandinu` itself is the
login screen, everything under `(workspace)` requires `profiles.role = 'admin'`
(checked both in `proxy.ts` and again per Server Action — the hidden URL is
obscurity, not the security boundary; RLS and the role check are). Public marketing
pages live at the `src/app/*` top level (`/`, `/programs`, `/about`, `/smart-lms`,
etc.).

**Demo vs. real data**: every `src/lib/data.ts` function follows `if (isDemoMode())
return demoX; ... const { data, error } = await supabase...; if (error || !data)
return <fallback>;` — the fallback-on-error behavior means a real Supabase failure
(RLS denial, PGRST error, expired session) currently degrades silently to
demo/empty data in several places rather than surfacing to the user or logs
consistently; `getStudentDashboardData` and `getAdminData` at least
`console.error` first, others don't.
