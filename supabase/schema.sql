-- Smart ICT LMS production schema
-- Run in a NEW Supabase project using SQL Editor.

create extension if not exists pgcrypto;

create type public.user_role as enum ('student','admin');
create type public.account_status as enum ('pending','verified','suspended');
create type public.student_medium as enum ('Sinhala','English');
create type public.access_type as enum ('free','paid');
create type public.module_status as enum ('draft','published','upcoming','archived');
create type public.assessment_delivery as enum ('online','offline');
create type public.assessment_timing as enum ('flexible','strict');
create type public.assessment_source as enum ('smart_ict','school');
create type public.assessment_status as enum ('draft','published','closed','archived');
create type public.question_type as enum ('single_choice','multiple_choice','true_false','short_answer','structured');
create type public.attempt_status as enum ('in_progress','submitted','awaiting_manual','graded');
create type public.result_status as enum ('pending','published');
create type public.payment_status as enum ('paid','unpaid','waived');
create type public.support_status as enum ('open','in_progress','resolved','closed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  date_of_birth date not null,
  nic text unique,
  contact_number text not null unique,
  address text not null,
  school text not null,
  medium public.student_medium not null,
  role public.user_role not null default 'student',
  account_status public.account_status not null default 'pending',
  requested_program_id uuid,
  requested_batch_id uuid,
  requested_program_status text not null default 'none' check (requested_program_status in ('none','pending','approved','rejected')),
  requested_program_reviewed_at timestamptz,
  requested_program_reviewed_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text not null,
  slug text not null unique,
  description text not null default '',
  academic_level text not null check (academic_level in ('O/L','A/L','Other')),
  exam_year integer,
  mediums text[] not null default array['Sinhala','English']::text[],
  cover_image_url text,
  is_public boolean not null default true,
  registration_open boolean not null default true,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add constraint profiles_requested_program_id_fkey foreign key(requested_program_id) references public.programs(id) on delete set null;
create index profiles_requested_program_id_idx on public.profiles(requested_program_id);
create index profiles_requested_program_status_idx on public.profiles(requested_program_status) where requested_program_status='pending';
create index profiles_requested_program_reviewed_by_idx on public.profiles(requested_program_reviewed_by);
create index profiles_pending_students_created_idx on public.profiles(created_at desc) where role='student' and account_status='pending';

create table public.batches (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(program_id,name),
  unique(id,program_id)
);
alter table public.profiles add constraint profiles_requested_class_fkey foreign key(requested_batch_id,requested_program_id) references public.batches(id,program_id) on delete set null;
create index profiles_requested_batch_id_idx on public.profiles(requested_batch_id);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  batch_id uuid not null,
  status text not null default 'active' check (status in ('active','inactive','completed')),
  enrolled_at timestamptz not null default now(),
  foreign key(batch_id,program_id) references public.batches(id,program_id) on delete restrict
);
create unique index enrollments_unique_scope on public.enrollments (student_id,program_id,batch_id) nulls not distinct;

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  batch_id uuid not null,
  title text not null,
  month integer not null check (month between 1 and 12),
  year integer not null check (year between 2020 and 2200),
  access_type public.access_type not null default 'paid',
  status public.module_status not null default 'draft',
  opens_at timestamptz,
  closes_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (closes_at is null or opens_at is null or closes_at > opens_at),
  foreign key(batch_id,program_id) references public.batches(id,program_id) on delete restrict
);
create unique index modules_unique_scope on public.modules (program_id,batch_id,year,month) nulls not distinct;

create table public.recordings (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  description text,
  video_url text not null,
  duration_label text,
  access_type public.access_type not null default 'paid',
  is_published boolean not null default false,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references public.modules(id) on delete set null,
  title text not null,
  description text,
  file_name text not null,
  storage_path text not null,
  file_type text not null default 'PDF',
  access_type public.access_type not null default 'paid',
  is_published boolean not null default false,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references public.modules(id) on delete set null,
  owner_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  description text not null default '',
  instructions text not null default '',
  delivery public.assessment_delivery not null default 'online',
  timing public.assessment_timing not null default 'flexible',
  source public.assessment_source not null default 'smart_ict',
  status public.assessment_status not null default 'draft',
  duration_minutes integer check (duration_minutes is null or duration_minutes between 1 and 360),
  starts_at timestamptz,
  ends_at timestamptz,
  max_attempts integer not null default 1 check (max_attempts between 1 and 10),
  shuffle_questions boolean not null default false,
  shuffle_options boolean not null default false,
  show_answers boolean not null default false,
  show_results boolean not null default true,
  access_type public.access_type not null default 'paid',
  total_marks numeric(8,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at),
  check (
    delivery='offline'
    or (timing='flexible' and duration_minutes is not null)
    or (timing='strict' and starts_at is not null and ends_at is not null)
  ),
  check (access_type='free' or module_id is not null)
);

-- Generic audiences allow content to be shared with additional programs, batches or individual students.
create table public.content_audiences (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('module','recording','resource','assessment')),
  content_id uuid not null,
  program_id uuid references public.programs(id) on delete cascade,
  batch_id uuid references public.batches(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (num_nonnulls(program_id,batch_id,student_id)=1)
);
create unique index content_audiences_unique on public.content_audiences(content_type,content_id,coalesce(program_id,'00000000-0000-0000-0000-000000000000'::uuid),coalesce(batch_id,'00000000-0000-0000-0000-000000000000'::uuid),coalesce(student_id,'00000000-0000-0000-0000-000000000000'::uuid));

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  type public.question_type not null,
  prompt text not null,
  marks numeric(6,2) not null default 1 check (marks > 0),
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  option_key text not null,
  option_text text not null,
  sort_order integer not null,
  unique(question_id,option_key),
  unique(question_id,sort_order)
);

create table public.question_keys (
  question_id uuid primary key references public.questions(id) on delete cascade,
  correct_answer jsonb,
  explanation text,
  marking_guidance text,
  updated_at timestamptz not null default now()
);

create table public.assessment_questions (
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  sort_order integer not null,
  marks_override numeric(6,2),
  primary key(assessment_id,question_id),
  unique(assessment_id,sort_order)
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  attempt_number integer not null,
  status public.attempt_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  deadline_at timestamptz,
  submitted_at timestamptz,
  auto_submitted boolean not null default false,
  score numeric(8,2),
  max_score numeric(8,2),
  percentage numeric(6,2),
  created_at timestamptz not null default now(),
  unique(assessment_id,student_id,attempt_number)
);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  answer_payload jsonb,
  is_flagged boolean not null default false,
  is_correct boolean,
  awarded_marks numeric(6,2),
  marked_by uuid references public.profiles(id) on delete set null,
  marked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(attempt_id,question_id)
);

create table public.results (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  attempt_id uuid references public.attempts(id) on delete set null,
  obtained_marks numeric(8,2) not null,
  total_marks numeric(8,2) not null,
  percentage numeric(6,2) generated always as (case when total_marks > 0 then round((obtained_marks/total_marks)*100,2) else 0 end) stored,
  status public.result_status not null default 'published',
  mcq_marks numeric(8,2),
  structured_marks numeric(8,2),
  feedback text,
  completed_at timestamptz not null default now(),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(assessment_id,student_id,attempt_id)
);
create unique index results_unique_offline_student on public.results(assessment_id,student_id) where attempt_id is null;
create index results_published_completed_idx on public.results(completed_at desc) where status='published';

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  batch_id uuid not null,
  billing_month date not null check (extract(day from billing_month)=1),
  amount numeric(10,2) not null default 0 check (amount >= 0),
  status public.payment_status not null default 'unpaid',
  paid_at timestamptz,
  notes text,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(batch_id,program_id) references public.batches(id,program_id) on delete restrict
);
create unique index payments_unique_month on public.payments (student_id,program_id,batch_id,billing_month) nulls not distinct;
create index payments_month_status_idx on public.payments(billing_month,status);

create table public.access_overrides (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  content_type text not null check (content_type in ('module','recording','resource','assessment')),
  content_id uuid not null,
  is_allowed boolean not null default true,
  reason text,
  expires_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(student_id,content_type,content_id)
);

-- Polymorphic content references cannot use a normal foreign key. Validate
-- them on write and remove audience/override rows when content is deleted.
create or replace function public.validate_content_reference()
returns trigger language plpgsql set search_path='' as $$
declare reference_exists boolean;
begin
  case new.content_type
    when 'module' then select exists(select 1 from public.modules where id=new.content_id) into reference_exists;
    when 'recording' then select exists(select 1 from public.recordings where id=new.content_id) into reference_exists;
    when 'resource' then select exists(select 1 from public.resources where id=new.content_id) into reference_exists;
    when 'assessment' then select exists(select 1 from public.assessments where id=new.content_id) into reference_exists;
    else reference_exists := false;
  end case;
  if not reference_exists then raise exception 'Referenced content does not exist'; end if;
  return new;
