-- Separate the academic cohort (Batch) from the class combination (Batch + Program).
-- Existing public.batches IDs are retained because enrolments, modules, payments,
-- registration requests and content audiences already reference them as classes.

create table if not exists public.academic_batches (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  academic_level text not null check (academic_level in ('O/L','A/L','Other')),
  exam_year integer not null check (exam_year between 2020 and 2200),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(exam_year,academic_level)
);

alter table public.academic_batches enable row level security;
drop policy if exists academic_batches_public_read on public.academic_batches;
create policy academic_batches_public_read on public.academic_batches
  for select to anon,authenticated using (is_active or public.is_admin());
drop policy if exists academic_batches_admin_all on public.academic_batches;
create policy academic_batches_admin_all on public.academic_batches
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.academic_batches to anon,authenticated;
grant insert,update,delete on public.academic_batches to authenticated;

alter table public.batches
  add column if not exists academic_batch_id uuid references public.academic_batches(id) on delete restrict,
  add column if not exists registration_open boolean not null default true,
  add column if not exists sort_order integer not null default 0;

create index if not exists batches_academic_batch_id_idx on public.batches(academic_batch_id);

do $$
declare
  batch_2026_ol uuid;
  batch_2027_ol uuid;
  batch_2027_al uuid;
  theory_program uuid;
  revision_program uuid;
  paper_program uuid;
begin
  insert into public.academic_batches(name,academic_level,exam_year,is_active,sort_order)
  values('2026 O/L','O/L',2026,true,10)
  on conflict(name) do update set academic_level='O/L',exam_year=2026,is_active=true,sort_order=10
  returning id into batch_2026_ol;

  insert into public.academic_batches(name,academic_level,exam_year,is_active,sort_order)
  values('2027 O/L','O/L',2027,true,20)
  on conflict(name) do update set academic_level='O/L',exam_year=2027,is_active=true,sort_order=20
  returning id into batch_2027_ol;

  insert into public.academic_batches(name,academic_level,exam_year,is_active,sort_order)
  values('2027 A/L','A/L',2027,true,30)
  on conflict(name) do update set academic_level='A/L',exam_year=2027,is_active=true,sort_order=30
  returning id into batch_2027_al;

  update public.batches b
  set academic_batch_id=ab.id
  from public.academic_batches ab
  where b.academic_batch_id is null and b.name=ab.name;

  select id into theory_program from public.programs where slug='theory';
  select id into revision_program from public.programs where slug='revision';
  select id into paper_program from public.programs where slug='paper';
  if theory_program is null or revision_program is null or paper_program is null then
    raise exception 'Theory, Revision and Paper programs must exist before class normalization';
  end if;

  update public.programs set is_active=false,is_public=false,registration_open=false
  where slug not in ('theory','revision','paper');
  update public.programs set is_active=true,is_public=true,registration_open=true,academic_level='Other',exam_year=null
  where slug in ('theory','revision','paper');

  insert into public.batches(program_id,academic_batch_id,name,is_active,registration_open,sort_order)
  values
    (revision_program,batch_2026_ol,'2026 O/L',true,true,10),
    (paper_program,batch_2026_ol,'2026 O/L',true,true,20),
    (theory_program,batch_2027_ol,'2027 O/L',true,true,30),
    (revision_program,batch_2027_al,'2027 A/L',true,true,40),
    (paper_program,batch_2027_al,'2027 A/L',true,true,50)
  on conflict(program_id,name) do update set
    academic_batch_id=excluded.academic_batch_id,
    is_active=true,
    registration_open=true,
    sort_order=excluded.sort_order;

  update public.batches
  set is_active=false,registration_open=false
  where not (
    (academic_batch_id=batch_2026_ol and program_id in (revision_program,paper_program))
    or (academic_batch_id=batch_2027_ol and program_id=theory_program)
    or (academic_batch_id=batch_2027_al and program_id in (revision_program,paper_program))
  );
end $$;

do $$
begin
  if exists(select 1 from public.batches where academic_batch_id is null) then
    raise exception 'Class normalization stopped: an existing class has no matching academic batch';
  end if;
end $$;

alter table public.batches alter column academic_batch_id set not null;
create unique index if not exists batches_academic_program_unique
  on public.batches(academic_batch_id,program_id);

