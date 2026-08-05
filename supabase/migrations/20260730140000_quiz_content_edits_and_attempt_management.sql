-- Keep published assessments editable without invalidating recorded attempts.
-- Once attempts exist, content corrections are allowed in place while grading
-- structure (question types, marks, answers and ordering) remains protected.

create or replace function public.update_assessment_bundle(p_assessment_id uuid, p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  current_assessment public.assessments%rowtype;
  attempt_count integer;
  old_question_ids uuid[];
  current_question_id uuid;
  item jsonb;
  option_item jsonb;
  program_item text;
  batch_item text;
  student_item text;
  question_order integer := 0;
  option_order integer;
  computed_total numeric := 0;
  existing_question_count integer;
  payload_question_count integer;
  existing_option_count integer;
  payload_option_count integer;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  select *
  into current_assessment
  from public.assessments
  where id=p_assessment_id
  for update;

  if not found then
    raise exception 'Assessment not found';
  end if;

  select count(*)
  into attempt_count
  from public.attempts
  where assessment_id=p_assessment_id;

  if attempt_count > 0
     and current_assessment.delivery::text <> coalesce(p_payload->>'delivery',current_assessment.delivery::text) then
    raise exception 'Delivery type cannot change after a student attempt';
  end if;

  update public.assessments
  set
    module_id=nullif(p_payload->>'moduleId','')::uuid,
    title=trim(p_payload->>'title'),
    description=coalesce(p_payload->>'description',''),
    instructions=coalesce(p_payload->>'instructions',''),
    delivery=coalesce((p_payload->>'delivery')::public.assessment_delivery,current_assessment.delivery),
    timing=coalesce((p_payload->>'timing')::public.assessment_timing,current_assessment.timing),
    source=coalesce((p_payload->>'source')::public.assessment_source,current_assessment.source),
    status=coalesce((p_payload->>'status')::public.assessment_status,current_assessment.status),
    duration_minutes=nullif(p_payload->>'durationMinutes','')::integer,
    starts_at=nullif(p_payload->>'startsAt','')::timestamptz,
    ends_at=nullif(p_payload->>'endsAt','')::timestamptz,
    max_attempts=coalesce((p_payload->>'maxAttempts')::integer,current_assessment.max_attempts),
    shuffle_questions=coalesce((p_payload->>'shuffleQuestions')::boolean,false),
    shuffle_options=coalesce((p_payload->>'shuffleOptions')::boolean,false),
    show_answers=coalesce((p_payload->>'showAnswers')::boolean,false),
    show_results=coalesce((p_payload->>'showResults')::boolean,true),
    access_type=coalesce((p_payload->>'access')::public.access_type,current_assessment.access_type),
    total_marks=case
      when attempt_count=0 and coalesce(p_payload->>'delivery',current_assessment.delivery::text)='offline'
        then coalesce((p_payload->>'totalMarks')::numeric,current_assessment.total_marks)
      else current_assessment.total_marks
    end
  where id=p_assessment_id;

  delete from public.content_audiences
  where content_type='assessment' and content_id=p_assessment_id;

  for program_item in
    select jsonb_array_elements_text(coalesce(p_payload->'programIds','[]'::jsonb))
  loop
    insert into public.content_audiences(content_type,content_id,program_id)
    values('assessment',p_assessment_id,program_item::uuid)
    on conflict do nothing;
  end loop;

  for batch_item in
    select jsonb_array_elements_text(coalesce(p_payload->'batchIds','[]'::jsonb))
  loop
    insert into public.content_audiences(content_type,content_id,batch_id)
    values('assessment',p_assessment_id,batch_item::uuid)
    on conflict do nothing;
  end loop;

  for student_item in
    select jsonb_array_elements_text(coalesce(p_payload->'studentIds','[]'::jsonb))
  loop
    insert into public.content_audiences(content_type,content_id,student_id)
    values('assessment',p_assessment_id,student_item::uuid)
    on conflict do nothing;
  end loop;

  if attempt_count=0 then
    select array_agg(assessment_question.question_id)
    into old_question_ids
    from public.assessment_questions assessment_question
    where assessment_question.assessment_id=p_assessment_id;

    delete from public.assessment_questions
    where assessment_id=p_assessment_id;

    if old_question_ids is not null then
      delete from public.questions question
      where question.id=any(old_question_ids)
        and not exists(
          select 1
          from public.assessment_questions assessment_question
          where assessment_question.question_id=question.id
        );
    end if;

    if coalesce(p_payload->>'delivery','online')='online' then
      for item in
        select value
        from jsonb_array_elements(coalesce(p_payload->'questions','[]'::jsonb))
      loop
        question_order := question_order + 1;

        insert into public.questions(owner_id,type,prompt,marks,image_url)
        values(
          auth.uid(),
          (item->>'type')::public.question_type,
          trim(item->>'prompt'),
          coalesce((item->>'marks')::numeric,1),
          nullif(trim(item->>'imageUrl'),'')
        )
        returning id into current_question_id;

        insert into public.question_keys(question_id,correct_answer,explanation,marking_guidance)
        values(
          current_question_id,
          item->'correctAnswer',
          nullif(item->>'explanation',''),
          case when item->>'type'='structured' then nullif(item->>'explanation','') else null end
        );

        option_order := 0;
        for option_item in
          select value
          from jsonb_array_elements(coalesce(item->'options','[]'::jsonb))
        loop
          option_order := option_order + 1;
          insert into public.question_options(question_id,option_key,option_text,sort_order)
          values(
            current_question_id,
            option_item->>'key',
            coalesce(option_item->>'text',option_item->>'key'),
            option_order
          );
        end loop;

        insert into public.assessment_questions(assessment_id,question_id,sort_order)
        values(p_assessment_id,current_question_id,question_order);

        computed_total := computed_total + coalesce((item->>'marks')::numeric,1);
      end loop;

      if computed_total <= 0 then
        raise exception 'Online assessments need at least one valid question';
      end if;

      update public.assessments
      set total_marks=computed_total
      where id=p_assessment_id;
    end if;
  elsif coalesce(p_payload->>'delivery',current_assessment.delivery::text)='online' then
    select count(*)
    into existing_question_count
    from public.assessment_questions
    where assessment_id=p_assessment_id;

    payload_question_count := jsonb_array_length(coalesce(p_payload->'questions','[]'::jsonb));

    if payload_question_count <> existing_question_count then
      raise exception 'Delete this quiz''s attempts before adding or removing questions';
    end if;

    for item in
      select value
      from jsonb_array_elements(coalesce(p_payload->'questions','[]'::jsonb))
    loop
      question_order := question_order + 1;

      if nullif(item->>'id','') is null then
        raise exception 'Existing questions must keep their IDs while attempts exist';
      end if;

      current_question_id := (item->>'id')::uuid;

      if not exists(
        select 1
        from public.assessment_questions assessment_question
        where assessment_question.assessment_id=p_assessment_id
          and assessment_question.question_id=current_question_id
          and assessment_question.sort_order=question_order
      ) then
        raise exception 'Delete this quiz''s attempts before reordering or replacing questions';
      end if;

      update public.questions
      set
        prompt=trim(item->>'prompt'),
        image_url=nullif(trim(item->>'imageUrl'),'')
      where id=current_question_id;

      update public.question_keys question_key
      set
        explanation=nullif(item->>'explanation',''),
        marking_guidance=case
          when question.type='structured' then nullif(item->>'explanation','')
          else question_key.marking_guidance
        end
      from public.questions question
      where question_key.question_id=current_question_id
        and question.id=current_question_id;

      select count(*)
      into existing_option_count
      from public.question_options question_option
      where question_option.question_id=current_question_id;

      payload_option_count := jsonb_array_length(coalesce(item->'options','[]'::jsonb));

      if payload_option_count <> existing_option_count then
        raise exception 'Delete this quiz''s attempts before adding or removing answer options';
      end if;

      option_order := 0;
      for option_item in
        select value
        from jsonb_array_elements(coalesce(item->'options','[]'::jsonb))
      loop
        option_order := option_order + 1;

        update public.question_options question_option
        set option_text=coalesce(option_item->>'text',option_item->>'key')
        where question_option.id=(option_item->>'id')::uuid
          and question_option.question_id=current_question_id
          and question_option.option_key=option_item->>'key'
          and question_option.sort_order=option_order;

        if not found then
          raise exception 'Delete this quiz''s attempts before reordering or replacing answer options';
        end if;
      end loop;
    end loop;
  end if;

  return p_assessment_id;
end;
$$;

revoke all on function public.update_assessment_bundle(uuid,jsonb) from public,anon;
grant execute on function public.update_assessment_bundle(uuid,jsonb) to authenticated;
grant all privileges on function public.update_assessment_bundle(uuid,jsonb) to service_role;

create or replace function public.get_admin_assessment(p_assessment_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  output jsonb;
  has_attempts boolean;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  select exists(
    select 1
    from public.attempts attempt
    where attempt.assessment_id=p_assessment_id
  )
  into has_attempts;

  select jsonb_build_object(
    'assessment',public.assessment_json(assessment,true,true),
    'hasAttempts',has_attempts,
    'questionsLocked',false
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

create or replace function public.delete_attempt_admin(p_attempt_id uuid)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  if not exists(
    select 1
    from public.attempts attempt
    where attempt.id=p_attempt_id
  ) then
    raise exception 'Attempt not found';
  end if;

  delete from public.results
  where attempt_id=p_attempt_id;

  delete from public.attempts
  where id=p_attempt_id;

  return true;
end;
$$;

revoke all on function public.delete_attempt_admin(uuid) from public,anon;
grant execute on function public.delete_attempt_admin(uuid) to authenticated;
grant all privileges on function public.delete_attempt_admin(uuid) to service_role;

create or replace function public.get_admin_workspace()
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
    'programs',coalesce((select jsonb_agg(public.program_json(program) order by program.sort_order,program.name) from public.programs program),'[]'::jsonb),
    'academicBatches',coalesce((select jsonb_agg(public.academic_batch_json(batch) order by batch.sort_order,batch.name) from public.academic_batches batch),'[]'::jsonb),
    'batches',coalesce((select jsonb_agg(public.batch_json(class) order by class.sort_order,class.name) from public.batches class),'[]'::jsonb),
    'students',coalesce((select jsonb_agg(jsonb_build_object(
      'id',profile.id,
      'firstName',profile.first_name,
      'lastName',profile.last_name,
      'fullName',concat_ws(' ',profile.first_name,profile.last_name),
      'phone',profile.contact_number,
      'dateOfBirth',profile.date_of_birth,
      'nic',profile.nic,
      'address',profile.address,
      'school',profile.school,
      'medium',profile.medium,
      'role',profile.role,
      'accountStatus',profile.account_status,
      'createdAt',profile.created_at,
      'requestedProgramId',profile.requested_program_id,
      'requestedBatchId',profile.requested_batch_id,
      'requestedProgramStatus',profile.requested_program_status,
      'programIds',coalesce((select jsonb_agg(distinct enrollment.program_id) from public.enrollments enrollment where enrollment.student_id=profile.id and enrollment.status='active'),'[]'::jsonb),
      'batchIds',coalesce((select jsonb_agg(distinct enrollment.batch_id) from public.enrollments enrollment where enrollment.student_id=profile.id and enrollment.status='active'),'[]'::jsonb)
    ) order by profile.created_at desc) from public.profiles profile where profile.role='student'),'[]'::jsonb),
    'modules',coalesce((select jsonb_agg(public.module_json(module) order by module.year desc,module.month desc) from public.modules module),'[]'::jsonb),
    'resources',coalesce((select jsonb_agg(public.resource_json(resource) order by resource.published_at desc) from public.resources resource),'[]'::jsonb),
    'assessments',coalesce((select jsonb_agg(public.assessment_json(assessment,true,true) order by assessment.created_at desc) from public.assessments assessment),'[]'::jsonb),
    'attempts',coalesce((select jsonb_agg(jsonb_build_object(
      'id',attempt.id,
      'assessmentId',attempt.assessment_id,
      'studentId',attempt.student_id,
      'attemptNumber',attempt.attempt_number,
      'status',attempt.status,
      'startedAt',attempt.started_at,
      'deadlineAt',attempt.deadline_at,
      'submittedAt',attempt.submitted_at,
      'autoSubmitted',attempt.auto_submitted,
      'score',attempt.score,
      'maxScore',attempt.max_score,
      'percentage',attempt.percentage
    ) order by attempt.started_at desc) from public.attempts attempt),'[]'::jsonb),
    'results',coalesce((select jsonb_agg(public.result_json(result) order by result.completed_at desc) from public.results result),'[]'::jsonb),
    'payments',coalesce((select jsonb_agg(public.payment_json(payment) order by payment.billing_month desc) from public.payments payment),'[]'::jsonb),
    'testimonials',coalesce((select jsonb_agg(jsonb_build_object(
      'id',testimonial.id,
      'studentName',testimonial.student_name,
      'programName',testimonial.program_name,
      'quote',testimonial.quote,
      'resultLabel',testimonial.result_label,
      'isPublished',testimonial.is_published
    ) order by testimonial.sort_order,testimonial.created_at desc) from public.testimonials testimonial),'[]'::jsonb)
  )
  into output;

  return output;
end;
$$;

revoke all on function public.get_admin_workspace() from public,anon;
grant execute on function public.get_admin_workspace() to authenticated;
grant all privileges on function public.get_admin_workspace() to service_role;