end $$;

create trigger content_audiences_reference_check
before insert or update of content_type,content_id on public.content_audiences
for each row execute function public.validate_content_reference();
create trigger access_overrides_reference_check
before insert or update of content_type,content_id on public.access_overrides
for each row execute function public.validate_content_reference();

create or replace function public.cleanup_content_references()
returns trigger language plpgsql set search_path='' as $$
begin
  delete from public.content_audiences where content_type=tg_argv[0] and content_id=old.id;
  delete from public.access_overrides where content_type=tg_argv[0] and content_id=old.id;
  return old;
end $$;

create trigger modules_reference_cleanup after delete on public.modules
for each row execute function public.cleanup_content_references('module');
create trigger recordings_reference_cleanup after delete on public.recordings
for each row execute function public.cleanup_content_references('recording');
create trigger resources_reference_cleanup after delete on public.resources
for each row execute function public.cleanup_content_references('resource');
create trigger assessments_reference_cleanup after delete on public.assessments
for each row execute function public.cleanup_content_references('assessment');

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  program_name text not null,
  quote text not null,
  result_label text,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.support_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete set null,
  contact_number text,
  request_type text not null,
  subject text not null,
  message text not null,
  status public.support_status not null default 'open',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.site_content (
  id uuid primary key default gen_random_uuid(),
  content_key text not null unique,
  content_value text,
  content_type text not null default 'text',
  is_public boolean not null default false,
  updated_at timestamptz not null default now()
);

create index profiles_status_idx on public.profiles(account_status);
create index enrollments_student_idx on public.enrollments(student_id);
create index modules_scope_idx on public.modules(program_id,batch_id,year,month);
create index audiences_lookup_idx on public.content_audiences(content_type,content_id);
create index attempts_student_idx on public.attempts(student_id,assessment_id);
create index results_student_date_idx on public.results(student_id,completed_at desc);
create index payments_student_month_idx on public.payments(student_id,billing_month desc);
create index support_status_idx on public.support_requests(status,created_at desc);
create index access_overrides_created_by_idx on public.access_overrides(created_by);
create index answers_marked_by_idx on public.answers(marked_by);
create index assessments_module_id_idx on public.assessments(module_id);
create index assessments_owner_id_idx on public.assessments(owner_id);
create index content_audiences_batch_id_idx on public.content_audiences(batch_id);
create index content_audiences_program_id_idx on public.content_audiences(program_id);
create index content_audiences_student_id_idx on public.content_audiences(student_id);
create index payments_recorded_by_idx on public.payments(recorded_by);
create index questions_owner_id_idx on public.questions(owner_id);
create index recordings_module_id_idx on public.recordings(module_id);
create index resources_module_id_idx on public.resources(module_id);
create index support_requests_student_id_idx on public.support_requests(student_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end $$;

create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger programs_updated before update on public.programs for each row execute function public.set_updated_at();
create trigger batches_updated before update on public.batches for each row execute function public.set_updated_at();
create trigger modules_updated before update on public.modules for each row execute function public.set_updated_at();
create trigger recordings_updated before update on public.recordings for each row execute function public.set_updated_at();
create trigger resources_updated before update on public.resources for each row execute function public.set_updated_at();
create trigger assessments_updated before update on public.assessments for each row execute function public.set_updated_at();
create trigger questions_updated before update on public.questions for each row execute function public.set_updated_at();
create trigger answers_updated before update on public.answers for each row execute function public.set_updated_at();
create trigger results_updated before update on public.results for each row execute function public.set_updated_at();
create trigger payments_updated before update on public.payments for each row execute function public.set_updated_at();
create trigger testimonials_updated before update on public.testimonials for each row execute function public.set_updated_at();
create trigger support_updated before update on public.support_requests for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path='' as $$
declare requested_program uuid; requested_batch uuid;
begin
  begin
    requested_program := nullif(new.raw_user_meta_data->>'requested_program_id','')::uuid;
    requested_batch := nullif(new.raw_user_meta_data->>'requested_batch_id','')::uuid;
  exception when invalid_text_representation then
    requested_program := null;
    requested_batch := null;
  end;
  if requested_program is null or requested_batch is null or not exists(
    select 1 from public.programs p join public.batches b on b.program_id=p.id
    where p.id=requested_program and b.id=requested_batch and p.is_active and p.registration_open and b.is_active
  ) then
    requested_program := null;
    requested_batch := null;
  end if;
  insert into public.profiles(id,first_name,last_name,date_of_birth,nic,contact_number,address,school,medium,role,account_status,requested_program_id,requested_batch_id,requested_program_status)
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
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role='admin');
$$;

create or replace function public.is_verified_student()
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role='student' and account_status='verified');
$$;

create or replace function public.has_active_enrollment(p_program_id uuid,p_batch_id uuid default null)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(
    select 1 from public.enrollments e
    where e.student_id=auth.uid() and e.program_id=p_program_id and e.status='active'
      and (p_batch_id is null or e.batch_id=p_batch_id)
  );
$$;

create or replace function public.has_paid_month(p_program_id uuid,p_batch_id uuid,p_year integer,p_month integer)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(
    select 1 from public.payments p
    where p.student_id=auth.uid() and p.program_id=p_program_id
      and (p_batch_id is null or p.batch_id is null or p.batch_id=p_batch_id)
      and p.billing_month=make_date(p_year,p_month,1)
      and p.status in ('paid','waived')
  );
$$;

