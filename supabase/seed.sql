-- Smart ICT LMS starter content
-- Run AFTER schema.sql. Safe to re-run.

insert into public.programs(name,short_name,slug,description,academic_level,exam_year,mediums,cover_image_url,is_public,registration_open,is_active,sort_order)
values
('2026 O/L ICT','2026 O/L','2026-ol','A focused ICT journey for students sitting the 2026 G.C.E. Ordinary Level examination, combining clear theory, structured revision and regular assessment.','O/L',2026,array['Sinhala','English'],'/ol-theory-poster.jpg',true,true,true,10),
('2027 O/L ICT','2027 O/L','2027-ol','A complete long-term ICT programme for students sitting the 2027 O/L examination, built around understanding, retention and exam-ready practice.','O/L',2027,array['Sinhala','English'],'/ol-theory-poster.jpg',true,true,true,20),
('2026 O/L Rapid Revision','Rapid Revision','2026-ol-rapid-revision','A fast, exam-oriented revision programme that revisits the syllabus, develops answering technique and builds confidence through paper practice.','O/L',2026,array['Sinhala','English'],'/rapid-revision-poster.jpg',true,true,true,30)
on conflict(slug) do update set
  name=excluded.name,short_name=excluded.short_name,description=excluded.description,academic_level=excluded.academic_level,
  exam_year=excluded.exam_year,mediums=excluded.mediums,cover_image_url=excluded.cover_image_url,is_public=excluded.is_public,
  registration_open=excluded.registration_open,is_active=excluded.is_active,sort_order=excluded.sort_order;

insert into public.batches(program_id,name,description,is_active)
select p.id,v.name,v.description,true
from public.programs p
join (values
  ('2026-ol','2026 O/L Main Batch','Main batch for students sitting the 2026 O/L examination.'),
  ('2027-ol','2027 O/L Main Batch','Main batch for students sitting the 2027 O/L examination.'),
  ('2026-ol-rapid-revision','Rapid Revision Main Batch','2026 O/L rapid revision students.')
) as v(slug,name,description) on v.slug=p.slug
on conflict(program_id,name) do update set description=excluded.description,is_active=true;

insert into public.modules(program_id,batch_id,title,month,year,access_type,status,opens_at)
select p.id,b.id,'July 2026',7,2026,'paid','published','2026-07-01T00:00:00+05:30'::timestamptz
from public.programs p join public.batches b on b.program_id=p.id
where p.slug='2026-ol' and b.name='2026 O/L Main Batch'
on conflict do nothing;

insert into public.modules(program_id,batch_id,title,month,year,access_type,status,opens_at)
select p.id,b.id,'July 2026 — Free Starter Module',7,2026,'free','published','2026-07-01T00:00:00+05:30'::timestamptz
from public.programs p join public.batches b on b.program_id=p.id
where p.slug='2027-ol' and b.name='2027 O/L Main Batch'
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
