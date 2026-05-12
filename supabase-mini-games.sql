-- ─── MINI-GAMES MIGRATION ─────────────────────────────────────────────────────
-- Run this in the Supabase SQL editor after the main supabase-setup.sql

-- ── Pick 5 ────────────────────────────────────────────────────────────────────
create table if not exists public.pick5_picks (
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id int not null,
  position int not null check (position between 1 and 5),
  primary key (user_id, player_id)
);
alter table public.pick5_picks enable row level security;
create policy "Users manage own pick5 picks" on public.pick5_picks
  for all using (auth.uid() = user_id);

-- ── H2H Matchups (admin-created) ──────────────────────────────────────────────
create table if not exists public.h2h_matchups (
  id serial primary key,
  player_a int not null,
  player_b int not null,
  created_at timestamptz default now()
);
alter table public.h2h_matchups enable row level security;
-- Any authenticated user can read; any authenticated user can insert (admin-gated in UI)
create policy "Authenticated users read h2h matchups" on public.h2h_matchups
  for select using (auth.uid() is not null);
create policy "Authenticated users manage h2h matchups" on public.h2h_matchups
  for all using (auth.uid() is not null);

-- ── H2H User Picks ─────────────────────────────────────────────────────────────
create table if not exists public.h2h_picks (
  user_id uuid not null references auth.users(id) on delete cascade,
  matchup_id int not null references public.h2h_matchups(id) on delete cascade,
  picked_player int not null,
  primary key (user_id, matchup_id)
);
alter table public.h2h_picks enable row level security;
create policy "Users manage own h2h picks" on public.h2h_picks
  for all using (auth.uid() = user_id);
-- Leaderboard needs to read all picks
create policy "Authenticated users read all h2h picks" on public.h2h_picks
  for select using (auth.uid() is not null);

-- ── Betterball Pairs ───────────────────────────────────────────────────────────
create table if not exists public.betterball_pairs (
  user_id uuid not null references auth.users(id) on delete cascade,
  pair_num int not null check (pair_num between 1 and 5),
  player_a int not null,
  player_b int not null,
  primary key (user_id, pair_num)
);
alter table public.betterball_pairs enable row level security;
create policy "Users manage own betterball pairs" on public.betterball_pairs
  for all using (auth.uid() = user_id);
create policy "Authenticated users read all betterball pairs" on public.betterball_pairs
  for select using (auth.uid() is not null);
