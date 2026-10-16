-- ============================================================================
-- GiveHand ET — Phase 2 Database Migration 3: Row Level Security (RLS)
-- Enables strict RLS on all 16 tables with comprehensive role-based access.
-- ============================================================================

-- 1. HELPER SECURITY FUNCTIONS
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer stable;

create or replace function public.is_org_member(org_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.organizations
    where id = org_id and owner_id = auth.uid()
  ) or exists (
    select 1 from public.organization_members
    where organization_id = org_id and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer stable;

create or replace function public.is_org_owner(org_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.organizations
    where id = org_id and owner_id = auth.uid()
  );
end;
$$ language plpgsql security definer stable;

create or replace function public.is_verified_org(org_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.organizations
    where id = org_id and status = 'verified'
  );
end;
$$ language plpgsql security definer stable;

-- ============================================================================
-- 2. ENABLE RLS ON ALL TABLES
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_documents enable row level security;
alter table public.categories enable row level security;
alter table public.needs enable row level security;
alter table public.need_items enable row level security;
alter table public.volunteer_shifts enable row level security;
alter table public.volunteer_applications enable row level security;
alter table public.material_pledges enable row level security;
alter table public.money_donations enable row level security;
alter table public.certificates enable row level security;
alter table public.need_updates enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.audit_logs enable row level security;

-- ============================================================================
-- 3. PROFILES POLICIES
-- ============================================================================
-- Anyone can view public profile details
create policy "Profiles are viewable by everyone"
on public.profiles for select
using (not is_suspended);

-- Users can update only their own profile
create policy "Users can update their own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Admins can do anything with profiles
create policy "Admins have full access to profiles"
on public.profiles for all
using (public.is_admin());

-- ============================================================================
-- 4. ORGANIZATIONS POLICIES
-- ============================================================================
-- Public can view verified organizations; members and admins can view any status
create policy "Verified organizations are public"
on public.organizations for select
using (
  status = 'verified'
  or public.is_org_member(id)
  or public.is_admin()
);

-- Authenticated users can register an organization
create policy "Authenticated users can create an organization"
on public.organizations for insert
to authenticated
with check (owner_id = auth.uid());

-- Organization owners and managers can update their org
create policy "Org owners can update their organization"
on public.organizations for update
using (public.is_org_owner(id) or public.is_admin())
with check (public.is_org_owner(id) or public.is_admin());

-- Admins can manage all organizations
create policy "Admins have full access to organizations"
on public.organizations for all
using (public.is_admin());

-- ============================================================================
-- 5. ORGANIZATION MEMBERS POLICIES
-- ============================================================================
create policy "Org members can view membership in their organization"
on public.organization_members for select
using (
  public.is_org_member(organization_id)
  or public.is_admin()
);

create policy "Org owners can manage membership"
on public.organization_members for all
using (
  public.is_org_owner(organization_id)
  or public.is_admin()
);

-- ============================================================================
-- 6. ORGANIZATION DOCUMENTS POLICIES
-- ============================================================================
create policy "Org members and admins can view verification documents"
on public.organization_documents for select
using (
  public.is_org_member(organization_id)
  or public.is_admin()
);

create policy "Org members can upload verification documents"
on public.organization_documents for insert
with check (
  public.is_org_member(organization_id)
  or public.is_admin()
);

create policy "Admins can review and update documents"
on public.organization_documents for update
using (public.is_admin());

-- ============================================================================
-- 7. CATEGORIES POLICIES
-- ============================================================================
create policy "Categories are viewable by everyone"
on public.categories for select
using (true);

create policy "Admins can manage categories"
on public.categories for all
using (public.is_admin());

-- ============================================================================
-- 8. NEEDS POLICIES
-- ============================================================================
-- Public can view active needs from verified organizations
create policy "Public can view active needs"
on public.needs for select
using (
  (status in ('open', 'in_progress', 'completed') and public.is_verified_org(organization_id))
  or public.is_org_member(organization_id)
  or public.is_admin()
);

-- Only verified organizations (or members drafting) can insert needs
create policy "Org members can create needs"
on public.needs for insert
with check (
  public.is_org_member(organization_id)
  and (status = 'draft' or public.is_verified_org(organization_id))
);

-- Org members can update their own needs
create policy "Org members can update their needs"
on public.needs for update
using (
  public.is_org_member(organization_id)
  or public.is_admin()
)
with check (
  -- Cannot publish to 'open' unless verified
  (status != 'open' or public.is_verified_org(organization_id) or public.is_admin())
);

-- Org owners or admins can delete needs
create policy "Org owners can delete needs"
on public.needs for delete
using (
  public.is_org_owner(organization_id)
  or public.is_admin()
);

-- ============================================================================
-- 9. NEED ITEMS POLICIES
-- ============================================================================
create policy "Public can view items of viewable needs"
on public.need_items for select
using (
  exists (
    select 1 from public.needs n
    where n.id = need_items.need_id
      and (
        (n.status in ('open', 'in_progress', 'completed') and public.is_verified_org(n.organization_id))
        or public.is_org_member(n.organization_id)
        or public.is_admin()
      )
  )
);

create policy "Org members can manage need items"
on public.need_items for all
using (
  exists (
    select 1 from public.needs n
    where n.id = need_items.need_id
      and (public.is_org_member(n.organization_id) or public.is_admin())
  )
);

-- ============================================================================
-- 10. VOLUNTEER SHIFTS POLICIES
-- ============================================================================
create policy "Public can view volunteer shifts"
on public.volunteer_shifts for select
using (
  exists (
    select 1 from public.need_items ni
    join public.needs n on n.id = ni.need_id
    where ni.id = volunteer_shifts.need_item_id
      and (
        (n.status in ('open', 'in_progress', 'completed') and public.is_verified_org(n.organization_id))
        or public.is_org_member(n.organization_id)
        or public.is_admin()
      )
  )
);

create policy "Org members can manage shifts"
on public.volunteer_shifts for all
using (
  exists (
    select 1 from public.need_items ni
    join public.needs n on n.id = ni.need_id
    where ni.id = volunteer_shifts.need_item_id
      and (public.is_org_member(n.organization_id) or public.is_admin())
  )
);

-- ============================================================================
-- 11. VOLUNTEER APPLICATIONS POLICIES
-- ============================================================================
-- Supporters can see their own applications; org members see applications for their needs
create policy "Volunteers and org members can view applications"
on public.volunteer_applications for select
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.need_items ni
    join public.needs n on n.id = ni.need_id
    where ni.id = volunteer_applications.need_item_id
      and (public.is_org_member(n.organization_id) or public.is_admin())
  )
);

