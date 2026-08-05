# Production checklist

## 1. Supabase

- Run `supabase/schema.sql`
- Run `supabase/seed.sql`
- Create the teacher auth user
- Run `supabase/create-admin.sql`
- Confirm the private `resources` storage bucket exists
- Confirm Row Level Security is enabled on all public tables

## 2. Vercel variables

Copy every required key from `.env.example`. Use Node.js 22.x.

## 3. Supabase Auth URLs

Set the production site URL and add `/auth/callback` as an allowed redirect URL.

## 4. Smoke test

1. Register a new student with a phone number.
2. Confirm the pending account can enter the dashboard and access free content.
3. Verify the account in `/adminrandinu/students`.
4. Assign a program and batch.
5. Mark the current month as paid.
6. Confirm the paid monthly module unlocks.
7. Submit an online objective assessment.
8. Submit a structured-answer assessment and publish it from the manual-marking screen.
9. Import an offline result CSV, then re-import one corrected mark to confirm update behaviour.
10. Confirm both result sources appear in dashboard graphs.
11. Assign an assessment to a second program and to one individual student.
12. Suspend the account and confirm protected content is blocked.

## 5. Backup and operations

- Enable Supabase point-in-time recovery when usage justifies it.
- Export student/result/payment data periodically.
- Use a separate preview Supabase project for major schema changes.
- Never paste the service-role key into client code, screenshots or public issues.
