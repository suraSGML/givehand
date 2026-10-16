-- ============================================================================
-- GiveHand ET — Phase 2 Database Migration 2: Views, Functions & Triggers
-- ============================================================================

-- 1. AUTO-UPDATE UPDATED_AT TIMESTAMP
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_set_updated_at_profiles
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger trigger_set_updated_at_organizations
before update on public.organizations
for each row execute function public.set_updated_at();

create trigger trigger_set_updated_at_needs
before update on public.needs
for each row execute function public.set_updated_at();

-- 2. AUTOMATIC PROFILE CREATION ON AUTH SIGNUP
-- Automatically runs when a user is created in auth.users
create or replace function public.handle_new_user()
returns trigger as $$
declare
  raw_role text;
  user_role_val public.user_role;
  user_full_name text;
begin
  raw_role := coalesce(new.raw_user_meta_data->>'role', 'supporter');
  if raw_role in ('supporter', 'organization', 'admin') then
    user_role_val := raw_role::public.user_role;
  else
    user_role_val := 'supporter'::public.user_role;
  end if;

  user_full_name := coalesce(new.raw_user_meta_data->>'full_name', '');

  insert into public.profiles (id, role, full_name, created_at, updated_at)
  values (new.id, user_role_val, user_full_name, now(), now())
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger attached to auth.users (wrapped in conditional block for testing safety)
do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'auth' and tablename = 'users') then
    drop trigger if exists on_auth_user_created on auth.users;
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end $$;

-- 3. PROGRESS CALCULATION VIEWS (Computed purely from confirmed/received records)
create or replace view public.need_item_progress as
select
  ni.id as need_item_id,
  ni.need_id,
  ni.item_type,
  ni.title,
  ni.target_quantity,
  ni.target_amount,
  ni.unit,
  -- Volunteers metrics
  coalesce(va.confirmed_volunteers, 0) as confirmed_volunteers,
  coalesce(va.attended_volunteers, 0) as attended_volunteers,
  coalesce(va.total_hours_logged, 0.00) as total_hours_logged,
  -- Materials metrics
  coalesce(mp.pledged_quantity, 0) as pledged_material_quantity,
  coalesce(mp.received_quantity, 0) as received_material_quantity,
  -- Money metrics
  coalesce(md.pledged_amount, 0.00) as pledged_money_amount,
  coalesce(md.confirmed_amount, 0.00) as confirmed_money_amount,
  -- Overall percentage computation (0% - 100%)
  case
    when ni.item_type = 'volunteer' and coalesce(ni.target_quantity, 0) > 0 then
      round(least(100.0, (coalesce(va.confirmed_volunteers, 0)::numeric / ni.target_quantity) * 100.0), 1)
    when ni.item_type = 'material' and coalesce(ni.target_quantity, 0) > 0 then
      round(least(100.0, (coalesce(mp.received_quantity, 0)::numeric / ni.target_quantity) * 100.0), 1)
    when ni.item_type = 'money' and coalesce(ni.target_amount, 0) > 0 then
      round(least(100.0, (coalesce(md.confirmed_amount, 0)::numeric / ni.target_amount) * 100.0), 1)
    else 0.0
  end as progress_percentage
from public.need_items ni
-- Join volunteer applications aggregations
left join (
  select
    need_item_id,
    count(*) filter (where status in ('approved', 'confirmed', 'attended', 'completed')) as confirmed_volunteers,
    count(*) filter (where status in ('attended', 'completed')) as attended_volunteers,
    sum(coalesce(hours_logged, 0.00)) as total_hours_logged
  from public.volunteer_applications
  group by need_item_id
) va on va.need_item_id = ni.id
-- Join material pledges aggregations
left join (
  select
    need_item_id,
    sum(quantity) filter (where status not in ('rejected', 'cancelled')) as pledged_quantity,
    sum(coalesce(received_quantity, 0)) filter (where status in ('received', 'partially_received')) as received_quantity
  from public.material_pledges
  group by need_item_id
) mp on mp.need_item_id = ni.id
-- Join money donations aggregations
left join (
  select
    need_item_id,
    sum(amount) filter (where status in ('pledged', 'payment_submitted', 'confirmed')) as pledged_amount,
    sum(amount) filter (where status = 'confirmed') as confirmed_amount
  from public.money_donations
  group by need_item_id
) md on md.need_item_id = ni.id;

-- OVERALL NEED PROGRESS VIEW
create or replace view public.need_overall_progress as
select
  n.id as need_id,
  n.title,
  n.status,
  n.urgency,
  count(nip.need_item_id) as total_items,
  coalesce(round(avg(nip.progress_percentage), 1), 0.0) as average_progress
