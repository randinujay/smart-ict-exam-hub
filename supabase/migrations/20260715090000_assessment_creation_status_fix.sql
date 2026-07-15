-- Preserve the status selected in the admin assessment builder.
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
