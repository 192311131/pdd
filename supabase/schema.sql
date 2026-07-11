-- AestheticShade AI — Supabase schema
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Creates the `cases` table with Row Level Security so each authenticated
-- dentist can only read/write their OWN cases.

create table if not exists public.cases (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  patient_name   text,
  patient_id     text,
  case_type      text,
  notes          text,
  detected_shade text,
  scan_results   jsonb,
  planner_config jsonb,
  created_at     timestamptz not null default now()
);

create index if not exists cases_user_created_idx
  on public.cases (user_id, created_at desc);

-- Row Level Security --------------------------------------------------------
alter table public.cases enable row level security;

drop policy if exists "cases_select_own" on public.cases;
create policy "cases_select_own" on public.cases
  for select using (auth.uid() = user_id);

drop policy if exists "cases_insert_own" on public.cases;
create policy "cases_insert_own" on public.cases
  for insert with check (auth.uid() = user_id);

drop policy if exists "cases_update_own" on public.cases;
create policy "cases_update_own" on public.cases
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "cases_delete_own" on public.cases;
create policy "cases_delete_own" on public.cases
  for delete using (auth.uid() = user_id);
