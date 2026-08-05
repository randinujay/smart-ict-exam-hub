-- A Smart ICT class is always a program (Theory/Revision/Paper/Rapid Revision)
-- combined with an exam-year batch (2026 O/L or 2027 O/L).

alter table public.profiles
  add column if not exists requested_batch_id uuid;

create index if not exists profiles_requested_batch_id_idx
  on public.profiles(requested_batch_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_requested_class_fkey'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_requested_class_fkey
      foreign key(requested_batch_id, requested_program_id)
      references public.batches(id, program_id)
      on delete set null;
  end if;
end $$;

drop policy if exists batches_anon_read on public.batches;
create policy batches_anon_read
on public.batches for select to anon
using (
  is_active
  and exists (
    select 1
    from public.programs p
    where p.id = batches.program_id
      and p.is_public
      and p.is_active
      and p.registration_open
  )
);

grant select on public.batches to anon;

do $$
declare
  old_2026_program uuid;
  old_2027_program uuid;
  theory_program uuid;
  revision_program uuid;
  paper_program uuid;
  rapid_program uuid;
  theory_2026_batch uuid;
  theory_2027_batch uuid;
  revision_2026_batch uuid;
  revision_2027_batch uuid;
  paper_2026_batch uuid;
  paper_2027_batch uuid;
  rapid_2026_batch uuid;
  rapid_2027_batch uuid;
begin
  select id into old_2026_program from public.programs where slug = '2026-ol';
  select id into old_2027_program from public.programs where slug = '2027-ol';

  insert into public.programs(
    name, short_name, slug, description, academic_level, exam_year, mediums,
    cover_image_url, is_public, registration_open, is_active, sort_order
  ) values (
    'Theory', 'Theory', 'theory',
    'Complete ICT theory lessons focused on clear understanding, structured notes and steady syllabus coverage.',
    'O/L', null, array['Sinhala','English']::text[], '/ol-theory-poster.jpg',
    true, true, true, 10
  )
  on conflict(slug) do update set
    name = excluded.name,
    short_name = excluded.short_name,
    description = excluded.description,
    academic_level = excluded.academic_level,
    exam_year = null,
    mediums = excluded.mediums,
    cover_image_url = excluded.cover_image_url,
    is_public = true,
    registration_open = true,
    is_active = true,
    sort_order = excluded.sort_order
  returning id into theory_program;

  insert into public.programs(
    name, short_name, slug, description, academic_level, exam_year, mediums,
    cover_image_url, is_public, registration_open, is_active, sort_order
  ) values (
    'Revision', 'Revision', 'revision',
    'Focused syllabus revision with concise explanations, targeted practice and regular assessment.',
    'O/L', null, array['Sinhala','English']::text[], '/rapid-revision-poster.jpg',
    true, true, true, 20
  )
  on conflict(slug) do update set
    name = excluded.name,
    short_name = excluded.short_name,
    description = excluded.description,
    academic_level = excluded.academic_level,
    exam_year = null,
    mediums = excluded.mediums,
    cover_image_url = excluded.cover_image_url,
    is_public = true,
    registration_open = true,
    is_active = true,
    sort_order = excluded.sort_order
  returning id into revision_program;

  insert into public.programs(
    name, short_name, slug, description, academic_level, exam_year, mediums,
    cover_image_url, is_public, registration_open, is_active, sort_order
  ) values (
    'Paper', 'Paper', 'paper',
    'Past-paper practice, answering technique, timed work and detailed paper discussion.',
    'O/L', null, array['Sinhala','English']::text[], '/ol-theory-poster.jpg',
    true, true, true, 30
  )
  on conflict(slug) do update set
    name = excluded.name,
    short_name = excluded.short_name,
    description = excluded.description,
    academic_level = excluded.academic_level,
    exam_year = null,
    mediums = excluded.mediums,
    cover_image_url = excluded.cover_image_url,
    is_public = true,
    registration_open = true,
    is_active = true,
    sort_order = excluded.sort_order
  returning id into paper_program;

  select id into rapid_program
  from public.programs
  where slug in ('rapid-revision', '2026-ol-rapid-revision')
  order by case when slug = 'rapid-revision' then 0 else 1 end
  limit 1;

  if rapid_program is null then
    insert into public.programs(
      name, short_name, slug, description, academic_level, exam_year, mediums,
      cover_image_url, is_public, registration_open, is_active, sort_order
    ) values (
      'Rapid Revision', 'Rapid Revision', 'rapid-revision',
      'Fast, exam-oriented revision combining syllabus coverage, answering technique and intensive paper practice.',
      'O/L', null, array['Sinhala','English']::text[], '/rapid-revision-poster.jpg',
      true, true, true, 40
    ) returning id into rapid_program;
  else
    update public.programs set
      name = 'Rapid Revision',
      short_name = 'Rapid Revision',
      slug = 'rapid-revision',
      description = 'Fast, exam-oriented revision combining syllabus coverage, answering technique and intensive paper practice.',
      academic_level = 'O/L',
      exam_year = null,
      mediums = array['Sinhala','English']::text[],
      cover_image_url = '/rapid-revision-poster.jpg',
      is_public = true,
      registration_open = true,
      is_active = true,
      sort_order = 40
    where id = rapid_program;
  end if;

  insert into public.batches(program_id, name, description, is_active)
  values(theory_program, '2026 O/L', 'Students preparing for the 2026 G.C.E. O/L examination.', true)
  on conflict(program_id, name) do update set description=excluded.description,is_active=true
  returning id into theory_2026_batch;
  insert into public.batches(program_id, name, description, is_active)
  values(theory_program, '2027 O/L', 'Students preparing for the 2027 G.C.E. O/L examination.', true)
  on conflict(program_id, name) do update set description=excluded.description,is_active=true
  returning id into theory_2027_batch;

  insert into public.batches(program_id, name, description, is_active)
  values(revision_program, '2026 O/L', 'Students preparing for the 2026 G.C.E. O/L examination.', true)
  on conflict(program_id, name) do update set description=excluded.description,is_active=true
  returning id into revision_2026_batch;
  insert into public.batches(program_id, name, description, is_active)
  values(revision_program, '2027 O/L', 'Students preparing for the 2027 G.C.E. O/L examination.', true)
  on conflict(program_id, name) do update set description=excluded.description,is_active=true
  returning id into revision_2027_batch;

  insert into public.batches(program_id, name, description, is_active)
  values(paper_program, '2026 O/L', 'Students preparing for the 2026 G.C.E. O/L examination.', true)
  on conflict(program_id, name) do update set description=excluded.description,is_active=true
  returning id into paper_2026_batch;
  insert into public.batches(program_id, name, description, is_active)
  values(paper_program, '2027 O/L', 'Students preparing for the 2027 G.C.E. O/L examination.', true)
  on conflict(program_id, name) do update set description=excluded.description,is_active=true
  returning id into paper_2027_batch;

  insert into public.batches(program_id, name, description, is_active)
  values(rapid_program, '2026 O/L', 'Students preparing for the 2026 G.C.E. O/L examination.', true)
  on conflict(program_id, name) do update set description=excluded.description,is_active=true
  returning id into rapid_2026_batch;
  insert into public.batches(program_id, name, description, is_active)
  values(rapid_program, '2027 O/L', 'Students preparing for the 2027 G.C.E. O/L examination.', true)
  on conflict(program_id, name) do update set description=excluded.description,is_active=true
  returning id into rapid_2027_batch;

  if old_2026_program is not null then
    insert into public.enrollments(student_id,program_id,batch_id,status,enrolled_at)
    select distinct on (student_id)
      student_id,theory_program,theory_2026_batch,status,enrolled_at
    from public.enrollments
    where program_id=old_2026_program
    order by student_id,
      case status when 'active' then 0 when 'completed' then 1 else 2 end,
      enrolled_at
    on conflict(student_id,program_id,batch_id) do update set
      status=excluded.status,
      enrolled_at=least(enrollments.enrolled_at,excluded.enrolled_at);
    delete from public.enrollments where program_id=old_2026_program;
    update public.modules
      set program_id=theory_program, batch_id=theory_2026_batch
      where program_id=old_2026_program;
    update public.payments
      set program_id=theory_program, batch_id=theory_2026_batch
      where program_id=old_2026_program;
    update public.profiles
      set requested_program_id=theory_program, requested_batch_id=theory_2026_batch
      where requested_program_id=old_2026_program;
    update public.content_audiences
      set program_id=theory_program
      where program_id=old_2026_program;
    update public.content_audiences
      set batch_id=theory_2026_batch
      where batch_id in (select id from public.batches where program_id=old_2026_program);
  end if;

  if old_2027_program is not null then
    insert into public.enrollments(student_id,program_id,batch_id,status,enrolled_at)
    select distinct on (student_id)
      student_id,theory_program,theory_2027_batch,status,enrolled_at
    from public.enrollments
    where program_id=old_2027_program
    order by student_id,
      case status when 'active' then 0 when 'completed' then 1 else 2 end,
      enrolled_at
    on conflict(student_id,program_id,batch_id) do update set
      status=excluded.status,
      enrolled_at=least(enrollments.enrolled_at,excluded.enrolled_at);
    delete from public.enrollments where program_id=old_2027_program;
    update public.modules
      set program_id=theory_program, batch_id=theory_2027_batch
      where program_id=old_2027_program;
    update public.payments
      set program_id=theory_program, batch_id=theory_2027_batch
      where program_id=old_2027_program;
    update public.profiles
      set requested_program_id=theory_program, requested_batch_id=theory_2027_batch
      where requested_program_id=old_2027_program;
    update public.content_audiences
      set program_id=theory_program
      where program_id=old_2027_program;
    update public.content_audiences
      set batch_id=theory_2027_batch
      where batch_id in (select id from public.batches where program_id=old_2027_program);
  end if;

  update public.enrollments
    set batch_id=rapid_2026_batch
    where program_id=rapid_program and batch_id is null;
  update public.modules
    set batch_id=rapid_2026_batch
    where program_id=rapid_program and batch_id is null;
  update public.payments
    set batch_id=rapid_2026_batch
    where program_id=rapid_program and batch_id is null;
  update public.profiles
    set requested_batch_id=rapid_2026_batch
    where requested_program_id=rapid_program and requested_batch_id is null;

  if exists (
    select 1 from public.enrollments where batch_id is null
    union all select 1 from public.modules where batch_id is null
    union all select 1 from public.payments where batch_id is null
  ) then
    raise exception 'Class migration stopped because an enrollment, module or payment has no batch';
  end if;

  delete from public.batches
  where program_id in (old_2026_program, old_2027_program);

  delete from public.programs
  where id in (old_2026_program, old_2027_program)
    and id is not null;
end $$;

alter table public.enrollments alter column batch_id set not null;
alter table public.modules alter column batch_id set not null;
alter table public.payments alter column batch_id set not null;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path='' as $$
declare
  requested_program uuid;
  requested_batch uuid;
begin
  begin
    requested_program := nullif(new.raw_user_meta_data->>'requested_program_id','')::uuid;
    requested_batch := nullif(new.raw_user_meta_data->>'requested_batch_id','')::uuid;
  exception when invalid_text_representation then
    requested_program := null;
    requested_batch := null;
  end;
  if requested_program is not null and requested_batch is not null and not exists(
    select 1
    from public.programs p
    join public.batches b on b.program_id=p.id
    where p.id=requested_program
      and b.id=requested_batch
      and p.is_active
      and p.registration_open
      and b.is_active
  ) then
    requested_program := null;
    requested_batch := null;
  end if;
  if requested_program is null or requested_batch is null then
    requested_program := null;
    requested_batch := null;
  end if;
  insert into public.profiles(
    id,first_name,last_name,date_of_birth,nic,contact_number,address,school,medium,
    role,account_status,requested_program_id,requested_batch_id,requested_program_status
  )
  values(
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'first_name',''),'New'),
    coalesce(nullif(new.raw_user_meta_data->>'last_name',''),'Student'),
    coalesce((new.raw_user_meta_data->>'date_of_birth')::date,current_date),
    nullif(upper(new.raw_user_meta_data->>'nic'),''),
    coalesce(nullif(new.raw_user_meta_data->>'contact_number',''),regexp_replace(coalesce(new.email,''),'@.*$','')),
    coalesce(new.raw_user_meta_data->>'address','Not provided'),
    coalesce(new.raw_user_meta_data->>'school','Not provided'),
    case when new.raw_user_meta_data->>'medium'='English' then 'English'::public.student_medium else 'Sinhala'::public.student_medium end,
    'student'::public.user_role,
    'pending'::public.account_status,
    requested_program,
    requested_batch,
    case when requested_program is null then 'none' else 'pending' end
  );
  return new;
