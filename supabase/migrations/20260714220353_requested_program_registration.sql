alter table public.profiles
  add column if not exists requested_program_id uuid references public.programs(id) on delete set null,
  add column if not exists requested_program_status text not null default 'none',
  add column if not exists requested_program_reviewed_at timestamptz,
  add column if not exists requested_program_reviewed_by uuid references public.profiles(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_requested_program_status_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles add constraint profiles_requested_program_status_check
      check (requested_program_status in ('none','pending','approved','rejected'));
  end if;
end $$;

create index if not exists profiles_requested_program_id_idx on public.profiles(requested_program_id);
create index if not exists profiles_requested_program_status_idx on public.profiles(requested_program_status) where requested_program_status='pending';
create index if not exists profiles_requested_program_reviewed_by_idx on public.profiles(requested_program_reviewed_by);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path='' as $$
declare requested_program uuid;
begin
  begin
    requested_program := nullif(new.raw_user_meta_data->>'requested_program_id','')::uuid;
  exception when invalid_text_representation then
    requested_program := null;
  end;

  if requested_program is not null and not exists (
    select 1 from public.programs where id=requested_program and is_active and registration_open
  ) then
    requested_program := null;
  end if;

  insert into public.profiles(
    id,first_name,last_name,date_of_birth,nic,contact_number,address,school,medium,
    role,account_status,requested_program_id,requested_program_status
  ) values(
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
    'requestedProgramStatus',p.requested_program_status,
    'programIds',coalesce((select jsonb_agg(distinct e.program_id) from public.enrollments e where e.student_id=p.id and e.status='active'),'[]'::jsonb),
    'batchIds',coalesce((select jsonb_agg(distinct e.batch_id) filter (where e.batch_id is not null) from public.enrollments e where e.student_id=p.id and e.status='active'),'[]'::jsonb)
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
    'batches',coalesce((select jsonb_agg(public.batch_json(b) order by b.created_at desc) from public.batches b),'[]'::jsonb),
    'students',coalesce((select jsonb_agg(jsonb_build_object(
      'id',p.id,'firstName',p.first_name,'lastName',p.last_name,'fullName',concat_ws(' ',p.first_name,p.last_name),
      'phone',p.contact_number,'dateOfBirth',p.date_of_birth,'nic',p.nic,'address',p.address,'school',p.school,
      'medium',p.medium,'role',p.role,'accountStatus',p.account_status,'createdAt',p.created_at,
      'requestedProgramId',p.requested_program_id,'requestedProgramStatus',p.requested_program_status,
      'programIds',coalesce((select jsonb_agg(distinct e.program_id) from public.enrollments e where e.student_id=p.id and e.status='active'),'[]'::jsonb),
      'batchIds',coalesce((select jsonb_agg(distinct e.batch_id) filter (where e.batch_id is not null) from public.enrollments e where e.student_id=p.id and e.status='active'),'[]'::jsonb)
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
  if not exists(select 1 from public.profiles where id=p_student_id and role='student') then
    raise exception 'Student account not found';
  end if;

  if p_decision='reject' then
    update public.profiles set
      requested_program_status='rejected',
      requested_program_reviewed_at=now(),
      requested_program_reviewed_by=auth.uid()
    where id=p_student_id and role='student';
    return true;
  end if;

  if p_program_id is null or not exists(select 1 from public.programs where id=p_program_id and is_active) then
    raise exception 'Select an active program';
  end if;
  if p_batch_id is not null and not exists(select 1 from public.batches where id=p_batch_id and program_id=p_program_id and is_active) then
    raise exception 'Select a batch from the chosen program';
  end if;

  insert into public.enrollments(student_id,program_id,batch_id,status)
  values(p_student_id,p_program_id,p_batch_id,'active')
  on conflict(student_id,program_id,batch_id) do update set status='active';

  update public.profiles set
    requested_program_id=p_program_id,
    requested_program_status='approved',
    requested_program_reviewed_at=now(),
    requested_program_reviewed_by=auth.uid(),
    account_status='verified',
    verified_at=now()
  where id=p_student_id and role='student';

  update public.support_requests set status='resolved',admin_notes='Program request approved.'
  where student_id=p_student_id and request_type='account_verification' and status in ('open','in_progress');
  return true;
end $$;

revoke all on function public.review_student_program_request(uuid,text,uuid,uuid) from public,anon;
grant execute on function public.review_student_program_request(uuid,text,uuid,uuid) to authenticated;
