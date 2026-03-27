-- Redeem agency invites via SECURITY DEFINER RPC so the app does not need SUPABASE_SERVICE_ROLE_KEY
-- (invite lookup + inserts bypass RLS safely inside the function; caller must be authenticated).

create extension if not exists pgcrypto;

create or replace function public.redeem_agency_invite(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_normalized text;
  v_hash text;
  v_inv public.agency_invites%rowtype;
  v_agency public.agencies%rowtype;
  v_member_count int;
  v_existing public.agency_members%rowtype;
begin
  v_uid := auth.uid();
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  v_normalized := lower(trim(regexp_replace(coalesce(p_token, ''), '\s', '', 'g')));
  if length(v_normalized) <> 64 or v_normalized !~ '^[0-9a-f]+$' then
    return jsonb_build_object('ok', false, 'error', 'malformed_token');
  end if;

  -- Must match lib/agency.ts hashInviteToken (sha256 of utf-8 bytes)
  v_hash := encode(digest(convert_to(v_normalized, 'UTF8'), 'sha256'), 'hex');

  if not exists (select 1 from public.agency_invites where token_hash = v_hash) then
    return jsonb_build_object('ok', false, 'error', 'invalid_invite');
  end if;

  select * into v_inv from public.agency_invites where token_hash = v_hash limit 1;

  if v_inv.expires_at is not null and v_inv.expires_at < now() then
    return jsonb_build_object('ok', false, 'error', 'expired');
  end if;

  if v_inv.uses >= v_inv.max_uses then
    return jsonb_build_object('ok', false, 'error', 'no_uses_left');
  end if;

  if not exists (select 1 from public.agencies where id = v_inv.agency_id) then
    return jsonb_build_object('ok', false, 'error', 'agency_not_found');
  end if;

  select * into v_agency from public.agencies where id = v_inv.agency_id;

  select count(*)::int into v_member_count from public.agency_members where agency_id = v_agency.id;

  if v_member_count >= v_agency.seats_total then
    return jsonb_build_object('ok', false, 'error', 'no_seats');
  end if;

  select * into v_existing from public.agency_members where user_id = v_uid limit 1;
  if v_existing.user_id is not null then
    if v_existing.agency_id = v_agency.id then
      return jsonb_build_object(
        'ok', true,
        'agency_id', v_agency.id,
        'already_member', true
      );
    end if;
    return jsonb_build_object('ok', false, 'error', 'other_agency');
  end if;

  insert into public.agency_members (agency_id, user_id, role)
  values (v_agency.id, v_uid, 'member');

  update public.agency_invites
  set uses = uses + 1
  where id = v_inv.id;

  return jsonb_build_object(
    'ok', true,
    'agency_id', v_agency.id,
    'already_member', false
  );
end;
$$;

revoke all on function public.redeem_agency_invite(text) from public;
grant execute on function public.redeem_agency_invite(text) to authenticated;