-- Convert broad program audiences to their active concrete classes. Legacy
-- audiences without an active class remain untouched instead of becoming public.
insert into public.content_audiences(content_type,content_id,batch_id)
select distinct ca.content_type,ca.content_id,b.id
from public.content_audiences ca
join public.batches b on b.program_id=ca.program_id and b.is_active
where ca.program_id is not null
on conflict do nothing;

delete from public.content_audiences ca
where ca.program_id is not null
  and exists(select 1 from public.batches b where b.program_id=ca.program_id and b.is_active);

drop policy if exists batches_anon_read on public.batches;
create policy batches_anon_read on public.batches for select to anon using (
  is_active and registration_open
  and exists(select 1 from public.academic_batches ab where ab.id=batches.academic_batch_id and ab.is_active)
  and exists(select 1 from public.programs p where p.id=batches.program_id and p.is_public and p.is_active and p.registration_open)
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path='' as $$
declare requested_program uuid; requested_batch uuid;
begin
  begin
    requested_program := nullif(new.raw_user_meta_data->>'requested_program_id','')::uuid;
    requested_batch := nullif(new.raw_user_meta_data->>'requested_batch_id','')::uuid;
  exception when invalid_text_representation then
    requested_program := null; requested_batch := null;
  end;
  if requested_program is not null and requested_batch is not null and not exists(
    select 1 from public.programs p
    join public.batches c on c.program_id=p.id
    join public.academic_batches ab on ab.id=c.academic_batch_id
    where p.id=requested_program and c.id=requested_batch
      and p.is_active and p.registration_open
      and c.is_active and c.registration_open and ab.is_active
  ) then
    requested_program := null; requested_batch := null;
  end if;
  if requested_program is null or requested_batch is null then
    requested_program := null; requested_batch := null;
  end if;
  insert into public.profiles(
    id,first_name,last_name,date_of_birth,nic,contact_number,address,school,medium,
    role,account_status,requested_program_id,requested_batch_id,requested_program_status
  ) values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'first_name',''),'New'),
    coalesce(nullif(new.raw_user_meta_data->>'last_name',''),'Student'),
    coalesce((new.raw_user_meta_data->>'date_of_birth')::date,current_date),
    nullif(upper(new.raw_user_meta_data->>'nic'),''),
    coalesce(nullif(new.raw_user_meta_data->>'contact_number',''),regexp_replace(coalesce(new.email,''),'@.*$','')),
    coalesce(new.raw_user_meta_data->>'address','Not provided'),
    coalesce(new.raw_user_meta_data->>'school','Not provided'),
    case when new.raw_user_meta_data->>'medium'='English' then 'English'::public.student_medium else 'Sinhala'::public.student_medium end,
    'student'::public.user_role,'pending'::public.account_status,
    requested_program,requested_batch,
    case when requested_program is null then 'none' else 'pending' end
  );
  return new;
end $$;

create or replace function public.academic_batch_json(b public.academic_batches)
returns jsonb language sql immutable set search_path='' as $$
  select jsonb_build_object(
    'id',b.id,'name',b.name,'academicLevel',b.academic_level,'examYear',b.exam_year,
    'isActive',b.is_active,'sortOrder',b.sort_order
  );
$$;

create or replace function public.batch_json(b public.batches)
returns jsonb language sql stable set search_path='' as $$
  select jsonb_build_object(
    'id',b.id,'programId',b.program_id,'academicBatchId',b.academic_batch_id,
    'name',b.name,
    'className',b.name||' — '||(select p.name from public.programs p where p.id=b.program_id),
    'description',b.description,'registrationOpen',b.registration_open,
    'sortOrder',b.sort_order,'isActive',b.is_active
  );
$$;

create or replace function public.get_admin_workspace()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare output jsonb;
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  select jsonb_build_object(
    'programs',coalesce((select jsonb_agg(public.program_json(p) order by p.sort_order,p.name) from public.programs p),'[]'::jsonb),
    'academicBatches',coalesce((select jsonb_agg(public.academic_batch_json(ab) order by ab.sort_order,ab.name) from public.academic_batches ab),'[]'::jsonb),
    'batches',coalesce((select jsonb_agg(public.batch_json(b) order by b.sort_order,b.name) from public.batches b),'[]'::jsonb),
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

revoke all on function public.get_admin_workspace() from public,anon;
grant execute on function public.get_admin_workspace() to authenticated;
