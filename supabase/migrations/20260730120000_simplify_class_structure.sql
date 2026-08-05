-- Smart ICT currently operates three concrete classes:
-- 2026 O/L - Revision, 2027 O/L - Theory and 2027 A/L - Revision.
-- Retire other combinations without deleting historical student or payment data.

create temporary table class_retirement_map (
  source_batch_id uuid primary key,
  target_batch_id uuid not null,
  target_program_id uuid not null
) on commit drop;

do $$
declare
  theory_program uuid;
  revision_program uuid;
  batch_2026_ol uuid;
  batch_2027_ol uuid;
  batch_2027_al uuid;
  class_2026_revision uuid;
  class_2027_theory uuid;
  class_2027_al_revision uuid;
begin
  select id into theory_program from public.programs where slug='theory';
  select id into revision_program from public.programs where slug='revision';
  select id into batch_2026_ol from public.academic_batches where name='2026 O/L';
  select id into batch_2027_ol from public.academic_batches where name='2027 O/L';
  select id into batch_2027_al from public.academic_batches where name='2027 A/L';

  if theory_program is null or revision_program is null
    or batch_2026_ol is null or batch_2027_ol is null or batch_2027_al is null then
    raise exception 'Required Smart ICT programs or academic batches are missing';
  end if;

  insert into public.batches(program_id,academic_batch_id,name,is_active,registration_open,sort_order)
  values
    (revision_program,batch_2026_ol,'2026 O/L',true,true,10),
    (theory_program,batch_2027_ol,'2027 O/L',true,true,20),
    (revision_program,batch_2027_al,'2027 A/L',true,true,30)
  on conflict(program_id,name) do update set
    academic_batch_id=excluded.academic_batch_id,
    is_active=true,
    registration_open=true,
    sort_order=excluded.sort_order;

  select id into class_2026_revision
  from public.batches where academic_batch_id=batch_2026_ol and program_id=revision_program;
  select id into class_2027_theory
  from public.batches where academic_batch_id=batch_2027_ol and program_id=theory_program;
  select id into class_2027_al_revision
  from public.batches where academic_batch_id=batch_2027_al and program_id=revision_program;

  insert into pg_temp.class_retirement_map(source_batch_id,target_batch_id,target_program_id)
  select b.id,
    case ab.name
      when '2026 O/L' then class_2026_revision
      when '2027 O/L' then class_2027_theory
      when '2027 A/L' then class_2027_al_revision
    end,
    case ab.name
      when '2026 O/L' then revision_program
      when '2027 O/L' then theory_program
      when '2027 A/L' then revision_program
    end
  from public.batches b
  join public.academic_batches ab on ab.id=b.academic_batch_id
  where ab.name in ('2026 O/L','2027 O/L','2027 A/L')
    and b.id not in (class_2026_revision,class_2027_theory,class_2027_al_revision);

  if exists (
    select 1
    from public.enrollments source
    join pg_temp.class_retirement_map map on map.source_batch_id=source.batch_id
    join public.enrollments target
      on target.student_id=source.student_id
     and target.program_id=map.target_program_id
     and target.batch_id=map.target_batch_id
  ) then
    raise exception 'Class retirement would create a duplicate enrolment';
  end if;

  if exists (
    select 1
    from public.payments source
    join pg_temp.class_retirement_map map on map.source_batch_id=source.batch_id
    join public.payments target
      on target.student_id=source.student_id
     and target.program_id=map.target_program_id
     and target.batch_id=map.target_batch_id
     and target.billing_month=source.billing_month
  ) then
    raise exception 'Class retirement would create a duplicate payment';
  end if;

  if exists (
    select 1
    from public.modules source
    join pg_temp.class_retirement_map map on map.source_batch_id=source.batch_id
    join public.modules target
      on target.program_id=map.target_program_id
     and target.batch_id=map.target_batch_id
     and target.year=source.year
     and target.month=source.month
  ) then
    raise exception 'Class retirement would create a duplicate monthly module';
  end if;

  update public.enrollments record
  set program_id=map.target_program_id,batch_id=map.target_batch_id
  from pg_temp.class_retirement_map map
  where record.batch_id=map.source_batch_id;

  update public.payments record
  set program_id=map.target_program_id,batch_id=map.target_batch_id,updated_at=now()
  from pg_temp.class_retirement_map map
  where record.batch_id=map.source_batch_id;

  update public.modules record
  set program_id=map.target_program_id,batch_id=map.target_batch_id,updated_at=now()
  from pg_temp.class_retirement_map map
  where record.batch_id=map.source_batch_id;

  update public.profiles profile
  set requested_program_id=map.target_program_id,requested_batch_id=map.target_batch_id
  from pg_temp.class_retirement_map map
  where profile.requested_batch_id=map.source_batch_id;

  insert into public.content_audiences(content_type,content_id,batch_id)
  select audience.content_type,audience.content_id,map.target_batch_id
  from public.content_audiences audience
  join pg_temp.class_retirement_map map on map.source_batch_id=audience.batch_id
  on conflict do nothing;

  delete from public.content_audiences audience
  using pg_temp.class_retirement_map map
  where audience.batch_id=map.source_batch_id;

  insert into public.content_audiences(content_type,content_id,program_id)
  select audience.content_type,audience.content_id,revision_program
  from public.content_audiences audience
  join public.programs program on program.id=audience.program_id
  where program.slug in ('paper','rapid-revision')
  on conflict do nothing;

  delete from public.content_audiences audience
  using public.programs program
  where audience.program_id=program.id
    and program.slug in ('paper','rapid-revision');

  update public.programs
  set is_active=(slug in ('theory','revision')),
      is_public=(slug in ('theory','revision')),
      registration_open=(slug in ('theory','revision')),
      sort_order=case slug when 'theory' then 10 when 'revision' then 20 else sort_order end,
      updated_at=now();

  update public.academic_batches
  set is_active=(name in ('2026 O/L','2027 O/L','2027 A/L')),
      sort_order=case name when '2026 O/L' then 10 when '2027 O/L' then 20 when '2027 A/L' then 30 else sort_order end,
      updated_at=now();

  update public.batches
  set is_active=(id in (class_2026_revision,class_2027_theory,class_2027_al_revision)),
      registration_open=(id in (class_2026_revision,class_2027_theory,class_2027_al_revision)),
      sort_order=case id
        when class_2026_revision then 10
        when class_2027_theory then 20
        when class_2027_al_revision then 30
        else sort_order
      end;
end $$;

create or replace function public.batch_json(b public.batches)
returns jsonb language sql stable set search_path='' as $$
  select jsonb_build_object(
    'id',b.id,'programId',b.program_id,'academicBatchId',b.academic_batch_id,
    'name',b.name,
    'className',b.name||' - '||(select p.name from public.programs p where p.id=b.program_id),
    'description',b.description,'registrationOpen',b.registration_open,
    'sortOrder',b.sort_order,'isActive',b.is_active
  );
$$;
