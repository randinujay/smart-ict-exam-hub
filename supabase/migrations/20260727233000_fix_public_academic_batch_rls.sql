-- Public registration only needs active academic batch labels. Keep inactive
-- rows protected by the separate admin policy without invoking is_admin() for
-- anonymous requests.
drop policy if exists academic_batches_public_read on public.academic_batches;
drop policy if exists academic_batches_active_read on public.academic_batches;

create policy academic_batches_active_read
on public.academic_batches
for select
to anon, authenticated
using (is_active);
