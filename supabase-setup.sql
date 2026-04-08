-- ============================================================
-- MASTERS PREDICTOR 2026 — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. PROFILES TABLE (extends auth.users)
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null,
  email         text,
  is_admin      boolean default false,
  created_at    timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. PICKS TABLE
create table if not exists public.picks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  player_id   int not null,
  position    int not null check (position between 1 and 20),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (user_id, player_id),
  unique (user_id, position)
);

-- Block edits after lock time (Thu 10 Apr 2026 14:00 UTC = 16:00 SAST)
create or replace function public.enforce_picks_lock()
returns trigger as $$
begin
  if now() >= timestamptz '2026-04-10T14:00:00Z' then
    raise exception 'Picks are locked. Closed at 16:00 SAST on Thursday 10 April.';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists picks_lock_trigger on public.picks;
create trigger picks_lock_trigger
  before insert or update or delete on public.picks
  for each row execute procedure public.enforce_picks_lock();


-- 3. LIVE RESULTS TABLE
create table if not exists public.live_results (
  player_id   int primary key,
  position    int not null default 50,
  missed_cut  boolean default false,
  updated_at  timestamptz default now()
);

-- Seed with initial placeholder positions
insert into public.live_results (player_id, position, missed_cut)
values
  (1,1,false),(2,2,false),(3,3,false),(4,4,false),(5,5,false),
  (6,6,false),(7,7,false),(8,8,false),(9,9,false),(10,10,false),
  (11,11,false),(12,12,false),(13,13,false),(14,14,false),(15,15,false),
  (16,16,false),(17,17,false),(18,18,false),(19,19,false),(20,20,false),
  (21,21,false),(22,22,false),(23,23,false),(24,24,false),(25,25,false)
on conflict (player_id) do nothing;


-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles     enable row level security;
alter table public.picks         enable row level security;
alter table public.live_results  enable row level security;

-- Profiles: anyone can read, only own row can write
create policy "profiles_select"  on public.profiles for select using (true);
create policy "profiles_insert"  on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update"  on public.profiles for update using (auth.uid() = id);

-- Picks: anyone can read (for leaderboard), only own picks can write
create policy "picks_select"  on public.picks for select using (true);
create policy "picks_insert"  on public.picks for insert with check (auth.uid() = user_id);
create policy "picks_update"  on public.picks for update using (auth.uid() = user_id);
create policy "picks_delete"  on public.picks for delete using (auth.uid() = user_id);

-- Live results: anyone can read, only admins can write
create policy "live_results_select" on public.live_results for select using (true);
create policy "live_results_insert" on public.live_results for insert
  with check ((select is_admin from public.profiles where id = auth.uid()));
create policy "live_results_update" on public.live_results for update
  using ((select is_admin from public.profiles where id = auth.uid()));


-- ============================================================
-- 5. SET YOUR ADMIN ACCOUNT
-- Replace the email below with YOUR email address
-- Run this AFTER you create your account in the app
-- ============================================================

update public.profiles
set is_admin = true
where email = 'Arnojvr@icloud.com';


-- ============================================================
-- Done! Your database is ready.
-- ============================================================
