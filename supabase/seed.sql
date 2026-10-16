-- ============================================================================
-- GiveHand ET — Phase 2 Database Seed: Users & Taxonomies Only
-- All sample mock data (organizations, needs, pledges, donations, certificates)
-- removed for clean real testing.
-- ============================================================================

-- 1. CLEANUP PREVIOUS SAMPLE DATA
truncate table public.notifications cascade;
truncate table public.certificates cascade;
truncate table public.money_donations cascade;
truncate table public.material_pledges cascade;
truncate table public.volunteer_applications cascade;
truncate table public.volunteer_shifts cascade;
truncate table public.need_items cascade;
truncate table public.need_updates cascade;
truncate table public.needs cascade;
truncate table public.organization_documents cascade;
truncate table public.organization_members cascade;
truncate table public.organizations cascade;

-- 2. SAMPLE AUTH USERS (Allows immediate login with: Password123!)
-- Inserts into auth.users and auth.identities so foreign key profiles_id_fkey is satisfied
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaa1-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'admin@givehandet.org', crypt('Password123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Kidus Tesfaye","role":"admin"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaa2-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'binyam@mekedonia.org', crypt('Password123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Binyam Belete","role":"organization"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaa3-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'almaz@redcrosseth.org', crypt('Password123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Almaz Bekele","role":"organization"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaa4-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'maryjoy@maryjoy.org.et', crypt('Password123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Zebideru Zewdie","role":"organization"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaa5-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'abebe@givehandet.org', crypt('Password123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Abebe Bikila","role":"supporter"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaa6-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'sara@givehandet.org', crypt('Password123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sara Girma","role":"supporter"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaa7-0000-0000-0000-000000000007', 'authenticated', 'authenticated', 'dawit@givehandet.org', crypt('Password123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dawit Haile","role":"supporter"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaa8-0000-0000-0000-000000000008', 'authenticated', 'authenticated', 'bethlehem@givehandet.org', crypt('Password123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Bethlehem Tadesse","role":"supporter"}', now(), now(), '', '', '', '')
on conflict (id) do update set
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at;

-- Insert matching identities so Supabase password auth works seamlessly
insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) values
  ('aaaaaaa1-0000-0000-0000-000000000001', 'aaaaaaa1-0000-0000-0000-000000000001', jsonb_build_object('sub', 'aaaaaaa1-0000-0000-0000-000000000001', 'email', 'admin@givehandet.org'), 'email', 'admin@givehandet.org', now(), now(), now()),
  ('aaaaaaa2-0000-0000-0000-000000000002', 'aaaaaaa2-0000-0000-0000-000000000002', jsonb_build_object('sub', 'aaaaaaa2-0000-0000-0000-000000000002', 'email', 'binyam@mekedonia.org'), 'email', 'binyam@mekedonia.org', now(), now(), now()),
  ('aaaaaaa3-0000-0000-0000-000000000003', 'aaaaaaa3-0000-0000-0000-000000000003', jsonb_build_object('sub', 'aaaaaaa3-0000-0000-0000-000000000003', 'email', 'almaz@redcrosseth.org'), 'email', 'almaz@redcrosseth.org', now(), now(), now()),
  ('aaaaaaa4-0000-0000-0000-000000000004', 'aaaaaaa4-0000-0000-0000-000000000004', jsonb_build_object('sub', 'aaaaaaa4-0000-0000-0000-000000000004', 'email', 'maryjoy@maryjoy.org.et'), 'email', 'maryjoy@maryjoy.org.et', now(), now(), now()),
  ('aaaaaaa5-0000-0000-0000-000000000005', 'aaaaaaa5-0000-0000-0000-000000000005', jsonb_build_object('sub', 'aaaaaaa5-0000-0000-0000-000000000005', 'email', 'abebe@givehandet.org'), 'email', 'abebe@givehandet.org', now(), now(), now()),
  ('aaaaaaa6-0000-0000-0000-000000000006', 'aaaaaaa6-0000-0000-0000-000000000006', jsonb_build_object('sub', 'aaaaaaa6-0000-0000-0000-000000000006', 'email', 'sara@givehandet.org'), 'email', 'sara@givehandet.org', now(), now(), now()),
  ('aaaaaaa7-0000-0000-0000-000000000007', 'aaaaaaa7-0000-0000-0000-000000000007', jsonb_build_object('sub', 'aaaaaaa7-0000-0000-0000-000000000007', 'email', 'dawit@givehandet.org'), 'email', 'dawit@givehandet.org', now(), now(), now()),
  ('aaaaaaa8-0000-0000-0000-000000000008', 'aaaaaaa8-0000-0000-0000-000000000008', jsonb_build_object('sub', 'aaaaaaa8-0000-0000-0000-000000000008', 'email', 'bethlehem@givehandet.org'), 'email', 'bethlehem@givehandet.org', now(), now(), now())
