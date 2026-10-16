-- ============================================================================
-- GiveHand ET — Phase 2 Database Migration 1: Extensions, Enums & Tables
-- ============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. ENUMS
create type user_role as enum ('supporter', 'organization', 'admin');
create type org_status as enum ('pending', 'verified', 'rejected', 'suspended');
create type org_member_role as enum ('owner', 'manager', 'staff');
create type need_status as enum ('draft', 'open', 'in_progress', 'completed', 'cancelled');
create type need_urgency as enum ('low', 'medium', 'high', 'critical');
create type item_type as enum ('volunteer', 'material', 'money');
create type volunteer_app_status as enum (
  'applied',
  'approved',
  'waitlisted',
  'rejected',
  'confirmed',
  'attended',
  'no_show',
  'completed',
  'cancelled'
);
create type material_pledge_status as enum (
  'pledged',
  'in_transit',
  'delivered',
  'received',
  'partially_received',
  'rejected',
  'cancelled'
);
create type money_donation_status as enum (
  'pledged',
  'payment_submitted',
  'confirmed',
  'rejected',
  'cancelled'
);
create type payment_method as enum (
  'telebirr',
  'cbe_birr',
  'bank_transfer',
  'chapa',
  'cash',
  'other'
);
create type certificate_type as enum ('volunteer_service', 'donation_receipt', 'partner_recognition');
create type notification_type as enum (
  'application_status',
  'donation_confirmed',
  'pledge_status',
  'new_update',
  'certificate_issued',
  'org_verified',
  'general'
);

-- ============================================================================
-- 3. CORE TABLES
-- ============================================================================

-- PROFILES (Linked 1:1 to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'supporter',
  full_name text,
  phone text,
  city text default 'Addis Ababa',
  subcity text,
  bio text,
  avatar_url text,
  skills text[] default array[]::text[],
  interests text[] default array[]::text[],
  availability text,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ORGANIZATIONS
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text,
  logo_url text,
  cover_url text,
  address text,
  lat double precision,
  lng double precision,
  phone text,
  email text,
  website text,
  registration_number text,
  status org_status not null default 'pending',
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ORGANIZATION MEMBERS
create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_role org_member_role not null default 'staff',
  created_at timestamptz not null default now(),
  unique(organization_id, user_id)
);

-- ORGANIZATION DOCUMENTS (Verification docs, licenses, bylaws)
create table if not exists public.organization_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  file_path text not null,
  doc_type text not null, -- 'registration_license', 'tax_id', 'bank_statement', 'bylaws'
  review_note text,
  status text not null default 'pending', -- 'pending', 'approved', 'rejected'
  created_at timestamptz not null default now()
);

-- CATEGORIES (Education, Health, Food, Shelter, Disaster Relief, Youth, Elderly)
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_am text not null,
  icon text, -- Lucide icon name or emoji
  created_at timestamptz not null default now()
);

-- NEEDS
create table if not exists public.needs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  description text,
  location_text text,
  lat double precision,
  lng double precision,
  is_remote boolean not null default false,
  start_date date,
  end_date date,
  status need_status not null default 'draft',
  urgency boolean not null default false,
  cover_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- NEED ITEMS (Volunteer slots, Material goods, Monetary goals)
create table if not exists public.need_items (
  id uuid primary key default gen_random_uuid(),
  need_id uuid not null references public.needs(id) on delete cascade,
  item_type item_type not null,
  title text not null,
  description text,
  target_quantity numeric(12, 2), -- e.g., 20 volunteers, 100 books, 50 bags
  target_amount numeric(12, 2),   -- monetary goal in ETB (e.g., 50000.00 ETB)
  unit text,                      -- 'volunteers', 'books', 'boxes', 'ETB', 'kg'
  metadata jsonb default '{}'::jsonb, -- custom details (e.g. required skills, clothing sizes)
  deadline timestamptz,
  created_at timestamptz not null default now()
);

