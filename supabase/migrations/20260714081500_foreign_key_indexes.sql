-- Cover foreign keys used by joins and cascade checks.
create index if not exists access_overrides_created_by_idx on public.access_overrides(created_by);
create index if not exists answers_marked_by_idx on public.answers(marked_by);
create index if not exists assessments_module_id_idx on public.assessments(module_id);
create index if not exists assessments_owner_id_idx on public.assessments(owner_id);
create index if not exists content_audiences_batch_id_idx on public.content_audiences(batch_id);
create index if not exists content_audiences_program_id_idx on public.content_audiences(program_id);
create index if not exists content_audiences_student_id_idx on public.content_audiences(student_id);
create index if not exists payments_recorded_by_idx on public.payments(recorded_by);
create index if not exists questions_owner_id_idx on public.questions(owner_id);
create index if not exists recordings_module_id_idx on public.recordings(module_id);
create index if not exists resources_module_id_idx on public.resources(module_id);
create index if not exists support_requests_student_id_idx on public.support_requests(student_id);