-- Supporters can submit application
create policy "Supporters can apply for volunteer slots"
on public.volunteer_applications for insert
to authenticated
with check (user_id = auth.uid());

-- Supporters can update message/status (e.g. cancel) or Org members can update status/hours
create policy "Update volunteer applications"
on public.volunteer_applications for update
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.need_items ni
    join public.needs n on n.id = ni.need_id
    where ni.id = volunteer_applications.need_item_id
      and (public.is_org_member(n.organization_id) or public.is_admin())
  )
);

-- ============================================================================
-- 12. MATERIAL PLEDGES POLICIES
-- ============================================================================
create policy "Supporters and org members can view pledges"
on public.material_pledges for select
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.need_items ni
    join public.needs n on n.id = ni.need_id
    where ni.id = material_pledges.need_item_id
      and (public.is_org_member(n.organization_id) or public.is_admin())
  )
);

create policy "Supporters can create material pledges"
on public.material_pledges for insert
to authenticated
with check (user_id = auth.uid());

create policy "Update material pledges"
on public.material_pledges for update
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.need_items ni
    join public.needs n on n.id = ni.need_id
    where ni.id = material_pledges.need_item_id
      and (public.is_org_member(n.organization_id) or public.is_admin())
  )
);

-- ============================================================================
-- 13. MONEY DONATIONS POLICIES
-- ============================================================================
-- Donors see their own; org members see all for their needs; public can see confirmed aggregate without donor ID if anonymous
create policy "View money donations"
on public.money_donations for select
using (
  user_id = auth.uid()
  or (status = 'confirmed' and not is_anonymous)
  or exists (
    select 1 from public.need_items ni
    join public.needs n on n.id = ni.need_id
    where ni.id = money_donations.need_item_id
      and (public.is_org_member(n.organization_id) or public.is_admin())
  )
);

-- Anyone (including guest donors) can submit a money donation
create policy "Anyone can record a money donation"
on public.money_donations for insert
with check (
  user_id is null or user_id = auth.uid()
);

-- Org members can verify/confirm donations
create policy "Org members can confirm money donations"
on public.money_donations for update
using (
  exists (
    select 1 from public.need_items ni
    join public.needs n on n.id = ni.need_id
    where ni.id = money_donations.need_item_id
      and (public.is_org_member(n.organization_id) or public.is_admin())
  )
);

-- ============================================================================
-- 14. CERTIFICATES POLICIES
-- ============================================================================
-- Anyone can look up certificates by public code (for public verification)
create policy "Certificates are publicly verifiable"
on public.certificates for select
using (true);

-- Org members or admins can issue certificates
create policy "Org members can issue certificates"
on public.certificates for insert
with check (
  public.is_org_member(organization_id)
  or public.is_admin()
);

-- Only org owner or admin can revoke certificates
create policy "Org owners can revoke certificates"
on public.certificates for update
using (
  public.is_org_owner(organization_id)
  or public.is_admin()
);

-- ============================================================================
-- 15. NEED UPDATES POLICIES
-- ============================================================================
create policy "Updates are viewable by everyone"
on public.need_updates for select
using (true);

create policy "Org members can post updates"
on public.need_updates for insert
with check (
  exists (
    select 1 from public.needs n
    where n.id = need_updates.need_id
      and (public.is_org_member(n.organization_id) or public.is_admin())
  )
);

-- ============================================================================
-- 16. NOTIFICATIONS POLICIES
-- ============================================================================
create policy "Users can only view their own notifications"
on public.notifications for select
using (user_id = auth.uid());

create policy "Users can update their notifications (mark read)"
on public.notifications for update
using (user_id = auth.uid());

-- ============================================================================
-- 17. REPORTS & AUDIT LOGS POLICIES
-- ============================================================================
create policy "Authenticated users can submit reports"
on public.reports for insert
to authenticated
with check (reporter_id = auth.uid());

create policy "Admins can view and manage all reports"
on public.reports for all
using (public.is_admin());

create policy "Admins can view audit logs"
on public.audit_logs for select
using (public.is_admin());
