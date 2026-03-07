-- Sessions table: user-owned call/session records for analytics
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_minutes int not null default 0,
  outcome text check (outcome is null or outcome in ('Won', 'Lost', 'Pending', 'No answer')),
  script_id uuid references public.scripts(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists sessions_user_started on public.sessions (user_id, started_at desc);

alter table public.sessions enable row level security;

create policy "Users can read own sessions"
  on public.sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on public.sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on public.sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own sessions"
  on public.sessions for delete
  using (auth.uid() = user_id);
