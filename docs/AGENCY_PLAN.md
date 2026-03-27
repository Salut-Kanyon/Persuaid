# Agency plan (MVP)

## What it does

- An **agency** row defines an owner, a display name, and **`seats_total`** (max people in the agency, including the owner).
- The owner is **auto-added** to `agency_members` when the agency is inserted (see migration `006_agencies.sql`).
- **Agency members** get **Pro-equivalent** plan in `/api/me/entitlements` and `/api/me/usage` (20 hours/month per user).
- The owner creates **invite links** from **Settings → Agency**; agents open `/redeem/<token>` while signed in.

## Required server config

- `SUPABASE_SERVICE_ROLE_KEY` must be set on the Next.js server so `/api/agency/redeem` can add members and bump invite usage (RLS does not allow arbitrary inserts from the anon client).

## Provision an agency (manual SQL)

Run in Supabase SQL editor after applying migrations:

```sql
insert into public.agencies (owner_user_id, name, seats_total)
values (
  'YOUR_USER_UUID'::uuid,
  'My Agency',
  10
);
-- Trigger adds the owner to agency_members as role "owner".
```

Adjust `seats_total` to match your contract.

## Stripe (later)

Wire Stripe products/webhooks to set `seats_total` and create the `agencies` row automatically.
