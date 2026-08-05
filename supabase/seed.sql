-- Smart ICT LMS starter content
-- Run AFTER schema.sql. Safe to re-run.

insert into public.programs(name,short_name,slug,description,academic_level,exam_year,mediums,cover_image_url,is_public,registration_open,is_active,sort_order)
values
('Theory','Theory','theory','Complete ICT theory lessons with structured notes and steady syllabus coverage.','O/L',null,array['Sinhala','English'],'/ol-theory-poster.jpg',true,true,true,10),
('Revision','Revision','revision','Focused syllabus revision with targeted practice and regular assessment.','O/L',null,array['Sinhala','English'],'/ol-theory-poster.jpg',true,true,true,20)
on conflict(slug) do update set
  name=excluded.name,short_name=excluded.short_name,description=excluded.description,academic_level=excluded.academic_level,
  exam_year=excluded.exam_year,mediums=excluded.mediums,cover_image_url=excluded.cover_image_url,is_public=excluded.is_public,
  registration_open=excluded.registration_open,is_active=excluded.is_active,sort_order=excluded.sort_order;

update public.programs
set is_public=false,registration_open=false,is_active=false
where slug not in ('theory','revision');

insert into public.academic_batches(name,academic_level,exam_year,is_active,sort_order)
values
('2026 O/L','O/L',2026,true,10),
('2027 O/L','O/L',2027,true,20),
('2027 A/L','A/L',2027,true,30)
on conflict(name) do update set
  academic_level=excluded.academic_level,exam_year=excluded.exam_year,is_active=true,sort_order=excluded.sort_order;

insert into public.batches(program_id,academic_batch_id,name,description,is_active,registration_open,sort_order)
select p.id,ab.id,v.batch_name,v.description,true,true,v.sort_order
from public.programs p
join (values
  ('revision','2026 O/L','Students preparing for the 2026 O/L examination.',10),
  ('theory','2027 O/L','Students preparing for the 2027 O/L examination.',20),
  ('revision','2027 A/L','Students preparing for the 2027 A/L examination.',30)
) as v(slug,batch_name,description,sort_order) on v.slug=p.slug
join public.academic_batches ab on ab.name=v.batch_name
on conflict(program_id,name) do update set
  academic_batch_id=excluded.academic_batch_id,description=excluded.description,
  is_active=true,registration_open=true,sort_order=excluded.sort_order;

update public.batches b
set is_active=false,registration_open=false
where not exists (
  select 1
  from public.programs p
  join public.academic_batches ab on ab.id=b.academic_batch_id
  where p.id=b.program_id
    and (
      (ab.name='2026 O/L' and p.slug='revision')
      or (ab.name='2027 O/L' and p.slug='theory')
      or (ab.name='2027 A/L' and p.slug='revision')
    )
);

insert into public.modules(program_id,batch_id,title,month,year,access_type,status,opens_at)
select p.id,b.id,'July 2026',7,2026,'paid','published','2026-07-01T00:00:00+05:30'::timestamptz
from public.programs p join public.batches b on b.program_id=p.id
where p.slug='revision' and b.name='2026 O/L'
on conflict do nothing;

insert into public.modules(program_id,batch_id,title,month,year,access_type,status,opens_at)
select p.id,b.id,'July 2026 — Free Starter Module',7,2026,'free','published','2026-07-01T00:00:00+05:30'::timestamptz
from public.programs p join public.batches b on b.program_id=p.id
where p.slug='theory' and b.name='2027 O/L'
on conflict do nothing;

insert into public.site_content(content_key,content_value,content_type,is_public)
values
('bank_name','Add your bank name','setting',false),
('bank_branch','Add your branch','setting',false),
('bank_account_name','Randinu Jayaratne','setting',false),
('bank_account_number','Add your account number','setting',false),
('whatsapp_channel_url','','setting',true),
('facebook_url','','setting',true),
('youtube_url','','setting',true),
('support_whatsapp','94767708978','setting',true)
on conflict(content_key) do nothing;