on conflict (id) do nothing;

-- 3. CATEGORIES (Reference taxonomy needed for creating and filtering needs)
insert into public.categories (id, name_en, name_am, icon) values
  ('11111111-0000-0000-0000-000000000001', 'Education & Literacy', 'ትምህርት እና ስነ-ጽሁፍ', 'GraduationCap'),
  ('11111111-0000-0000-0000-000000000002', 'Healthcare & Clinics', 'ጤና እና ክሊኒኮች', 'HeartPulse'),
  ('11111111-0000-0000-0000-000000000003', 'Food Security & Nutrition', 'የምግብ ዋስትና እና አመጋገብ', 'Utensils'),
  ('11111111-0000-0000-0000-000000000004', 'Disaster & Emergency Relief', 'ድንገተኛ አደጋ እና እርዳታ', 'Flame'),
  ('11111111-0000-0000-0000-000000000005', 'Elderly & Disability Care', 'አረጋውያን እና አካል ጉዳተኞች', 'Accessibility'),
  ('11111111-0000-0000-0000-000000000006', 'Youth & Vocational Skills', 'ወጣቶች እና ሙያ ስልጠና', 'Wrench'),
  ('11111111-0000-0000-0000-000000000007', 'Environmental & Green Legacy', 'አካባቢ ጥበቃ እና አረንጓዴ አሻራ', 'TreePine')
on conflict (id) do update set
  name_en = excluded.name_en,
  name_am = excluded.name_am;

-- 4. SAMPLE PROFILES
insert into public.profiles (id, role, full_name, phone, city, subcity, bio, skills, interests) values
  ('aaaaaaa1-0000-0000-0000-000000000001', 'admin', 'Kidus Tesfaye', '+251911000001', 'Addis Ababa', 'Bole', 'Platform administrator and community coordinator.', array['Coordination', 'Strategy', 'Auditing'], array['Community Development', 'Education']),
  ('aaaaaaa2-0000-0000-0000-000000000002', 'organization', 'Binyam Belete', '+251911000002', 'Addis Ababa', 'Kirkos', 'Organization representative.', array['Social Work'], array['Elderly & Disability Care']),
  ('aaaaaaa3-0000-0000-0000-000000000003', 'organization', 'Dr. Almaz Bekele', '+251918000003', 'Bahir Dar', 'Kebele 04', 'Organization representative.', array['Emergency Health', 'Logistics'], array['Disaster & Emergency Relief', 'Healthcare & Clinics']),
  ('aaaaaaa4-0000-0000-0000-000000000004', 'organization', 'Zebideru Zewdie', '+251946000004', 'Hawassa', 'Menehariya', 'Organization representative.', array['Child Welfare', 'Youth Empowerment'], array['Youth & Vocational Skills', 'Education & Literacy']),
  ('aaaaaaa5-0000-0000-0000-000000000005', 'supporter', 'Abebe Bikila', '+251911223344', 'Addis Ababa', 'Yeka', 'Software developer and part-time volunteer.', array['Teaching', 'Coding', 'English'], array['Education & Literacy', 'Youth & Vocational Skills']),
  ('aaaaaaa6-0000-0000-0000-000000000006', 'supporter', 'Sara Girma', '+251922334455', 'Hawassa', 'Tabor', 'Registered nurse passionate about community health.', array['Nursing', 'First Aid', 'Patient Triage'], array['Healthcare & Clinics', 'Elderly & Disability Care']),
  ('aaaaaaa7-0000-0000-0000-000000000007', 'supporter', 'Dawit Haile', '+251933445566', 'Addis Ababa', 'Bole', 'Professional supporter for local community initiatives.', array['Accounting', 'Mentorship'], array['Education & Literacy', 'Food Security & Nutrition']),
  ('aaaaaaa8-0000-0000-0000-000000000008', 'supporter', 'Bethlehem Tadesse', '+251944556677', 'Bahir Dar', 'Kebele 13', 'University student and environmental volunteer.', array['Tree Planting', 'Social Media', 'Translation'], array['Environmental & Green Legacy', 'Youth & Vocational Skills'])
on conflict (id) do update set
  full_name = excluded.full_name,
  role = excluded.role,
  city = excluded.city,
  subcity = excluded.subcity,
  bio = excluded.bio,
  skills = excluded.skills,
  interests = excluded.interests;
