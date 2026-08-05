-- Assessments are targeted only through concrete Smart ICT classes.
-- Preserve existing reach by converting legacy student/program audiences
-- into their corresponding active class audiences before removing them.

insert into public.content_audiences(content_type,content_id,batch_id)
select distinct 'assessment',audience.content_id,enrollment.batch_id
from public.content_audiences audience
join public.enrollments enrollment
  on enrollment.student_id=audience.student_id
 and enrollment.status='active'
join public.batches class
  on class.id=enrollment.batch_id
 and class.is_active
where audience.content_type='assessment'
  and audience.student_id is not null
on conflict do nothing;

insert into public.content_audiences(content_type,content_id,batch_id)
select distinct 'assessment',audience.content_id,class.id
from public.content_audiences audience
join public.batches class
  on class.program_id=audience.program_id
 and class.is_active
where audience.content_type='assessment'
  and audience.program_id is not null
on conflict do nothing;

delete from public.content_audiences
where content_type='assessment'
  and (student_id is not null or program_id is not null);

create or replace function public.enforce_assessment_class_audience()
returns trigger
language plpgsql
set search_path=''
as $$
begin
  if new.content_type='assessment' then
    if new.batch_id is null or new.student_id is not null or new.program_id is not null then
      raise exception 'Assessment audiences must use classes only';
    end if;
    if not exists(
      select 1
      from public.batches class
      where class.id=new.batch_id and class.is_active
    ) then
      raise exception 'Select an active class';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_assessment_class_audience() from public,anon,authenticated;

drop trigger if exists enforce_assessment_class_audience_trigger on public.content_audiences;
create trigger enforce_assessment_class_audience_trigger
before insert or update on public.content_audiences
for each row execute function public.enforce_assessment_class_audience();

create or replace function public.get_admin_assessment(p_assessment_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  output jsonb;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  select jsonb_build_object(
    'assessment',public.assessment_json(assessment,true,true),
    'questionsLocked',exists(
      select 1
      from public.attempts attempt
      where attempt.assessment_id=assessment.id
    )
  )
  into output
  from public.assessments assessment
  where assessment.id=p_assessment_id;

  return output;
end;
$$;

revoke all on function public.get_admin_assessment(uuid) from public,anon;
grant execute on function public.get_admin_assessment(uuid) to authenticated;
grant all privileges on function public.get_admin_assessment(uuid) to service_role;
