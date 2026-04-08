# Masters Predictor 2026

## Deploy checklist — 4 steps to live

### Step 1 — Set up Supabase database
1. Go to **supabase.com** → your project → **SQL Editor** → **New query**
2. Paste the entire contents of `supabase-setup.sql` and click **Run**
3. You'll see "Success" — database is ready

### Step 2 — Push to GitHub
1. Go to **github.com** → **New repository** → name it `masters-predictor-2026` → **Create**
2. In your terminal, inside this project folder:
```bash
git init
git add .
git commit -m "initial"
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/masters-predictor-2026.git
git push -u origin main
```

### Step 3 — Deploy on Vercel
1. Go to **vercel.com** → **Add New Project**
2. Import your `masters-predictor-2026` GitHub repo
3. Framework will auto-detect as **Vite** — no settings to change
4. Click **Deploy** — live in ~30 seconds
5. Vercel gives you a URL like `masters-predictor-2026.vercel.app`

### Step 4 — Make yourself admin
1. Open the live app and **sign up** using `Arnojvr@icloud.com`
2. Go back to Supabase → **SQL Editor** → run this one line:
```sql
update profiles set is_admin = true where email = 'Arnojvr@icloud.com';
```
3. Sign out and back in → **Admin panel** appears on your dashboard

---

## How the lock works
- **Frontend**: UI locks and disables all pick editing at 16:00 SAST (14:00 UTC) on Thu 10 Apr
- **Database**: A Postgres trigger on the `picks` table rejects any INSERT/UPDATE/DELETE after that time — server-side, can't be bypassed even if someone hacks the UI

## Updating live scores during the tournament
1. Sign in as admin → tap **Admin — update standings**
2. Enter each player's current leaderboard position, tick **MC** for missed cut
3. Hit **Save Standings** — everyone's leaderboard recalculates instantly

## File structure
```
src/
  lib/
    supabase.js       ← Supabase client (credentials already wired in)
    constants.js      ← Player pool, scoring engine, lock time
  components/
    CountdownBanner   ← Sticky SAST timer on every screen
    HomeScreen        ← Landing page + signup/login
    DashboardScreen   ← Post-login home with score summary
    PickScreen        ← Player selection
    MyPicksScreen     ← Ranked picks + live score breakdown
    LeaderboardScreen ← All players ranked with live recalc
    AdminScreen       ← Update live results (admin only)
  App.jsx             ← Session management, screen routing
  main.jsx            ← Entry point
```