from public.needs n
left join public.need_item_progress nip on nip.need_id = n.id
group by n.id, n.title, n.status, n.urgency;

-- 4. AUTO-CALCULATE VOLUNTEER HOURS ON CHECK-OUT
create or replace function public.calculate_volunteer_hours()
returns trigger as $$
declare
  diff_hours numeric(6, 2);
begin
  if new.checked_out_at is not null and new.checked_in_at is not null then
    diff_hours := round((extract(epoch from (new.checked_out_at - new.checked_in_at)) / 3600.0)::numeric, 2);
    if diff_hours < 0 then
      diff_hours := 0.00;
    end if;
    new.hours_logged := diff_hours;
    if new.status in ('confirmed', 'attended') then
      new.status := 'completed';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trigger_calculate_volunteer_hours
before insert or update on public.volunteer_applications
for each row execute function public.calculate_volunteer_hours();

-- 5. CAPACITY ENFORCEMENT ON VOLUNTEER SHIFTS
create or replace function public.check_volunteer_shift_capacity()
returns trigger as $$
declare
  shift_cap integer;
  current_count integer;
begin
  if new.shift_id is not null and new.status in ('approved', 'confirmed') then
    select capacity into shift_cap from public.volunteer_shifts where id = new.shift_id;
    if shift_cap is not null then
      select count(*) into current_count
      from public.volunteer_applications
      where shift_id = new.shift_id
        and status in ('approved', 'confirmed', 'attended', 'completed')
        and id != coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

      if current_count >= shift_cap then
        raise exception 'Shift is at maximum capacity (% volunteers). Cannot approve or confirm.', shift_cap;
      end if;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trigger_check_volunteer_shift_capacity
before insert or update on public.volunteer_applications
for each row execute function public.check_volunteer_shift_capacity();

-- 6. CERTIFICATE PUBLIC CODE GENERATOR
create or replace function public.generate_certificate_code()
returns trigger as $$
declare
  generated_code text;
  unique_found boolean := false;
  attempts integer := 0;
begin
  if new.public_code is null or trim(new.public_code) = '' then
    while not unique_found and attempts < 10 loop
      generated_code := 'GH-' || extract(year from now())::text || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
      if not exists (select 1 from public.certificates where public_code = generated_code) then
        unique_found := true;
      end if;
      attempts := attempts + 1;
    end loop;
    new.public_code := generated_code;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trigger_generate_certificate_code
before insert on public.certificates
for each row execute function public.generate_certificate_code();

-- 7. NOTIFICATION TRIGGERS
-- Trigger on Volunteer Application status update
create or replace function public.notify_volunteer_application_change()
returns trigger as $$
begin
  if tg_op = 'UPDATE' and old.status != new.status then
    insert into public.notifications (user_id, type, title, body, link)
    values (
      new.user_id,
      'application_status',
      'Volunteer Application Update',
      'Your application status changed to ' || replace(new.status::text, '_', ' ') || '.',
      '/dashboard/commitments'
    );
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trigger_notify_volunteer_application_change
after update on public.volunteer_applications
for each row execute function public.notify_volunteer_application_change();

-- Trigger on Money Donation status update
create or replace function public.notify_money_donation_change()
returns trigger as $$
begin
  if tg_op = 'UPDATE' and old.status != new.status and new.user_id is not null then
    insert into public.notifications (user_id, type, title, body, link)
    values (
      new.user_id,
      'donation_confirmed',
      'Donation ' || initcap(new.status::text),
      case
        when new.status = 'confirmed' then 'Thank you! Your donation of ' || new.amount || ' ETB has been confirmed.'
        when new.status = 'rejected' then 'Your donation reference was rejected. Reason: ' || coalesce(new.reject_reason, 'None specified')
        else 'Your donation status is now ' || new.status::text
      end,
      '/dashboard/donations'
    );
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trigger_notify_money_donation_change
after update on public.money_donations
for each row execute function public.notify_money_donation_change();

-- 8. AUDIT LOGGING HELPER FUNCTION
create or replace function public.log_audit_event(
  p_actor_id uuid,
  p_action text,
  p_target_type text,
  p_target_id uuid,
  p_details jsonb default '{}'::jsonb
) returns uuid as $$
declare
  log_id uuid;
begin
  insert into public.audit_logs (actor_id, action, target_type, target_id, details)
  values (p_actor_id, p_action, p_target_type, p_target_id, p_details)
  returning id into log_id;
  return log_id;
end;
$$ language plpgsql security definer;