end $$;

create or replace function public.get_my_profile()
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'id',p.id,
    'firstName',p.first_name,
    'lastName',p.last_name,
    'fullName',concat_ws(' ',p.first_name,p.last_name),
    'phone',p.contact_number,
    'dateOfBirth',p.date_of_birth,
    'nic',p.nic,
    'address',p.address,
    'school',p.school,
    'medium',p.medium,
    'role',p.role,
    'accountStatus',p.account_status,
    'createdAt',p.created_at,
    'requestedProgramId',p.requested_program_id,
    'requestedBatchId',p.requested_batch_id,
    'requestedProgramStatus',p.requested_program_status,
    'programIds',coalesce((select jsonb_agg(distinct e.program_id) from public.enrollments e where e.student_id=p.id and e.status='active'),'[]'::jsonb),
    'batchIds',coalesce((select jsonb_agg(distinct e.batch_id) from public.enrollments e where e.student_id=p.id and e.status='active'),'[]'::jsonb)
  )
  from public.profiles p where p.id=auth.uid();
$$;

create or replace function public.get_admin_workspace()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare output jsonb;
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  select jsonb_build_object(
    'programs',coalesce((select jsonb_agg(public.program_json(p) order by p.sort_order,p.name) from public.programs p),'[]'::jsonb),
    'batches',coalesce((select jsonb_agg(public.batch_json(b) order by b.name,b.created_at) from public.batches b),'[]'::jsonb),
    'students',coalesce((select jsonb_agg(jsonb_build_object(
      'id',p.id,'firstName',p.first_name,'lastName',p.last_name,'fullName',concat_ws(' ',p.first_name,p.last_name),
      'phone',p.contact_number,'dateOfBirth',p.date_of_birth,'nic',p.nic,'address',p.address,'school',p.school,
      'medium',p.medium,'role',p.role,'accountStatus',p.account_status,'createdAt',p.created_at,
      'requestedProgramId',p.requested_program_id,'requestedBatchId',p.requested_batch_id,'requestedProgramStatus',p.requested_program_status,
      'programIds',coalesce((select jsonb_agg(distinct e.program_id) from public.enrollments e where e.student_id=p.id and e.status='active'),'[]'::jsonb),
      'batchIds',coalesce((select jsonb_agg(distinct e.batch_id) from public.enrollments e where e.student_id=p.id and e.status='active'),'[]'::jsonb)
    ) order by p.created_at desc) from public.profiles p where p.role='student'),'[]'::jsonb),
    'modules',coalesce((select jsonb_agg(public.module_json(m) order by m.year desc,m.month desc) from public.modules m),'[]'::jsonb),
    'resources',coalesce((select jsonb_agg(public.resource_json(r) order by r.published_at desc) from public.resources r),'[]'::jsonb),
    'assessments',coalesce((select jsonb_agg(public.assessment_json(a,true,true) order by a.created_at desc) from public.assessments a),'[]'::jsonb),
    'attempts',coalesce((select jsonb_agg(jsonb_build_object(
      'id',att.id,'assessmentId',att.assessment_id,'studentId',att.student_id,'status',att.status,
      'startedAt',att.started_at,'deadlineAt',att.deadline_at,'submittedAt',att.submitted_at,'autoSubmitted',att.auto_submitted
    ) order by att.started_at desc) from public.attempts att),'[]'::jsonb),
    'results',coalesce((select jsonb_agg(public.result_json(r) order by r.completed_at desc) from public.results r),'[]'::jsonb),
    'payments',coalesce((select jsonb_agg(public.payment_json(p) order by p.billing_month desc) from public.payments p),'[]'::jsonb),
    'testimonials',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'studentName',t.student_name,'programName',t.program_name,'quote',t.quote,'resultLabel',t.result_label,'isPublished',t.is_published) order by t.sort_order,t.created_at desc) from public.testimonials t),'[]'::jsonb)
  ) into output;
  return output;
