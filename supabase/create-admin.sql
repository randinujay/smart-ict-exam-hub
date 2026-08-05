-- 1) In Supabase Dashboard → Authentication → Users, create the teacher user:
--    Email: randinujayaratne15@gmail.com
--    Password: choose a strong private password
--    Confirm email: yes
-- 2) Run this script. It works whether or not the auth trigger already created
--    the profile, and it fails loudly instead of silently updating zero rows.

do $$
declare
  teacher_id uuid;
  phone_owner uuid;
begin
  select id into teacher_id
  from auth.users
  where lower(email)=lower('randinujayaratne15@gmail.com')
  limit 1;

  if teacher_id is null then
    raise exception 'Create and confirm the teacher Auth user before running create-admin.sql';
  end if;

  select id into phone_owner
  from public.profiles
  where contact_number='94767708978' and id<>teacher_id
  limit 1;

  if phone_owner is not null then
    raise exception 'Teacher phone is already assigned to another profile (%). Review and merge that account first.',phone_owner;
  end if;

  insert into public.profiles(
    id,first_name,last_name,date_of_birth,nic,contact_number,address,school,
    medium,role,account_status,verified_at
  ) values (
    teacher_id,'Randinu','Jayaratne',current_date,null,'94767708978',
    'Minuwangoda, Sri Lanka','Smart ICT','English','admin','verified',now()
  )
  on conflict(id) do update set
    first_name=excluded.first_name,
    last_name=excluded.last_name,
    contact_number=excluded.contact_number,
    address=excluded.address,
    school=excluded.school,
    medium=excluded.medium,
    role=excluded.role,
    account_status=excluded.account_status,
    verified_at=excluded.verified_at;
end $$;

-- Verify exactly one admin exists:
select p.id,p.first_name,p.last_name,p.role,p.account_status,u.email
from public.profiles p join auth.users u on u.id=p.id
where p.role='admin';
