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
