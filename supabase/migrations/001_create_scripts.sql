-- Scripts table: user-owned talk tracks
create table if not exists public.scripts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  category text not null check (category in ('Opening', 'Discovery', 'Objections', 'Closing', 'General')),
  sections jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for listing by user and updated_at
create index if not exists scripts_user_updated on public.scripts (user_id, updated_at desc);

-- RLS: users can only see and modify their own scripts
alter table public.scripts enable row level security;

create policy "Users can read own scripts"
  on public.scripts for select
  using (auth.uid() = user_id);

create policy "Users can insert own scripts"
  on public.scripts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own scripts"
  on public.scripts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own scripts"
  on public.scripts for delete
  using (auth.uid() = user_id);

-- Keep updated_at in sync
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists scripts_updated_at on public.scripts;
create trigger scripts_updated_at
  before update on public.scripts
  for each row execute function public.set_updated_at();
