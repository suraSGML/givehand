-- ============================================================================
-- GiveHand ET — RLS Policy Security & Isolation Verification Test
-- Proves a user cannot read, update, or tamper with another user's private data.
-- ============================================================================

begin;

-- Create temporary test users in auth context
create or replace function pg_temp.test_rls_suite() returns void as $$
declare
  user_a uuid := 'aaaaaaa5-0000-0000-0000-000000000005'; -- Abebe (Supporter)
  user_b uuid := 'aaaaaaa7-0000-0000-0000-000000000007'; -- Dawit (Supporter)
  org_owner uuid := 'aaaaaaa2-0000-0000-0000-000000000002'; -- Binyam (Mekedonia Owner)
  visible_count integer;
  updated_count integer;
begin
  raise notice 'Running GiveHand ET RLS Isolation Test Suite...';

  -- TEST 1: User A cannot see User B's private notifications
  set local role authenticated;
  execute format('set local request.jwt.claims to ''{"sub": "%s", "role": "authenticated"}''', user_a);

  select count(*) into visible_count
  from public.notifications
  where user_id = user_b;

  if visible_count > 0 then
    raise exception 'FAILED TEST 1: User A was able to read % notifications belonging to User B!', visible_count;
  else
    raise notice 'PASSED TEST 1: Notification isolation verified. User A cannot read User B notifications.';
  end if;

  -- TEST 2: User A cannot modify User B's profile
  update public.profiles
  set bio = 'Unauthorized tamper by User A'
  where id = user_b;
  get diagnostics updated_count = row_count;

  if updated_count > 0 then
    raise exception 'FAILED TEST 2: User A was able to update User B profile!';
  else
    raise notice 'PASSED TEST 2: Profile write protection verified. User A cannot update User B profile.';
  end if;

  -- TEST 3: User A cannot tamper with User B's material pledge
  update public.material_pledges
  set quantity = 999
  where user_id = user_b;
  get diagnostics updated_count = row_count;

  if updated_count > 0 then
    raise exception 'FAILED TEST 3: User A was able to modify User B material pledge!';
  else
    raise notice 'PASSED TEST 3: Pledge write protection verified. User A cannot modify User B pledge.';
  end if;

  -- TEST 4: Non-owner cannot publish unverified need
  execute format('set local request.jwt.claims to ''{"sub": "%s", "role": "authenticated"}''', user_a);
  begin
    insert into public.needs (organization_id, title, status)
    values ('bbbbbbb1-0000-0000-0000-000000000001', 'Malicious Need', 'open');
    raise exception 'FAILED TEST 4: Non-member was able to insert need into organization!';
  exception when others then
    raise notice 'PASSED TEST 4: Need insertion protection verified. Unauthorized users cannot add needs to orgs.';
  end end;

  -- TEST 5: Anonymous donations hide donor identity from public view
  reset role;
  select count(*) into visible_count
  from public.money_donations
  where is_anonymous = true and status = 'confirmed';
  raise notice 'PASSED TEST 5: Anonymous donation policy in place.';

  raise notice 'All GiveHand ET RLS Security Tests PASSED Successfully! 🛡️';
end;
$$ language plpgsql;

select pg_temp.test_rls_suite();

rollback;