create or replace function public.has_override(p_content_type text,p_content_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select coalesce((select ao.is_allowed from public.access_overrides ao where ao.student_id=auth.uid() and ao.content_type=p_content_type and ao.content_id=p_content_id and (ao.expires_at is null or ao.expires_at>now()) limit 1),false);
$$;

-- Tri-state override decision: true explicitly allows, false explicitly denies,
-- and null means the normal audience/payment rules should be evaluated.
create or replace function public.access_override_decision(p_content_type text,p_content_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select ao.is_allowed
  from public.access_overrides ao
  where ao.student_id=auth.uid()
    and ao.content_type=p_content_type
    and ao.content_id=p_content_id
    and (ao.expires_at is null or ao.expires_at>now())
  limit 1;
$$;

create or replace function public.matches_audience(p_content_type text,p_content_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(
    select 1 from public.content_audiences ca
    where ca.content_type=p_content_type and ca.content_id=p_content_id and (
      ca.student_id=auth.uid()
      or (ca.program_id is not null and exists(select 1 from public.enrollments e where e.student_id=auth.uid() and e.program_id=ca.program_id and e.status='active'))
      or (ca.batch_id is not null and exists(select 1 from public.enrollments e where e.student_id=auth.uid() and e.batch_id=ca.batch_id and e.status='active'))
    )
  );
$$;

create or replace function public.content_has_audience(p_content_type text,p_content_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.content_audiences ca where ca.content_type=p_content_type and ca.content_id=p_content_id);
$$;

create or replace function public.has_paid_audience_month(p_content_type text,p_content_id uuid,p_year integer,p_month integer)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(
    select 1
    from public.content_audiences ca
    join public.payments p on p.student_id=auth.uid() and p.billing_month=make_date(p_year,p_month,1) and p.status in ('paid','waived')
      and ((ca.program_id is not null and p.program_id=ca.program_id) or (ca.batch_id is not null and (p.batch_id=ca.batch_id or p.batch_id is null)))
    where ca.content_type=p_content_type and ca.content_id=p_content_id
  );
$$;

create or replace function public.can_access_module(p_module_id uuid)
returns boolean language plpgsql stable security definer set search_path='' as $$
declare
  m public.modules%rowtype;
  override_allowed boolean;
begin
  if public.is_admin() then return true; end if;
  select * into m from public.modules where id=p_module_id and status in ('published','upcoming');
  if not found then return false; end if;
  if exists(select 1 from public.profiles where id=auth.uid() and account_status='suspended') then return false; end if;
  if m.opens_at is not null and now()<m.opens_at then return false; end if;
  if m.closes_at is not null and now()>=m.closes_at then return false; end if;
  override_allowed := public.access_override_decision('module',p_module_id);
  if override_allowed is not null then return override_allowed; end if;
  if public.content_has_audience('module',p_module_id) and not public.matches_audience('module',p_module_id) then return false; end if;
  if m.access_type='free' then return true; end if;
  return public.is_verified_student()
    and (public.has_active_enrollment(m.program_id,m.batch_id) or public.matches_audience('module',p_module_id))
    and (public.has_paid_month(m.program_id,m.batch_id,m.year,m.month) or public.has_paid_audience_month('module',p_module_id,m.year,m.month));
end $$;

create or replace function public.can_access_recording(p_recording_id uuid)
returns boolean language plpgsql stable security definer set search_path='' as $$
declare
  r public.recordings%rowtype;
  override_allowed boolean;
begin
  if public.is_admin() then return true; end if;
  select * into r from public.recordings where id=p_recording_id and is_published=true;
  if not found then return false; end if;
  if exists(select 1 from public.profiles where id=auth.uid() and account_status='suspended') then return false; end if;
  override_allowed := public.access_override_decision('recording',p_recording_id);
  if override_allowed is not null then return override_allowed; end if;
  if public.content_has_audience('recording',p_recording_id) and not public.matches_audience('recording',p_recording_id) then return false; end if;
  if r.access_type='free' then return true; end if;
  if public.can_access_module(r.module_id) then return true; end if;
  return public.is_verified_student() and public.matches_audience('recording',p_recording_id)
    and exists(select 1 from public.modules m where m.id=r.module_id and public.has_paid_audience_month('recording',p_recording_id,m.year,m.month));
end $$;

create or replace function public.can_access_resource(p_resource_id uuid)
returns boolean language plpgsql stable security definer set search_path='' as $$
declare
  r public.resources%rowtype;
  override_allowed boolean;
begin
  if public.is_admin() then return true; end if;
  select * into r from public.resources where id=p_resource_id and is_published=true;
  if not found then return false; end if;
  if exists(select 1 from public.profiles where id=auth.uid() and account_status='suspended') then return false; end if;
  override_allowed := public.access_override_decision('resource',p_resource_id);
  if override_allowed is not null then return override_allowed; end if;
  if public.content_has_audience('resource',p_resource_id) and not public.matches_audience('resource',p_resource_id) then return false; end if;
  if r.access_type='free' then return true; end if;
  if r.module_id is not null and public.can_access_module(r.module_id) then return true; end if;
  return public.is_verified_student() and r.module_id is not null and public.matches_audience('resource',p_resource_id)
    and exists(select 1 from public.modules m where m.id=r.module_id and public.has_paid_audience_month('resource',p_resource_id,m.year,m.month));
end $$;

create or replace function public.can_access_assessment(p_assessment_id uuid)
returns boolean language plpgsql stable security definer set search_path='' as $$
declare
  a public.assessments%rowtype;
  override_allowed boolean;
begin
  if public.is_admin() then return true; end if;
  select * into a from public.assessments where id=p_assessment_id and status='published';
  if not found then return false; end if;
  if exists(select 1 from public.profiles where id=auth.uid() and account_status='suspended') then return false; end if;
  override_allowed := public.access_override_decision('assessment',p_assessment_id);
  if override_allowed is not null then return override_allowed; end if;
  if public.content_has_audience('assessment',p_assessment_id) and not public.matches_audience('assessment',p_assessment_id) then return false; end if;
  if a.access_type='free' then return true; end if;
  if not public.content_has_audience('assessment',p_assessment_id) then return false; end if;
  if not public.is_verified_student() then return false; end if;
  if a.module_id is null then return true; end if;
  if public.can_access_module(a.module_id) then return true; end if;
  return exists(select 1 from public.modules m where m.id=a.module_id and public.has_paid_audience_month('assessment',p_assessment_id,m.year,m.month));
end $$;

create or replace function public.can_start_assessment(p_assessment_id uuid)
returns boolean language plpgsql stable security definer set search_path='' as $$
declare a public.assessments%rowtype;
begin
  if not public.can_access_assessment(p_assessment_id) then return false; end if;
  select * into a from public.assessments where id=p_assessment_id;
  if not found then return false; end if;
  if a.timing='strict' and (a.starts_at is null or a.ends_at is null or now()<a.starts_at or now()>=a.ends_at) then return false; end if;
  return true;
end $$;

-- Student-safe write: the NIC may be added once, but never edited by the student afterwards.
create or replace function public.add_my_nic(p_nic text)
returns boolean language plpgsql security definer set search_path='' as $$
declare clean_nic text := upper(trim(p_nic));
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if clean_nic !~ '^(\d{9}[VX]|\d{12})$' then raise exception 'Invalid Sri Lankan NIC number'; end if;
  update public.profiles set nic=clean_nic where id=auth.uid() and nic is null;
  return found;
exception when unique_violation then
  raise exception 'This NIC is already linked to another account';
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
    'batchIds',coalesce((select jsonb_agg(distinct e.batch_id) filter (where e.batch_id is not null) from public.enrollments e where e.student_id=p.id and e.status='active'),'[]'::jsonb)
  )
  from public.profiles p where p.id=auth.uid();
$$;

create or replace function public.program_json(p public.programs)
returns jsonb language sql immutable set search_path='' as $$
  select jsonb_build_object(
    'id',p.id,'slug',p.slug,'name',p.name,'shortName',p.short_name,
    'description',p.description,'academicLevel',p.academic_level,'examYear',p.exam_year,
    'medium',p.mediums,'image',coalesce(p.cover_image_url,'/ol-theory-poster.jpg'),
    'isPublic',p.is_public,'registrationOpen',p.registration_open,'isActive',p.is_active
  );
$$;

create or replace function public.batch_json(b public.batches)
returns jsonb language sql immutable set search_path='' as $$
  select jsonb_build_object('id',b.id,'programId',b.program_id,'name',b.name,'description',b.description,'isActive',b.is_active);
$$;

create or replace function public.resource_json(r public.resources)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'id',r.id,'moduleId',r.module_id,'title',r.title,'description',r.description,
    'fileName',r.file_name,'fileUrl','/api/resources/'||r.id::text||'/download',
    'fileType',r.file_type,'access',r.access_type,'publishedAt',r.published_at,'isPublished',r.is_published,
    'programIds',coalesce((select jsonb_agg(ca.program_id) from public.content_audiences ca where ca.content_type='resource' and ca.content_id=r.id and ca.program_id is not null),'[]'::jsonb),
    'batchIds',coalesce((select jsonb_agg(ca.batch_id) from public.content_audiences ca where ca.content_type='resource' and ca.content_id=r.id and ca.batch_id is not null),'[]'::jsonb),
    'isUnlocked',public.can_access_resource(r.id)
  );
$$;

create or replace function public.recording_json(r public.recordings)
returns jsonb language sql immutable set search_path='' as $$
  select jsonb_build_object(
    'id',r.id,'moduleId',r.module_id,'title',r.title,'description',r.description,
    'videoUrl',r.video_url,'publishedAt',r.published_at,'access',r.access_type,'duration',r.duration_label,'isPublished',r.is_published
  );
$$;

create or replace function public.module_json(m public.modules)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'id',m.id,'programId',m.program_id,'batchId',m.batch_id,'title',m.title,
    'month',m.month,'year',m.year,'access',m.access_type,'status',m.status,
    'opensAt',m.opens_at,'closesAt',m.closes_at,
    'recordings',coalesce((select jsonb_agg(public.recording_json(r) order by r.published_at desc) from public.recordings r where r.module_id=m.id and (r.is_published or public.is_admin()) and public.can_access_recording(r.id)),'[]'::jsonb),
    'resources',coalesce((select jsonb_agg(public.resource_json(r) order by r.published_at desc) from public.resources r where r.module_id=m.id and (r.is_published or public.is_admin()) and public.can_access_resource(r.id)),'[]'::jsonb),
    'assessmentIds',coalesce((select jsonb_agg(a.id order by a.created_at desc) from public.assessments a where a.module_id=m.id and a.status='published' and public.can_access_assessment(a.id)),'[]'::jsonb),
    'isUnlocked',public.can_access_module(m.id)
  );
$$;

