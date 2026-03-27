-- STT usage tracking: count Deepgram minutes even if user doesn't save a call.
-- This table is used for monthly usage limits (e.g. 20 hours on Pro).

create table if not exists public.stt_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  -- Duration in seconds (allows accurate accumulation across partial minutes).
  duration_seconds int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists stt_usage_events_user_started
  on public.stt_usage_events (user_id, started_at desc);

alter table public.stt_usage_events enable row level security;

create policy "Users can read own stt usage"
  on public.stt_usage_events for select
  using (auth.uid() = user_id);

create policy "Users can insert own stt usage"
  on public.stt_usage_events for insert
  with check (auth.uid() = user_id);

create policy "Users can update own stt usage"
  on public.stt_usage_events for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
