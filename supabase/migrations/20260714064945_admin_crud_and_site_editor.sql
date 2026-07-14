-- Admin lifecycle controls and no-code public website media.

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