create or replace function public.assessment_json(a public.assessments,p_include_questions boolean default false,p_include_keys boolean default false)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'id',a.id,'moduleId',a.module_id,'title',a.title,'description',a.description,'instructions',a.instructions,
    'delivery',a.delivery,'timing',a.timing,'source',a.source,'status',a.status,
    'durationMinutes',a.duration_minutes,'startsAt',a.starts_at,'endsAt',a.ends_at,'maxAttempts',a.max_attempts,
    'shuffleQuestions',a.shuffle_questions,'shuffleOptions',a.shuffle_options,
    'showAnswers',a.show_answers,'showResults',a.show_results,'access',a.access_type,'totalMarks',a.total_marks,
    'programIds',coalesce((select jsonb_agg(ca.program_id) from public.content_audiences ca where ca.content_type='assessment' and ca.content_id=a.id and ca.program_id is not null),'[]'::jsonb),
    'batchIds',coalesce((select jsonb_agg(ca.batch_id) from public.content_audiences ca where ca.content_type='assessment' and ca.content_id=a.id and ca.batch_id is not null),'[]'::jsonb),
    'studentIds',coalesce((select jsonb_agg(ca.student_id) from public.content_audiences ca where ca.content_type='assessment' and ca.content_id=a.id and ca.student_id is not null),'[]'::jsonb),
    'isUnlocked',public.can_start_assessment(a.id),
    'questions',case when p_include_questions then coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id',q.id,'type',q.type,'prompt',q.prompt,
          'marks',coalesce(aq.marks_override,q.marks),'imageUrl',q.image_url,
          'options',coalesce((select jsonb_agg(jsonb_build_object('id',qo.id,'key',qo.option_key,'text',qo.option_text) order by qo.sort_order) from public.question_options qo where qo.question_id=q.id),'[]'::jsonb)
        ) || case when p_include_keys then jsonb_build_object('correctAnswer',qk.correct_answer,'explanation',coalesce(qk.explanation,qk.marking_guidance)) else '{}'::jsonb end
        order by aq.sort_order
      )
      from public.assessment_questions aq
      join public.questions q on q.id=aq.question_id
      left join public.question_keys qk on qk.question_id=q.id
      where aq.assessment_id=a.id
    ),'[]'::jsonb) else '[]'::jsonb end
  );
$$;

create or replace function public.result_json(r public.results)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'id',r.id,'assessmentId',r.assessment_id,'assessmentTitle',a.title,'studentId',r.student_id,
    'obtainedMarks',r.obtained_marks,'totalMarks',r.total_marks,'percentage',r.percentage,
    'source',a.source,'completedAt',r.completed_at,'status',r.status,
    'mcqMarks',r.mcq_marks,'structuredMarks',r.structured_marks,'feedback',r.feedback
  ) from public.assessments a where a.id=r.assessment_id;
$$;

create or replace function public.payment_json(p public.payments)
returns jsonb language sql immutable set search_path='' as $$
  select jsonb_build_object(
    'id',p.id,'studentId',p.student_id,'programId',p.program_id,'batchId',p.batch_id,
    'billingMonth',to_char(p.billing_month,'YYYY-MM'),'amount',p.amount,'status',p.status,
    'paidAt',p.paid_at,'notes',p.notes
  );
$$;

create or replace function public.get_student_dashboard()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare output jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select jsonb_build_object(
    'student',public.get_my_profile(),
    'programs',coalesce((select jsonb_agg(public.program_json(p) order by p.sort_order,p.name) from public.programs p where p.id in (select e.program_id from public.enrollments e where e.student_id=auth.uid() and e.status='active')),'[]'::jsonb),
    'modules',coalesce((select jsonb_agg(public.module_json(m) order by m.year desc,m.month desc) from public.modules m where m.status in ('published','upcoming') and ((m.access_type='free' and (not public.content_has_audience('module',m.id) or public.matches_audience('module',m.id))) or public.matches_audience('module',m.id) or public.has_active_enrollment(m.program_id,m.batch_id) or public.has_override('module',m.id))),'[]'::jsonb),
    'resources',coalesce((select jsonb_agg(public.resource_json(r) order by r.published_at desc) from public.resources r left join public.modules m on m.id=r.module_id where r.is_published and ((r.access_type='free' and (not public.content_has_audience('resource',r.id) or public.matches_audience('resource',r.id))) or public.matches_audience('resource',r.id) or public.has_override('resource',r.id) or (m.id is not null and (public.matches_audience('module',m.id) or public.has_active_enrollment(m.program_id,m.batch_id))))),'[]'::jsonb),
    'assessments',coalesce((select jsonb_agg(public.assessment_json(a,false,false) order by coalesce(a.starts_at,a.created_at) desc) from public.assessments a where a.status='published' and ((a.access_type='free' and not public.content_has_audience('assessment',a.id)) or public.matches_audience('assessment',a.id) or public.has_override('assessment',a.id))),'[]'::jsonb),
    'results',coalesce((select jsonb_agg(public.result_json(r) order by r.completed_at asc) from public.results r where r.student_id=auth.uid() and r.status='published'),'[]'::jsonb),
    'payments',coalesce((select jsonb_agg(public.payment_json(p) order by p.billing_month desc) from public.payments p where p.student_id=auth.uid()),'[]'::jsonb)
  ) into output;
  return output;
end $$;

create or replace function public.get_assessment_for_student(p_assessment_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare a public.assessments%rowtype;
begin
  if not public.can_start_assessment(p_assessment_id) then return null; end if;
  select * into a from public.assessments where id=p_assessment_id;
  if not found then return null; end if;
  -- Questions are deliberately withheld until an attempt has been created.
  -- This prevents inspecting the RSC/RPC payload without consuming an attempt.
  return public.assessment_json(a,false,false);
end $$;

create or replace function public.get_started_assessment(p_attempt_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare output jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select jsonb_build_object(
    'assessment',public.assessment_json(a,true,false),
    'savedAnswers',coalesce((
      select jsonb_object_agg(ans.question_id::text,ans.answer_payload)
      from public.answers ans where ans.attempt_id=att.id and ans.answer_payload is not null
    ),'{}'::jsonb),
    'flagged',coalesce((
      select jsonb_agg(ans.question_id::text)
      from public.answers ans where ans.attempt_id=att.id and ans.is_flagged
    ),'[]'::jsonb)
  ) into output
  from public.attempts att
  join public.assessments a on a.id=att.assessment_id
  where att.id=p_attempt_id
    and att.student_id=auth.uid()
    and att.status='in_progress'
    and (att.deadline_at is null or now()<att.deadline_at)
    and public.can_start_assessment(a.id);
  return output;
end $$;

create or replace function public.save_assessment_answers(
  p_attempt_id uuid,
  p_answers jsonb,
  p_flagged jsonb default '[]'::jsonb
)
returns boolean language plpgsql security definer set search_path='' as $$
declare
  att public.attempts%rowtype;
  question_row record;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into att from public.attempts
  where id=p_attempt_id and student_id=auth.uid() for update;
  if not found or att.status<>'in_progress' then raise exception 'Active attempt not found'; end if;
  if att.deadline_at is not null and now()>=att.deadline_at then raise exception 'The submission window has closed'; end if;

  for question_row in
    select aq.question_id
    from public.assessment_questions aq
    where aq.assessment_id=att.assessment_id
  loop
    if p_answers ? question_row.question_id::text or p_flagged ? question_row.question_id::text then
      insert into public.answers(attempt_id,question_id,answer_payload,is_flagged)
      values(
        p_attempt_id,
        question_row.question_id,
        p_answers->question_row.question_id::text,
        p_flagged ? question_row.question_id::text
      )
      on conflict(attempt_id,question_id) do update set
        answer_payload=excluded.answer_payload,
        is_flagged=excluded.is_flagged;
    end if;
  end loop;
  return true;
end $$;

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
      'requestedProgramId',p.requested_program_id,'requestedBatchId',p.requested_batch_id,'requestedProgramStatus',p.requested_program_status,
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

create or replace function public.get_admin_dashboard_summary()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare output jsonb;
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  select jsonb_build_object(
    'stats',jsonb_build_object(
      'students',(select count(*) from public.profiles where role='student'),
      'verified',(select count(*) from public.profiles where role='student' and account_status='verified'),
      'pending',(select count(*) from public.profiles where role='student' and account_status='pending'),
      'publishedModules',(select count(*) from public.modules where status='published'),
      'programs',(select count(*) from public.programs where is_active),
      'paidThisMonth',(select count(*) from public.payments where billing_month=date_trunc('month',now() at time zone 'Asia/Colombo')::date and status in ('paid','waived'))
    ),
    'pendingStudents',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',s.id,'fullName',concat_ws(' ',s.first_name,s.last_name),
        'initials',upper(left(s.first_name,1)||left(s.last_name,1)),
        'school',s.school,'medium',s.medium,'createdAt',s.created_at
      ) order by s.created_at desc)
      from (
        select id,first_name,last_name,school,medium,created_at
        from public.profiles
        where role='student' and account_status='pending'
        order by created_at desc limit 5
      ) s
    ),'[]'::jsonb),
    'recentResults',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',r.id,'assessmentTitle',r.assessment_title,'studentName',r.student_name,
        'percentage',r.percentage,'completedAt',r.completed_at
      ) order by r.completed_at desc)
      from (
        select result.id,a.title as assessment_title,
          concat_ws(' ',p.first_name,p.last_name) as student_name,
          result.percentage,result.completed_at
        from public.results result
        join public.assessments a on a.id=result.assessment_id
        join public.profiles p on p.id=result.student_id
        where result.status='published'
        order by result.completed_at desc limit 5
      ) r
    ),'[]'::jsonb)
  ) into output;
  return output;
