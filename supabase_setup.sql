-- ═══════════════════════════════════════════════════════════════════════════
-- Run this ONCE in Supabase Dashboard → SQL Editor
-- It sets up the people table, the storage bucket, and all RLS policies.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. People table ─────────────────────────────────────────────────────────

create table if not exists people (
  id                   text        primary key,
  "firstName"          text        not null,
  "lastName"           text        not null,
  dob                  text        not null,
  gender               text        not null check (gender in ('male','female')),
  nationality          text        not null,
  pesel                text        not null unique,
  "createdAt"          bigint      not null,
  "verificationStatus" text        not null default 'none'
                                   check ("verificationStatus" in ('none','pending','verified','rejected')),
  "paymentStatus"      text        not null default 'unpaid'
                                   check ("paymentStatus" in ('unpaid','processing','paid')),
  "verificationDetails" text,
  "idPhoto"            text        -- public Storage URL (not base64)
);

create index if not exists people_created_idx on people ("createdAt" desc);

-- ─── 2. People table RLS ─────────────────────────────────────────────────────

alter table people enable row level security;

drop policy if exists "anon_select"  on people;
drop policy if exists "anon_insert"  on people;
drop policy if exists "anon_update"  on people;
drop policy if exists "anon_delete"  on people;

create policy "anon_select" on people for select to anon using (true);
create policy "anon_insert" on people for insert to anon with check (true);
create policy "anon_update" on people for update to anon using (true) with check (true);
create policy "anon_delete" on people for delete to anon using (true);

-- ─── 3. Storage bucket ───────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'Pesel',
  'Pesel',
  true,           -- public bucket → uploaded files get a stable public URL
  5242880,        -- 5 MB per file
  array['image/jpeg','image/png','image/webp','image/gif','application/pdf']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ─── 4. Storage RLS ──────────────────────────────────────────────────────────

drop policy if exists "anon_upload_docs"     on storage.objects;
drop policy if exists "public_read_docs"     on storage.objects;
drop policy if exists "anon_overwrite_docs"  on storage.objects;

-- Allow anon to upload new files
create policy "anon_upload_docs" on storage.objects
  for insert to anon
  with check (bucket_id = 'Pesel');

-- Allow anyone to read (bucket is public, belt-and-suspenders)
create policy "public_read_docs" on storage.objects
  for select to anon
  using (bucket_id = 'Pesel');

-- Allow anon to overwrite (upsert: true in the client)
create policy "anon_overwrite_docs" on storage.objects
  for update to anon
  using (bucket_id = 'Pesel')
  with check (bucket_id = 'Pesel');
