-- Fix infinite recursion: agencies policy queried agency_members, whose policy queried agencies.
-- Use SECURITY DEFINER helpers so membership/ownership checks do not re-enter RLS.

create or replace function public.agency_is_owner(p_agency_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.agencies a
    where a.id = p_agency_id and a.owner_user_id = p_user_id
  );
$$;

create or replace function public.agency_user_is_member(p_agency_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.agency_members m
    where m.agency_id = p_agency_id and m.user_id = p_user_id
  );
$$;

revoke all on function public.agency_is_owner(uuid, uuid) from public;
revoke all on function public.agency_user_is_member(uuid, uuid) from public;
grant execute on function public.agency_is_owner(uuid, uuid) to authenticated, service_role;
grant execute on function public.agency_user_is_member(uuid, uuid) to authenticated, service_role;

drop policy if exists "agencies_select_owner_or_member" on public.agencies;
drop policy if exists "agency_members_select_self_or_owner" on public.agency_members;
drop policy if exists "agency_invites_select_owner" on public.agency_invites;
drop policy if exists "agency_invites_insert_owner" on public.agency_invites;
drop policy if exists "agency_invites_update_owner" on public.agency_invites;

create policy "agencies_select_owner_or_member"
  on public.agencies for select
  using (
    auth.uid() = owner_user_id
    or public.agency_user_is_member(id, auth.uid())
  );

create policy "agency_members_select_self_or_owner"
  on public.agency_members for select
  using (
    auth.uid() = user_id
    or public.agency_is_owner(agency_id, auth.uid())
  );

create policy "agency_invites_select_owner"
  on public.agency_invites for select
  using (public.agency_is_owner(agency_id, auth.uid()));

create policy "agency_invites_insert_owner"
  on public.agency_invites for insert
  with check (
    auth.uid() = created_by_user_id
    and public.agency_is_owner(agency_id, auth.uid())
  );

create policy "agency_invites_update_owner"
  on public.agency_invites for update
  using (public.agency_is_owner(agency_id, auth.uid()));
