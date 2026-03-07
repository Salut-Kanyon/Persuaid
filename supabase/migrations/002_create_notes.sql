-- Notes table: user-owned notes with optional title, content, tags, and completed flag
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  content text not null default '',
  tags text[] not null default '{}',
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_user_updated on public.notes (user_id, updated_at desc);

alter table public.notes enable row level security;

create policy "Users can read own notes"
  on public.notes for select
  using (auth.uid() = user_id);

create policy "Users can insert own notes"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notes"
  on public.notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own notes"
  on public.notes for delete
  using (auth.uid() = user_id);

drop trigger if exists notes_updated_at on public.notes;
create trigger notes_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();
