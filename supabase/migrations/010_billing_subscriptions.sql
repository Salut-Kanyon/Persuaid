-- Stripe-linked subscription (one row per user; updated by webhook with service role).

create table if not exists public.billing_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  plan text not null check (plan in ('pro', 'team')),
  status text not null,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists billing_subscriptions_stripe_sub
  on public.billing_subscriptions (stripe_subscription_id);

alter table public.billing_subscriptions enable row level security;

create policy "Users can read own billing subscription"
  on public.billing_subscriptions
  for select
  using (auth.uid() = user_id);
