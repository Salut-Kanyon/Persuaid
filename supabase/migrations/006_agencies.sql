-- Agency plan (MVP): org with seat cap, members get Pro-equivalent entitlements via app logic.

create table if not exists public.agencies (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Agency',
  seats_total int not null default 1 check (seats_total >= 1),
  created_at timestamptz not null default now()
);

create table if not exists public.agency_members (
  agency_id uuid not null references public.agencies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (agency_id, user_id)
);

create unique index if not exists agency_members_one_user on public.agency_members (user_id);

create index if not exists agency_members_user_id on public.agency_members (user_id);

create table if not exists public.agency_invites (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  token_hash text not null unique,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  max_uses int not null default 1 check (max_uses >= 1),
  uses int not null default 0 check (uses >= 0),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists agency_invites_agency on public.agency_invites (agency_id);

alter table public.agencies enable row level security;
alter table public.agency_members enable row level security;
alter table public.agency_invites enable row level security;

-- agencies: owner or member can read
create policy "agencies_select_owner_or_member"
  on public.agencies for select
  using (
    auth.uid() = owner_user_id
    or exists (
      select 1 from public.agency_members m
      where m.agency_id = agencies.id and m.user_id = auth.uid()
    )
  );

-- agency_members: own row, or owner of agency can see all members
create policy "agency_members_select_self_or_owner"
  on public.agency_members for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.agencies a
      where a.id = agency_members.agency_id and a.owner_user_id = auth.uid()
    )
  );

-- agency_invites: agency owner can read/write
create policy "agency_invites_select_owner"
  on public.agency_invites for select
  using (
    exists (
      select 1 from public.agencies a
      where a.id = agency_invites.agency_id and a.owner_user_id = auth.uid()
    )
  );

create policy "agency_invites_insert_owner"
  on public.agency_invites for insert
  with check (
    auth.uid() = created_by_user_id
    and exists (
      select 1 from public.agencies a
      where a.id = agency_invites.agency_id and a.owner_user_id = auth.uid()
    )
  );

create policy "agency_invites_update_owner"
  on public.agency_invites for update
  using (
    exists (
      select 1 from public.agencies a
      where a.id = agency_invites.agency_id and a.owner_user_id = auth.uid()
    )
  );

-- When an agency row is created, add the owner as a member (so entitlements + seat counts work).
create or replace function public.agency_after_insert_add_owner_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.agency_members (agency_id, user_id, role)
  values (new.id, new.owner_user_id, 'owner')
  on conflict (agency_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists agency_after_insert_add_owner_member on public.agencies;
create trigger agency_after_insert_add_owner_member
  after insert on public.agencies
  for each row execute function public.agency_after_insert_add_owner_member();