end $$;

create or replace function public.review_student_program_request(
  p_student_id uuid,
  p_decision text,
  p_program_id uuid default null,
  p_batch_id uuid default null
)
returns boolean language plpgsql security definer set search_path='' as $$
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  if p_decision not in ('approve','reject') then raise exception 'Invalid review decision'; end if;
  if not exists(select 1 from public.profiles where id=p_student_id and role='student') then raise exception 'Student account not found'; end if;
  if p_decision='reject' then
    update public.profiles set requested_program_status='rejected',requested_program_reviewed_at=now(),requested_program_reviewed_by=auth.uid()
    where id=p_student_id and role='student';
    return true;
  end if;
  if p_program_id is null or not exists(select 1 from public.programs where id=p_program_id and is_active) then raise exception 'Select an active program'; end if;
  if p_batch_id is null or not exists(select 1 from public.batches where id=p_batch_id and program_id=p_program_id and is_active) then raise exception 'Select a batch from the chosen program'; end if;
  insert into public.enrollments(student_id,program_id,batch_id,status) values(p_student_id,p_program_id,p_batch_id,'active')
  on conflict(student_id,program_id,batch_id) do update set status='active';
  update public.profiles set
    requested_program_id=p_program_id,
    requested_batch_id=p_batch_id,
    requested_program_status='approved',
    requested_program_reviewed_at=now(),
    requested_program_reviewed_by=auth.uid(),
    account_status='verified',
    verified_at=now()
  where id=p_student_id and role='student';
  update public.support_requests set status='resolved',admin_notes='Class request approved.'
  where student_id=p_student_id and request_type='account_verification' and status in ('open','in_progress');
  return true;
end $$;

revoke all on function public.handle_new_user() from public,anon,authenticated;
grant all privileges on function public.handle_new_user() to service_role;
revoke all on function public.get_my_profile() from public,anon;
grant execute on function public.get_my_profile() to authenticated;
revoke all on function public.get_admin_workspace() from public,anon;
grant execute on function public.get_admin_workspace() to authenticated;
revoke all on function public.review_student_program_request(uuid,text,uuid,uuid) from public,anon;
grant execute on function public.review_student_program_request(uuid,text,uuid,uuid) to authenticated;
