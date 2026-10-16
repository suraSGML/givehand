-- ============================================================================
-- GiveHand ET — Phase 2 Database Migration 4: Storage Buckets & Storage RLS
-- Creates all platform buckets with appropriate public/private access policies.
-- ============================================================================

-- 1. INSERT BUCKETS INTO storage.buckets (if not exists)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('org-logos', 'org-logos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('covers', 'covers', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('material-photos', 'material-photos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('org-documents', 'org-documents', false, 20971520, array['application/pdf', 'image/jpeg', 'image/png']),
  ('payment-proofs', 'payment-proofs', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2. STORAGE RLS POLICIES

-- Avatars: Public read, User write own folder
create policy "Public Access to Avatars"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update their own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Org Logos & Covers: Public read, Org members upload
create policy "Public Access to Org Logos"
on storage.objects for select
using (bucket_id in ('org-logos', 'covers', 'material-photos'));

create policy "Org members can upload logos and covers"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('org-logos', 'covers')
);

create policy "Users can upload material photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'material-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Org Documents: Private — Org members & admins only
create policy "Org members can view their documents"
on storage.objects for select
to authenticated
using (
  bucket_id = 'org-documents'
  and (
    public.is_admin()
    or exists (
      select 1 from public.organizations
      where id::text = (storage.foldername(name))[1]
        and public.is_org_member(id)
    )
  )
);

create policy "Org members can upload org documents"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'org-documents'
  and (
    public.is_admin()
    or exists (
      select 1 from public.organizations
      where id::text = (storage.foldername(name))[1]
        and public.is_org_member(id)
    )
  )
);

-- Payment Proofs: Private — Donor, Org Members & Admins only
create policy "Authorized parties can view payment proofs"
on storage.objects for select
to authenticated
using (
  bucket_id = 'payment-proofs'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1 from public.money_donations md
      join public.need_items ni on ni.id = md.need_item_id
      join public.needs n on n.id = ni.need_id
      where md.proof_url like '%' || name || '%'
        and public.is_org_member(n.organization_id)
    )
  )
);

create policy "Donors can upload payment proofs"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);
