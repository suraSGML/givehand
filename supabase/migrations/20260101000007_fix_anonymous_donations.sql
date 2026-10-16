-- ============================================================================
-- GiveHand ET — Migration 7: Fix Anonymous Money Donations
-- Grants the authenticated role proper privileges on money_donations so that
-- a logged-in user can insert a row with user_id = NULL (anonymous donation).
-- Also fixes the select policy so org members can always view their donations.
-- ============================================================================

-- 1. Grant table-level DML privileges to authenticated users.
--    (RLS policies only govern *which rows* a role may access; without a
--    table-level GRANT the privilege check fails before RLS is even evaluated.)
grant select, insert on public.money_donations to authenticated;
grant select on public.money_donations to anon;

-- Also make sure related tables needed for selects are readable.
grant select on public.need_items    to authenticated, anon;
grant select on public.needs         to authenticated, anon;
grant select on public.organizations to authenticated, anon;
grant select on public.profiles      to authenticated;

-- 2. Recreate the INSERT policy to be explicit about the target role and
--    the allowed check: authenticated users may insert a row whose user_id
--    is either their own uid OR null (anonymous mode).
drop policy if exists "Anyone can record a money donation" on public.money_donations;

create policy "Authenticated users can record a money donation"
on public.money_donations
for insert
to authenticated
with check (
  user_id is null            -- anonymous donation (donor toggles "donate anonymously")
  or user_id = auth.uid()   -- normal attributed donation
);

-- 3. Ensure the SELECT policy also lets authenticated users see their own rows
--    (even when user_id is null they submitted the row in the same session;
--    we cannot recover that, so org-member visibility handles confirmed ones).
drop policy if exists "View money donations" on public.money_donations;

create policy "View money donations"
on public.money_donations
for select
using (
  (auth.uid() is not null and user_id = auth.uid())   -- donor sees own rows
  or (status = 'confirmed' and not is_anonymous)      -- public can see confirmed non-anon
  or exists (                                          -- org members see all for their needs
    select 1
    from public.need_items ni
    join public.needs n on n.id = ni.need_id
    where ni.id = money_donations.need_item_id
      and (public.is_org_member(n.organization_id) or public.is_admin())
  )
);
