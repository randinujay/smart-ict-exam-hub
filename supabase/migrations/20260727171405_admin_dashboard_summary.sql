create index if not exists profiles_pending_students_created_idx
  on public.profiles(created_at desc)
  where role='student' and account_status='pending';

create index if not exists results_published_completed_idx
  on public.results(completed_at desc)
  where status='published';

create index if not exists payments_month_status_idx
  on public.payments(billing_month,status);

create or replace function public.get_admin_dashboard_summary()
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
        'id',s.id,
        'fullName',concat_ws(' ',s.first_name,s.last_name),
        'initials',upper(left(s.first_name,1)||left(s.last_name,1)),
        'school',s.school,
        'medium',s.medium,
        'createdAt',s.created_at
      ) order by s.created_at desc)
      from (
        select id,first_name,last_name,school,medium,created_at
        from public.profiles
        where role='student' and account_status='pending'
        order by created_at desc
        limit 5
      ) s
    ),'[]'::jsonb),
    'recentResults',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',r.id,
        'assessmentTitle',r.assessment_title,
        'studentName',r.student_name,
        'percentage',r.percentage,
        'completedAt',r.completed_at
      ) order by r.completed_at desc)
      from (
        select result.id,a.title as assessment_title,concat_ws(' ',p.first_name,p.last_name) as student_name,result.percentage,result.completed_at
        from public.results result
        join public.assessments a on a.id=result.assessment_id
        join public.profiles p on p.id=result.student_id
        where result.status='published'
        order by result.completed_at desc
        limit 5
      ) r
    ),'[]'::jsonb)
  ) into output;

  return output;
end;
$$;

revoke all on function public.get_admin_dashboard_summary() from public,anon;
grant execute on function public.get_admin_dashboard_summary() to authenticated;
