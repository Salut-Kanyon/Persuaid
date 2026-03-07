# Supabase setup

## Scripts table

To make the **Scripts** page work with real data, create the `scripts` table in Supabase:

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **SQL Editor**.
3. Copy the contents of `migrations/001_create_scripts.sql` and run it.

That creates the `scripts` table, RLS policies (so users only see their own scripts), and a trigger to keep `updated_at` in sync. After running it, the Scripts page will load, create, edit, and delete scripts in Supabase.

## Notes table

To make the **Notes** page work with real data, create the `notes` table:

1. In the same project, go to **SQL Editor**.
2. Copy the contents of `migrations/002_create_notes.sql` and run it.

That creates the `notes` table (title, content, tags, completed), RLS policies, and an `updated_at` trigger. The Notes page will then support full CRUD and tag filtering.

## Sessions table (Analytics)

To make the **Analytics** page work with real data, create the `sessions` table:

1. In the same project, go to **SQL Editor**.
2. Copy the contents of `migrations/003_create_sessions.sql` and run it.

That creates the `sessions` table (title, started_at, ended_at, duration_minutes, outcome, optional script_id), RLS policies, and indexes. The Analytics page will then show KPIs, a 14-day calls chart, and let you log, edit, and delete sessions.
