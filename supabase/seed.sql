-- Smart ICT LMS starter content
-- Run AFTER schema.sql. Safe to re-run.

insert into public.programs(name,short_name,slug,description,academic_level,exam_year,mediums,cover_image_url,is_public,registration_open,is_active,sort_order)
values
('Theory','Theory','theory','Complete ICT theory lessons with structured notes and steady syllabus coverage.','O/L',null,array['Sinhala','English'],'/ol-theory-poster.jpg',true,true,true,10),
('Revision','Revision','revision','Focused syllabus revision with targeted practice and regular assessment.','O/L',null,array['Sinhala','English'],'/rapid-revision-poster.jpg',true,true,true,20),
('Paper','Paper','paper','Past-paper practice, answering technique and detailed paper discussion.','O/L',null,array['Sinhala','English'],'/ol-theory-poster.jpg',true,true,true,30),
('Rapid Revision','Rapid Revision','rapid-revision','Fast, exam-oriented revision with intensive paper practice.','O/L',null,array['Sinhala','English'],'/rapid-revision-poster.jpg',true,true,true,40)
on conflict(slug) do update set
  name=excluded.name,short_name=excluded.short_name,description=excluded.description,academic_level=excluded.academic_level,
  exam_year=excluded.exam_year,mediums=excluded.mediums,cover_image_url=excluded.cover_image_url,is_public=excluded.is_public,
  registration_open=excluded.registration_open,is_active=excluded.is_active,sort_order=excluded.sort_order;

insert into public.batches(program_id,name,description,is_active)
select p.id,v.name,v.description,true
from public.programs p
join (values
  ('theory','2026 O/L','Students preparing for the 2026 O/L examination.'),
  ('theory','2027 O/L','Students preparing for the 2027 O/L examination.'),
  ('revision','2026 O/L','Students preparing for the 2026 O/L examination.'),
  ('revision','2027 O/L','Students preparing for the 2027 O/L examination.'),
  ('paper','2026 O/L','Students preparing for the 2026 O/L examination.'),
  ('paper','2027 O/L','Students preparing for the 2027 O/L examination.'),
  ('rapid-revision','2026 O/L','Students preparing for the 2026 O/L examination.'),
  ('rapid-revision','2027 O/L','Students preparing for the 2027 O/L examination.')
) as v(slug,name,description) on v.slug=p.slug
on conflict(program_id,name) do update set description=excluded.description,is_active=true;

insert into public.modules(program_id,batch_id,title,month,year,access_type,status,opens_at)
select p.id,b.id,'July 2026',7,2026,'paid','published','2026-07-01T00:00:00+05:30'::timestamptz
from public.programs p join public.batches b on b.program_id=p.id
where p.slug='theory' and b.name='2026 O/L'
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