-- VOLUNTEER SHIFTS (Specific dates and shift windows)
create table if not exists public.volunteer_shifts (
  id uuid primary key default gen_random_uuid(),
  need_item_id uuid not null references public.need_items(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity integer not null default 10,
  created_at timestamptz not null default now()
);

-- VOLUNTEER APPLICATIONS
create table if not exists public.volunteer_applications (
  id uuid primary key default gen_random_uuid(),
  need_item_id uuid not null references public.need_items(id) on delete cascade,
  shift_id uuid references public.volunteer_shifts(id) on delete set null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  status volunteer_app_status not null default 'applied',
  hours_logged numeric(6, 2) default 0.00,
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  check_in_token text, -- used for secure QR scan check-in
  created_at timestamptz not null default now(),
  unique(need_item_id, user_id)
);

-- MATERIAL PLEDGES
create table if not exists public.material_pledges (
  id uuid primary key default gen_random_uuid(),
  need_item_id uuid not null references public.need_items(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  quantity numeric(10, 2) not null check (quantity > 0),
  received_quantity numeric(10, 2) default 0 check (received_quantity >= 0),
  delivery_method text not null default 'dropoff', -- 'dropoff', 'pickup_requested', 'courier'
  status material_pledge_status not null default 'pledged',
  condition_note text, -- 'Brand new', 'Gently used', 'Sealed'
  photo_url text,
  created_at timestamptz not null default now()
);

-- MONEY DONATIONS
create table if not exists public.money_donations (
  id uuid primary key default gen_random_uuid(),
  need_item_id uuid not null references public.need_items(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  amount numeric(12, 2) not null check (amount > 0),
  method payment_method not null default 'telebirr',
  reference_number text, -- Telebirr/CBE/Bank transaction reference
  proof_url text,        -- Screenshot of payment proof (private bucket)
  is_anonymous boolean not null default false,
  status money_donation_status not null default 'pledged',
  reject_reason text,
  confirmed_by uuid references public.profiles(id) on delete set null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

-- CERTIFICATES
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  public_code text not null unique, -- e.g. GH-2026-A8K92F
  type certificate_type not null default 'volunteer_service',
  user_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  related_id uuid, -- ID of volunteer_application, material_pledge, or money_donation
  data jsonb not null default '{}'::jsonb, -- summary data snapshot (hours, items, amount, dates)
  issued_at timestamptz not null default now(),
  revoked_at timestamptz
);

-- NEED UPDATES (Progress stories, photos from the field)
create table if not exists public.need_updates (
  id uuid primary key default gen_random_uuid(),
  need_id uuid not null references public.needs(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  image_url text,
  created_at timestamptz not null default now()
);

-- NOTIFICATIONS
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type notification_type not null default 'general',
  title text not null,
  body text not null,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- REPORTS (Flagging inappropriate content or fraud)
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null, -- 'need', 'organization', 'user', 'comment'
  target_id uuid not null,
  reason text not null,
  details text,
  status text not null default 'pending', -- 'pending', 'resolved', 'dismissed'
  resolved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- AUDIT LOGS
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 4. PERFORMANCE INDEXES
-- ============================================================================
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_organizations_owner on public.organizations(owner_id);
create index if not exists idx_organizations_status on public.organizations(status);
create index if not exists idx_organizations_slug on public.organizations(slug);
create index if not exists idx_needs_org on public.needs(organization_id);
create index if not exists idx_needs_category on public.needs(category_id);
create index if not exists idx_needs_status on public.needs(status);
create index if not exists idx_need_items_need on public.need_items(need_id);
create index if not exists idx_need_items_type on public.need_items(item_type);
create index if not exists idx_vol_apps_item on public.volunteer_applications(need_item_id);
create index if not exists idx_vol_apps_user on public.volunteer_applications(user_id);
create index if not exists idx_mat_pledges_item on public.material_pledges(need_item_id);
create index if not exists idx_mat_pledges_user on public.material_pledges(user_id);
create index if not exists idx_donations_item on public.money_donations(need_item_id);
create index if not exists idx_donations_user on public.money_donations(user_id);
create index if not exists idx_donations_status on public.money_donations(status);
create index if not exists idx_certificates_code on public.certificates(public_code);
create index if not exists idx_notifications_user on public.notifications(user_id, read_at);
create index if not exists idx_audit_actor on public.audit_logs(actor_id);
