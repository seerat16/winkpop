-- WinKPop payments schema: profiles, listings, orders, seller payout accounts.
-- Every table has Row Level Security. Money-moving writes (orders, payouts)
-- happen only in Edge Functions using the service-role key; clients can never
-- create, price or mark an order paid themselves.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- profiles --
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9._]{6,30}$'),
  display_name text not null default '',
  country text not null default 'US' check (char_length(country) = 2),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles are public" on public.profiles for select using (true);
create policy "users edit their own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "users create their own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Payout accounts are private (never exposed with the public profile).
create table public.seller_accounts (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  stripe_account_id text unique not null,
  payouts_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.seller_accounts enable row level security;
create policy "sellers read their own payout account" on public.seller_accounts
  for select using (auth.uid() = user_id);
-- No insert/update policies: only the service role (Edge Functions) writes here.

-- ---------------------------------------------------------------- listings --
create type public.listing_status as enum ('active', 'reserved', 'sold', 'inactive');

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  catalog_id text,
  title text not null check (char_length(title) between 1 and 140),
  description text not null default '' check (char_length(description) <= 2000),
  condition text not null check (condition in ('Mint', 'Near Mint', 'Good', 'Damaged')),
  intent text not null check (intent in ('sale', 'trade', 'both')),
  -- Integer cents; at least $1.00 and in $0.05 steps (§6H) — enforced here, not just in the app.
  price_cents integer not null check (price_cents >= 100 and price_cents % 5 = 0),
  status public.listing_status not null default 'active',
  reserved_until timestamptz,
  created_at timestamptz not null default now()
);
create index on public.listings (seller_id);
create index on public.listings (status);
alter table public.listings enable row level security;

create policy "active listings are public" on public.listings
  for select using (status in ('active', 'reserved') or auth.uid() = seller_id);
create policy "sellers create their own listings" on public.listings
  for insert with check (auth.uid() = seller_id and status = 'active');
-- Sellers may edit only while the listing isn't in a checkout or sold.
create policy "sellers edit their own open listings" on public.listings
  for update using (auth.uid() = seller_id and status in ('active', 'inactive'))
  with check (auth.uid() = seller_id and status in ('active', 'inactive'));
create policy "sellers delete their own open listings" on public.listings
  for delete using (auth.uid() = seller_id and status in ('active', 'inactive'));

-- ------------------------------------------------------------------ orders --
create type public.order_status as enum (
  'pending_payment', 'paid', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded'
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles (id),
  seller_id uuid not null references public.profiles (id),
  status public.order_status not null default 'pending_payment',
  subtotal_cents integer not null check (subtotal_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  buyer_fee_cents integer not null check (buyer_fee_cents >= 0),
  seller_payout_cents integer not null check (seller_payout_cents >= 0),
  currency text not null default 'usd',
  checkout_session_id text,
  payment_intent_id text,
  charge_id text,
  transfer_group text not null,
  transfer_id text,
  tracking_number text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  shipped_at timestamptz,
  completed_at timestamptz,
  check (buyer_id <> seller_id)
);
create index on public.orders (buyer_id);
create index on public.orders (seller_id);
create index on public.orders (checkout_session_id);
alter table public.orders enable row level security;
create policy "buyers and sellers read their orders" on public.orders
  for select using (auth.uid() in (buyer_id, seller_id));
-- No client write policies at all.

create table public.order_items (
  order_id uuid not null references public.orders (id) on delete cascade,
  listing_id uuid not null references public.listings (id),
  price_cents integer not null check (price_cents >= 0),
  primary key (order_id, listing_id)
);
alter table public.order_items enable row level security;
create policy "order parties read items" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and auth.uid() in (o.buyer_id, o.seller_id))
);

-- Webhook idempotency: each Stripe event is processed once.
create table public.stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);
alter table public.stripe_events enable row level security; -- no policies: service role only

-- Release listings whose checkout was abandoned (also handled by the
-- checkout.session.expired webhook; this is a safety net for a cron job).
create or replace function public.release_stale_reservations() returns void
language sql security definer set search_path = public as $$
  update public.listings set status = 'active', reserved_until = null
  where status = 'reserved' and reserved_until < now();
$$;
revoke all on function public.release_stale_reservations() from public, anon, authenticated;

-- Create a profile row for every new auth user (username can be changed later).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, display_name)
  values (new.id, 'user_' || substr(replace(new.id::text, '-', ''), 1, 10), split_part(coalesce(new.email, ''), '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