end $$;

create or replace function public.create_assessment_bundle(p_payload jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare
  assessment_id uuid;
  question_id uuid;
  item jsonb;
  option_item jsonb;
  program_item text;
  batch_item text;
  student_item text;
  question_order integer := 0;
  option_order integer;
  computed_total numeric := 0;
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  if coalesce(trim(p_payload->>'title'),'')='' then raise exception 'Assessment title is required'; end if;
  if coalesce(p_payload->>'delivery','online')='online' and coalesce(p_payload->>'timing','flexible')='flexible' and nullif(p_payload->>'durationMinutes','') is null then
    raise exception 'Flexible online assessments require a duration';
  end if;
  if coalesce(p_payload->>'delivery','online')='online' and coalesce(p_payload->>'timing','flexible')='strict'
     and (nullif(p_payload->>'startsAt','') is null or nullif(p_payload->>'endsAt','') is null) then
    raise exception 'Strict online assessments require both a start and end time';
  end if;
  if coalesce(p_payload->>'access','paid')='paid' and nullif(p_payload->>'moduleId','') is null then
    raise exception 'Paid assessments must belong to a monthly module';
  end if;

  insert into public.assessments(
    module_id,owner_id,title,description,instructions,delivery,timing,source,status,duration_minutes,
    starts_at,ends_at,max_attempts,shuffle_questions,shuffle_options,show_answers,show_results,access_type,total_marks
  ) values (
    nullif(p_payload->>'moduleId','')::uuid,auth.uid(),trim(p_payload->>'title'),coalesce(p_payload->>'description',''),
    coalesce(p_payload->>'instructions',''),coalesce((p_payload->>'delivery')::public.assessment_delivery,'online'),
    coalesce((p_payload->>'timing')::public.assessment_timing,'flexible'),coalesce((p_payload->>'source')::public.assessment_source,'smart_ict'),
    coalesce((p_payload->>'status')::public.assessment_status,'draft'),nullif(p_payload->>'durationMinutes','')::integer,nullif(p_payload->>'startsAt','')::timestamptz,
    nullif(p_payload->>'endsAt','')::timestamptz,coalesce((p_payload->>'maxAttempts')::integer,1),
    coalesce((p_payload->>'shuffleQuestions')::boolean,false),coalesce((p_payload->>'shuffleOptions')::boolean,false),
    coalesce((p_payload->>'showAnswers')::boolean,false),coalesce((p_payload->>'showResults')::boolean,true),
    coalesce((p_payload->>'access')::public.access_type,'paid'),coalesce((p_payload->>'totalMarks')::numeric,0)
  ) returning id into assessment_id;

  for program_item in select jsonb_array_elements_text(coalesce(p_payload->'programIds','[]'::jsonb)) loop
    insert into public.content_audiences(content_type,content_id,program_id) values('assessment',assessment_id,program_item::uuid) on conflict do nothing;
  end loop;
  for batch_item in select jsonb_array_elements_text(coalesce(p_payload->'batchIds','[]'::jsonb)) loop
    insert into public.content_audiences(content_type,content_id,batch_id) values('assessment',assessment_id,batch_item::uuid) on conflict do nothing;
  end loop;
  for student_item in select jsonb_array_elements_text(coalesce(p_payload->'studentIds','[]'::jsonb)) loop
    insert into public.content_audiences(content_type,content_id,student_id) values('assessment',assessment_id,student_item::uuid) on conflict do nothing;
  end loop;

  for item in select value from jsonb_array_elements(coalesce(p_payload->'questions','[]'::jsonb)) loop
    question_order := question_order + 1;
    insert into public.questions(owner_id,type,prompt,marks,image_url)
    values(auth.uid(),(item->>'type')::public.question_type,trim(item->>'prompt'),coalesce((item->>'marks')::numeric,1),nullif(trim(item->>'imageUrl'),''))
    returning id into question_id;

    insert into public.question_keys(question_id,correct_answer,explanation,marking_guidance)
    values(question_id,item->'correctAnswer',nullif(item->>'explanation',''),case when item->>'type'='structured' then nullif(item->>'explanation','') else null end);

    option_order := 0;
    for option_item in select value from jsonb_array_elements(coalesce(item->'options','[]'::jsonb)) loop
      option_order := option_order + 1;
      insert into public.question_options(question_id,option_key,option_text,sort_order)
      values(question_id,option_item->>'key',coalesce(option_item->>'text',option_item->>'key'),option_order);
    end loop;

    insert into public.assessment_questions(assessment_id,question_id,sort_order) values(assessment_id,question_id,question_order);
    computed_total := computed_total + coalesce((item->>'marks')::numeric,1);
  end loop;

  if computed_total > 0 then update public.assessments set total_marks=computed_total where id=assessment_id; end if;
  return assessment_id;
end $$;

create or replace function public.start_assessment_attempt(p_assessment_id uuid)
returns public.attempts language plpgsql security definer set search_path='' as $$
declare
  a public.assessments%rowtype;
  existing public.attempts%rowtype;
  created public.attempts%rowtype;
  used_attempts integer;
  deadline timestamptz;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not public.can_start_assessment(p_assessment_id) then raise exception 'This assessment is not available to your account'; end if;
  select * into a from public.assessments where id=p_assessment_id;
  if a.delivery <> 'online' then raise exception 'This is an offline assessment'; end if;
  if a.starts_at is not null and now() < a.starts_at then raise exception 'This assessment has not opened yet'; end if;
  if a.ends_at is not null and now() >= a.ends_at then raise exception 'This assessment has closed'; end if;

  select * into existing from public.attempts
  where assessment_id=p_assessment_id and student_id=auth.uid() and status='in_progress'
  order by attempt_number desc limit 1;
  if found and (existing.deadline_at is null or existing.deadline_at > now()) then return existing; end if;

  select count(*) into used_attempts from public.attempts where assessment_id=p_assessment_id and student_id=auth.uid();
  if used_attempts >= a.max_attempts then raise exception 'Maximum attempts reached'; end if;

  if a.duration_minutes is not null then deadline := now() + make_interval(mins=>a.duration_minutes); end if;
  if a.ends_at is not null and (deadline is null or a.ends_at < deadline) then deadline := a.ends_at; end if;

  insert into public.attempts(assessment_id,student_id,attempt_number,deadline_at,max_score)
  values(p_assessment_id,auth.uid(),used_attempts+1,deadline,a.total_marks)
  returning * into created;
  return created;
end $$;

create or replace function public.submit_assessment_attempt(
  p_attempt_id uuid,
  p_answers jsonb,
  p_flagged jsonb default '[]'::jsonb,
  p_auto_submitted boolean default false
)
returns uuid language plpgsql security definer set search_path='' as $$
declare
  att public.attempts%rowtype;
  a public.assessments%rowtype;
  row_item record;
  submitted jsonb;
  correct jsonb;
  awarded numeric;
  correct_bool boolean;
  total_score numeric := 0;
  objective_score numeric := 0;
  needs_manual boolean := false;
  result_id uuid;
  result_state public.result_status;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into att from public.attempts where id=p_attempt_id and student_id=auth.uid() for update;
  if not found then raise exception 'Attempt not found'; end if;
  if att.status <> 'in_progress' then
    select id into result_id from public.results where attempt_id=p_attempt_id limit 1;
    if result_id is not null then return result_id; end if;
    raise exception 'This attempt has already been submitted';
  end if;
  if att.deadline_at is not null and now() >= att.deadline_at then
    raise exception 'The submission window has closed';
  end if;
  select * into a from public.assessments where id=att.assessment_id;

  for row_item in
    select q.*,coalesce(aq.marks_override,q.marks) as effective_marks,qk.correct_answer
    from public.assessment_questions aq
    join public.questions q on q.id=aq.question_id
    left join public.question_keys qk on qk.question_id=q.id
    where aq.assessment_id=att.assessment_id order by aq.sort_order
  loop
    submitted := p_answers -> row_item.id::text;
    correct := row_item.correct_answer;
    awarded := null;
    correct_bool := null;

    if row_item.type='structured' then
      needs_manual := true;
    elsif row_item.type='multiple_choice' then
      correct_bool := coalesce((select array_agg(value order by value) from jsonb_array_elements_text(coalesce(submitted,'[]'::jsonb))) = (select array_agg(value order by value) from jsonb_array_elements_text(coalesce(correct,'[]'::jsonb))),false);
      awarded := case when correct_bool then row_item.effective_marks else 0 end;
    else
      correct_bool := lower(trim(coalesce(submitted #>> '{}',''))) = lower(trim(coalesce(correct #>> '{}',''))) and coalesce(correct #>> '{}','')<>'';
      awarded := case when correct_bool then row_item.effective_marks else 0 end;
    end if;

    insert into public.answers(attempt_id,question_id,answer_payload,is_flagged,is_correct,awarded_marks,marked_at)
    values(p_attempt_id,row_item.id,submitted,coalesce(p_flagged ? row_item.id::text,false),correct_bool,awarded,case when awarded is null then null else now() end)
    on conflict(attempt_id,question_id) do update set answer_payload=excluded.answer_payload,is_flagged=excluded.is_flagged,is_correct=excluded.is_correct,awarded_marks=excluded.awarded_marks,marked_at=excluded.marked_at;

    if awarded is not null then total_score := total_score + awarded; objective_score := objective_score + awarded; end if;
  end loop;

  update public.attempts set
    status=case when needs_manual then 'awaiting_manual'::public.attempt_status else 'graded'::public.attempt_status end,
    submitted_at=now(),auto_submitted=p_auto_submitted,score=total_score,max_score=a.total_marks,
    percentage=case when a.total_marks>0 then round((total_score/a.total_marks)*100,2) else 0 end
  where id=p_attempt_id;

  result_state := case when needs_manual or not a.show_results then 'pending'::public.result_status else 'published'::public.result_status end;
  insert into public.results(assessment_id,student_id,attempt_id,obtained_marks,total_marks,status,mcq_marks,completed_at,published_at)
  values(a.id,auth.uid(),p_attempt_id,total_score,a.total_marks,result_state,objective_score,now(),case when result_state='published' then now() else null end)
  returning id into result_id;
  return result_id;
end $$;

create or replace function public.import_offline_results(p_assessment_id uuid,p_rows jsonb)
returns integer language plpgsql security definer set search_path='' as $$
declare
  a public.assessments%rowtype;
  row_item jsonb;
  student_uuid uuid;
  imported integer := 0;
  normalized_phone text;
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  select * into a from public.assessments where id=p_assessment_id;
  if not found or a.delivery<>'offline' then raise exception 'Select a valid offline assessment'; end if;
  for row_item in select value from jsonb_array_elements(coalesce(p_rows,'[]'::jsonb)) loop
    normalized_phone := regexp_replace(coalesce(row_item->>'student_phone',''),'\D','','g');
    if normalized_phone like '0%' then normalized_phone := '94'||substr(normalized_phone,2); end if;
    select id into student_uuid from public.profiles where contact_number=normalized_phone and role='student';
    if student_uuid is null then raise exception 'No student found for phone %',row_item->>'student_phone'; end if;
    insert into public.results(assessment_id,student_id,obtained_marks,total_marks,status,mcq_marks,structured_marks,feedback,completed_at,published_at)
    values(p_assessment_id,student_uuid,(row_item->>'obtained_marks')::numeric,(row_item->>'total_marks')::numeric,'published',nullif(row_item->>'mcq_marks','')::numeric,nullif(row_item->>'structured_marks','')::numeric,nullif(row_item->>'feedback',''),coalesce(nullif(row_item->>'completed_at','')::timestamptz,now()),now())
    on conflict (assessment_id,student_id) where attempt_id is null do update set
      obtained_marks=excluded.obtained_marks,total_marks=excluded.total_marks,status='published',
      mcq_marks=excluded.mcq_marks,structured_marks=excluded.structured_marks,feedback=excluded.feedback,
      completed_at=excluded.completed_at,published_at=now();
    imported := imported+1;
  end loop;
  return imported;
end $$;

-- Row-level security
alter table public.profiles enable row level security;
alter table public.programs enable row level security;
alter table public.batches enable row level security;
alter table public.enrollments enable row level security;
alter table public.modules enable row level security;
alter table public.recordings enable row level security;
alter table public.resources enable row level security;
alter table public.assessments enable row level security;
alter table public.content_audiences enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.question_keys enable row level security;
alter table public.assessment_questions enable row level security;
alter table public.attempts enable row level security;
alter table public.answers enable row level security;
alter table public.results enable row level security;
alter table public.payments enable row level security;
alter table public.access_overrides enable row level security;
alter table public.testimonials enable row level security;
alter table public.support_requests enable row level security;
alter table public.site_content enable row level security;

create policy profiles_read_own_or_admin on public.profiles for select to authenticated using (id=(select auth.uid()) or public.is_admin());
create policy profiles_admin_update on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy programs_anon_read on public.programs for select to anon using (is_public);
create policy programs_authenticated_read on public.programs for select to authenticated using (is_public or public.is_admin());
create policy programs_admin_all on public.programs for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy batches_anon_read on public.batches for select to anon using (
  is_active and exists(
    select 1 from public.programs p
    where p.id=batches.program_id and p.is_public and p.is_active and p.registration_open
  )
);
create policy batches_authenticated_read on public.batches for select to authenticated using (is_active or public.is_admin());
create policy batches_admin_all on public.batches for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy enrollments_own_read on public.enrollments for select to authenticated using (student_id=(select auth.uid()) or public.is_admin());
create policy enrollments_admin_all on public.enrollments for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy modules_access_read on public.modules for select to authenticated using (public.can_access_module(id));
create policy modules_admin_all on public.modules for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy recordings_access_read on public.recordings for select to authenticated using (public.can_access_recording(id));
create policy recordings_admin_all on public.recordings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy resources_access_read on public.resources for select to authenticated using (public.can_access_resource(id));
create policy resources_admin_all on public.resources for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy assessments_access_read on public.assessments for select to authenticated using (public.can_access_assessment(id));
create policy assessments_admin_all on public.assessments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy audiences_admin_read_write on public.content_audiences for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy questions_access_read on public.questions for select to authenticated using (public.is_admin() or exists(select 1 from public.assessment_questions aq where aq.question_id=public.questions.id and public.can_access_assessment(aq.assessment_id)));
create policy questions_admin_all on public.questions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy question_options_access_read on public.question_options for select to authenticated using (public.is_admin() or exists(select 1 from public.assessment_questions aq where aq.question_id=public.question_options.question_id and public.can_access_assessment(aq.assessment_id)));
create policy question_options_admin_all on public.question_options for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy question_keys_admin_only on public.question_keys for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy assessment_questions_access_read on public.assessment_questions for select to authenticated using (public.is_admin() or public.can_access_assessment(assessment_id));
create policy assessment_questions_admin_all on public.assessment_questions for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy attempts_own_read on public.attempts for select to authenticated using (student_id=(select auth.uid()) or public.is_admin());
create policy attempts_admin_all on public.attempts for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy answers_own_read on public.answers for select to authenticated using (public.is_admin() or exists(select 1 from public.attempts a where a.id=public.answers.attempt_id and a.student_id=(select auth.uid())));
create policy answers_admin_all on public.answers for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy results_own_read on public.results for select to authenticated using ((student_id=(select auth.uid()) and status='published') or public.is_admin());
create policy results_admin_all on public.results for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy payments_own_read on public.payments for select to authenticated using (student_id=(select auth.uid()) or public.is_admin());
create policy payments_admin_all on public.payments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy overrides_admin_all on public.access_overrides for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy testimonials_anon_read on public.testimonials for select to anon using (is_published);
create policy testimonials_authenticated_read on public.testimonials for select to authenticated using (is_published or public.is_admin());
create policy testimonials_admin_all on public.testimonials for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy support_anon_insert on public.support_requests for insert to anon with check (student_id is null);
create policy support_student_insert on public.support_requests for insert to authenticated with check (student_id is null or student_id=(select auth.uid()));
create policy support_own_read on public.support_requests for select to authenticated using (student_id=(select auth.uid()) or public.is_admin());
create policy support_admin_all on public.support_requests for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy site_content_anon_read on public.site_content for select to anon using (is_public);
create policy site_content_authenticated_read on public.site_content for select to authenticated using (
  is_public or public.is_admin() or content_key in ('bank_name','bank_branch','bank_account_name','bank_account_number')
);
create policy site_content_admin_all on public.site_content for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Private resource storage. Files are delivered through short-lived signed URLs from the server route.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('resources','resources',false,52428800,array['application/pdf','image/png','image/jpeg','image/webp','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/zip'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy resource_storage_admin_insert on storage.objects for insert to authenticated with check (bucket_id='resources' and public.is_admin());
create policy resource_storage_admin_update on storage.objects for update to authenticated using (bucket_id='resources' and public.is_admin()) with check (bucket_id='resources' and public.is_admin());
create policy resource_storage_admin_delete on storage.objects for delete to authenticated using (bucket_id='resources' and public.is_admin());
create policy resource_storage_admin_read on storage.objects for select to authenticated using (bucket_id='resources' and public.is_admin());

revoke all on function public.get_admin_workspace() from public;
revoke all on function public.get_admin_dashboard_summary() from public,anon;
revoke all on function public.create_assessment_bundle(jsonb) from public;
revoke all on function public.import_offline_results(uuid,jsonb) from public;
grant execute on function public.get_my_profile() to authenticated;
grant execute on function public.get_student_dashboard() to authenticated;
grant execute on function public.get_assessment_for_student(uuid) to authenticated;
grant execute on function public.get_started_assessment(uuid) to authenticated;
grant execute on function public.save_assessment_answers(uuid,jsonb,jsonb) to authenticated;
grant execute on function public.add_my_nic(text) to authenticated;
grant execute on function public.start_assessment_attempt(uuid) to authenticated;
grant execute on function public.submit_assessment_attempt(uuid,jsonb,jsonb,boolean) to authenticated;
grant execute on function public.get_admin_workspace() to authenticated;
grant execute on function public.get_admin_dashboard_summary() to authenticated;
grant execute on function public.create_assessment_bundle(jsonb) to authenticated;
grant execute on function public.import_offline_results(uuid,jsonb) to authenticated;

-- Manual marking workflow for structured online answers.
create or replace function public.get_manual_review(p_result_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare output jsonb;
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  select jsonb_build_object(
    'result',public.result_json(r),
    'student',jsonb_build_object('id',p.id,'fullName',concat_ws(' ',p.first_name,p.last_name),'phone',p.contact_number,'school',p.school),
    'assessment',jsonb_build_object('id',a.id,'title',a.title,'totalMarks',a.total_marks),
    'answers',coalesce((
      select jsonb_agg(jsonb_build_object(
        'answerId',ans.id,'questionId',q.id,'prompt',q.prompt,'type',q.type,
        'maximumMarks',coalesce(aq.marks_override,q.marks),'submittedAnswer',ans.answer_payload,
        'awardedMarks',ans.awarded_marks,'markingGuidance',coalesce(qk.marking_guidance,qk.explanation),
        'isCorrect',ans.is_correct
      ) order by aq.sort_order)
      from public.answers ans
      join public.questions q on q.id=ans.question_id
      join public.assessment_questions aq on aq.question_id=q.id and aq.assessment_id=a.id
      left join public.question_keys qk on qk.question_id=q.id
      where ans.attempt_id=r.attempt_id
    ),'[]'::jsonb)
  ) into output
  from public.results r
  join public.assessments a on a.id=r.assessment_id
  join public.profiles p on p.id=r.student_id
  where r.id=p_result_id;
  return output;
end $$;

create or replace function public.publish_manual_result(p_result_id uuid,p_marks jsonb,p_feedback text default null)
returns boolean language plpgsql security definer set search_path='' as $$
declare
  r public.results%rowtype;
  mark_item record;
  max_mark numeric;
  final_score numeric;
  objective_score numeric;
  written_score numeric;
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  select * into r from public.results where id=p_result_id for update;
  if not found then raise exception 'Result not found'; end if;

  for mark_item in select key,value from jsonb_each_text(coalesce(p_marks,'{}'::jsonb)) loop
    select coalesce(aq.marks_override,q.marks) into max_mark
    from public.answers ans
    join public.questions q on q.id=ans.question_id
    join public.assessment_questions aq on aq.question_id=q.id and aq.assessment_id=r.assessment_id
    where ans.id=mark_item.key::uuid and ans.attempt_id=r.attempt_id;
    if max_mark is not null then
      update public.answers set
        awarded_marks=greatest(0,least(mark_item.value::numeric,max_mark)),
        marked_by=auth.uid(),marked_at=now()
      where id=mark_item.key::uuid and attempt_id=r.attempt_id;
    end if;
  end loop;

  select
    coalesce(sum(coalesce(ans.awarded_marks,0)),0),
    coalesce(sum(coalesce(ans.awarded_marks,0)) filter (where q.type in ('single_choice','multiple_choice','true_false','short_answer')),0),
    coalesce(sum(coalesce(ans.awarded_marks,0)) filter (where q.type='structured'),0)
  into final_score,objective_score,written_score
  from public.answers ans join public.questions q on q.id=ans.question_id
  where ans.attempt_id=r.attempt_id;

  update public.results set obtained_marks=final_score,mcq_marks=objective_score,structured_marks=written_score,
    feedback=nullif(trim(p_feedback),''),status='published',published_at=now()
  where id=p_result_id;

  if r.attempt_id is not null then
    update public.attempts set status='graded',score=final_score,max_score=r.total_marks,
      percentage=case when r.total_marks>0 then round((final_score/r.total_marks)*100,2) else 0 end
    where id=r.attempt_id;
  end if;
  return true;
end $$;

revoke all on function public.get_manual_review(uuid) from public;
revoke all on function public.publish_manual_result(uuid,jsonb,text) from public;
grant execute on function public.get_manual_review(uuid) to authenticated;
grant execute on function public.publish_manual_result(uuid,jsonb,text) to authenticated;

-- Explicit Data API privileges for new Supabase projects. New projects no
-- longer expose public-schema tables/functions automatically, so keep this
-- allowlist synchronized with the application instead of relying on defaults.
revoke all on all tables in schema public from anon,authenticated;
revoke execute on all functions in schema public from public,anon,authenticated;

grant usage on schema public to anon,authenticated,service_role;

grant select on public.programs,public.batches,public.testimonials,public.site_content to anon;
grant insert on public.support_requests to anon;

grant select on
  public.profiles,public.programs,public.batches,public.enrollments,
  public.modules,public.recordings,public.resources,public.assessments,
  public.content_audiences,public.payments,public.access_overrides,
  public.testimonials,public.support_requests,public.site_content
to authenticated;

grant insert,update,delete on
  public.programs,public.batches,public.enrollments,public.modules,
  public.recordings,public.resources,public.assessments,
  public.content_audiences,public.payments,public.access_overrides,
  public.testimonials,public.support_requests,public.site_content
to authenticated;
grant update on public.profiles to authenticated;

-- Assessment internals and results are RPC-only. In particular, answer keys
-- and strict-test questions cannot be queried directly through PostgREST.
revoke all on
  public.questions,public.question_options,public.question_keys,
  public.assessment_questions,public.attempts,public.answers,public.results
from anon,authenticated;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.can_access_module(uuid) to authenticated;
grant execute on function public.can_access_recording(uuid) to authenticated;
grant execute on function public.can_access_resource(uuid) to authenticated;
grant execute on function public.can_access_assessment(uuid) to authenticated;
grant execute on function public.can_start_assessment(uuid) to authenticated;
grant execute on function public.get_my_profile() to authenticated;
grant execute on function public.get_student_dashboard() to authenticated;
grant execute on function public.get_assessment_for_student(uuid) to authenticated;
grant execute on function public.get_started_assessment(uuid) to authenticated;
grant execute on function public.save_assessment_answers(uuid,jsonb,jsonb) to authenticated;
grant execute on function public.add_my_nic(text) to authenticated;
grant execute on function public.start_assessment_attempt(uuid) to authenticated;
grant execute on function public.submit_assessment_attempt(uuid,jsonb,jsonb,boolean) to authenticated;
grant execute on function public.get_admin_workspace() to authenticated;
grant execute on function public.create_assessment_bundle(jsonb) to authenticated;
grant execute on function public.import_offline_results(uuid,jsonb) to authenticated;
grant execute on function public.get_manual_review(uuid) to authenticated;
grant execute on function public.publish_manual_result(uuid,jsonb,text) to authenticated;

grant all privileges on all tables in schema public to service_role;
grant all privileges on all functions in schema public to service_role;

-- Admin lifecycle controls and no-code public website media.
+Wall time: 0.4 seconds
Output:
+-- Admin lifecycle controls and no-code public website media.

create or replace function public.update_assessment_bundle(p_assessment_id uuid, p_payload jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare
  current_assessment public.assessments%rowtype;
  attempt_count integer;
  old_question_ids uuid[];
  question_id uuid;
  item jsonb;
  option_item jsonb;
  program_item text;
  batch_item text;
  student_item text;
  question_order integer := 0;
  option_order integer;
  computed_total numeric := 0;
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;

  select * into current_assessment
  from public.assessments
  where id = p_assessment_id
  for update;
  if not found then raise exception 'Assessment not found'; end if;

  select count(*) into attempt_count
  from public.attempts
  where assessment_id = p_assessment_id;

  if attempt_count > 0 and current_assessment.delivery::text <> coalesce(p_payload->>'delivery', current_assessment.delivery::text) then
    raise exception 'Delivery type cannot change after a student attempt';
  end if;

  update public.assessments set
    module_id = nullif(p_payload->>'moduleId','')::uuid,
    title = trim(p_payload->>'title'),
    description = coalesce(p_payload->>'description',''),
    instructions = coalesce(p_payload->>'instructions',''),
    delivery = coalesce((p_payload->>'delivery')::public.assessment_delivery, current_assessment.delivery),
    timing = coalesce((p_payload->>'timing')::public.assessment_timing, current_assessment.timing),
    source = coalesce((p_payload->>'source')::public.assessment_source, current_assessment.source),
    status = coalesce((p_payload->>'status')::public.assessment_status, current_assessment.status),
    duration_minutes = nullif(p_payload->>'durationMinutes','')::integer,
    starts_at = nullif(p_payload->>'startsAt','')::timestamptz,
    ends_at = nullif(p_payload->>'endsAt','')::timestamptz,
    max_attempts = coalesce((p_payload->>'maxAttempts')::integer, current_assessment.max_attempts),
    shuffle_questions = coalesce((p_payload->>'shuffleQuestions')::boolean, false),
    shuffle_options = coalesce((p_payload->>'shuffleOptions')::boolean, false),
    show_answers = coalesce((p_payload->>'showAnswers')::boolean, false),
    show_results = coalesce((p_payload->>'showResults')::boolean, true),
    access_type = coalesce((p_payload->>'access')::public.access_type, current_assessment.access_type),
    total_marks = case
      when attempt_count = 0 and coalesce(p_payload->>'delivery', current_assessment.delivery::text) = 'offline'
        then coalesce((p_payload->>'totalMarks')::numeric, current_assessment.total_marks)
      else current_assessment.total_marks
    end
  where id = p_assessment_id;

  delete from public.content_audiences
  where content_type = 'assessment' and content_id = p_assessment_id;

  for program_item in select jsonb_array_elements_text(coalesce(p_payload->'programIds','[]'::jsonb)) loop
    insert into public.content_audiences(content_type,content_id,program_id)
    values('assessment',p_assessment_id,program_item::uuid) on conflict do nothing;
  end loop;
  for batch_item in select jsonb_array_elements_text(coalesce(p_payload->'batchIds','[]'::jsonb)) loop
    insert into public.content_audiences(content_type,content_id,batch_id)
    values('assessment',p_assessment_id,batch_item::uuid) on conflict do nothing;
  end loop;
  for student_item in select jsonb_array_elements_text(coalesce(p_payload->'studentIds','[]'::jsonb)) loop
    insert into public.content_audiences(content_type,content_id,student_id)
    values('assessment',p_assessment_id,student_item::uuid) on conflict do nothing;
  end loop;

  if attempt_count = 0 then
    select array_agg(aq.question_id) into old_question_ids
    from public.assessment_questions aq
    where aq.assessment_id = p_assessment_id;

    delete from public.assessment_questions where assessment_id = p_assessment_id;

    if old_question_ids is not null then
      delete from public.questions q
      where q.id = any(old_question_ids)
        and not exists(select 1 from public.assessment_questions aq where aq.question_id = q.id);
    end if;

    if coalesce(p_payload->>'delivery','online') = 'online' then
      for item in select value from jsonb_array_elements(coalesce(p_payload->'questions','[]'::jsonb)) loop
        question_order := question_order + 1;
        insert into public.questions(owner_id,type,prompt,marks,image_url)
        values(auth.uid(),(item->>'type')::public.question_type,trim(item->>'prompt'),coalesce((item->>'marks')::numeric,1),nullif(trim(item->>'imageUrl'),''))
        returning id into question_id;

        insert into public.question_keys(question_id,correct_answer,explanation,marking_guidance)
        values(question_id,item->'correctAnswer',nullif(item->>'explanation',''),case when item->>'type'='structured' then nullif(item->>'explanation','') else null end);

        option_order := 0;
        for option_item in select value from jsonb_array_elements(coalesce(item->'options','[]'::jsonb)) loop
          option_order := option_order + 1;
          insert into public.question_options(question_id,option_key,option_text,sort_order)
          values(question_id,option_item->>'key',coalesce(option_item->>'text',option_item->>'key'),option_order);
        end loop;

        insert into public.assessment_questions(assessment_id,question_id,sort_order)
        values(p_assessment_id,question_id,question_order);
        computed_total := computed_total + coalesce((item->>'marks')::numeric,1);
      end loop;

      if computed_total <= 0 then raise exception 'Online assessments need at least one valid question'; end if;
      update public.assessments set total_marks = computed_total where id = p_assessment_id;
    end if;
  end if;

  return p_assessment_id;
end $$;

revoke all on function public.update_assessment_bundle(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.update_assessment_bundle(uuid,jsonb) to authenticated;
grant all privileges on function public.update_assessment_bundle(uuid,jsonb) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('site-images','site-images',true,8388608,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists site_images_admin_insert on storage.objects;
drop policy if exists site_images_admin_update on storage.objects;
drop policy if exists site_images_admin_delete on storage.objects;
drop policy if exists site_images_admin_read on storage.objects;

create policy site_images_admin_insert on storage.objects
for insert to authenticated
with check (bucket_id='site-images' and public.is_admin());

create policy site_images_admin_update on storage.objects
for update to authenticated
using (bucket_id='site-images' and public.is_admin())
with check (bucket_id='site-images' and public.is_admin());

create policy site_images_admin_delete on storage.objects
for delete to authenticated
using (bucket_id='site-images' and public.is_admin());

create policy site_images_admin_read on storage.objects
for select to authenticated
using (bucket_id='site-images' and public.is_admin());

create or replace function public.update_result_admin(
  p_result_id uuid,
  p_obtained_marks numeric,
  p_total_marks numeric,
  p_feedback text,
  p_status text
) returns void language plpgsql security definer set search_path='' as $$
begin
  if not public.is_admin() then raise exception 'administrator access required'; end if;
  if p_total_marks <= 0 or p_obtained_marks < 0 or p_obtained_marks > p_total_marks then
    raise exception 'invalid marks';
  end if;
  if p_status not in ('pending','published') then raise exception 'invalid result status'; end if;
  update public.results set
    obtained_marks=p_obtained_marks,
    total_marks=p_total_marks,
    feedback=nullif(btrim(p_feedback),''),
    status=p_status::public.result_status,
    published_at=case when p_status='published' then coalesce(published_at,now()) else null end,
    updated_at=now()
  where id=p_result_id;
  if not found then raise exception 'result not found'; end if;
end;
$$;

create or replace function public.delete_result_admin(p_result_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not public.is_admin() then raise exception 'administrator access required'; end if;
  delete from public.results where id=p_result_id;
  if not found then raise exception 'result not found'; end if;
end;
$$;

revoke all on function public.update_result_admin(uuid,numeric,numeric,text,text) from public,anon;
revoke all on function public.delete_result_admin(uuid) from public,anon;
grant execute on function public.update_result_admin(uuid,numeric,numeric,text,text) to authenticated;
grant execute on function public.delete_result_admin(uuid) to authenticated;
grant all privileges on function public.update_result_admin(uuid,numeric,numeric,text,text) to service_role;
grant all privileges on function public.delete_result_admin(uuid) to service_role;

drop policy if exists resource_storage_student_read on storage.objects;
create policy resource_storage_student_read on storage.objects
for select to authenticated
using (
  bucket_id='resources'
  and exists (
    select 1 from public.resources
    where storage_path=storage.objects.name
      and public.can_access_resource(id)
  )
);

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
  update public.profiles set requested_program_id=p_program_id,requested_batch_id=p_batch_id,requested_program_status='approved',requested_program_reviewed_at=now(),requested_program_reviewed_by=auth.uid(),account_status='verified',verified_at=now()
  where id=p_student_id and role='student';
  update public.support_requests set status='resolved',admin_notes='Class request approved.'
  where student_id=p_student_id and request_type='account_verification' and status in ('open','in_progress');
  return true;
end $$;

revoke all on function public.review_student_program_request(uuid,text,uuid,uuid) from public,anon;
grant execute on function public.review_student_program_request(uuid,text,uuid,uuid) to authenticated;
