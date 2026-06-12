-- Run this in Supabase Dashboard → SQL Editor
-- Allows the browser (anon key) to read and write the people table.
-- The anon key is safe to expose in frontend code when RLS is enabled.

alter table people enable row level security;

-- Allow anonymous SELECT
create policy "anon_select" on people
  for select
  to anon
  using (true);

-- Allow anonymous INSERT (new applications)
create policy "anon_insert" on people
  for insert
  to anon
  with check (true);

-- Allow anonymous UPDATE (status changes, payment, verification)
create policy "anon_update" on people
  for update
  to anon
  using (true)
  with check (true);

-- Allow anonymous DELETE (admin clear / per-record delete)
create policy "anon_delete" on people
  for delete
  to anon
  using (true);
