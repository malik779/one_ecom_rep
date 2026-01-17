create extension if not exists "pgcrypto";

create type public.order_status as enum ('pending', 'paid', 'failed', 'refunded');
create type public.payment_status as enum ('created', 'processing', 'paid', 'failed');
create type public.payment_provider as enum ('stripe');

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.is_admin(user_id uuid)
returns boolean as $$
  select exists(select 1 from public.admin_users where admin_users.user_id = $1);
$$ language sql stable security definer;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  price numeric(10, 2) not null,
  currency text not null default 'USD',
  image_url text,
  features text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_active_idx on public.products (is_active);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  billing_address text not null,
  country text not null,
  status public.order_status not null default 'pending',
  total_amount numeric(10, 2) not null,
  currency text not null default 'USD',
  transaction_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_status_idx on public.orders (status);
create index orders_email_idx on public.orders (email);
create index orders_created_idx on public.orders (created_at);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

create index order_items_order_idx on public.order_items (order_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider public.payment_provider not null default 'stripe',
  status public.payment_status not null default 'created',
  session_id text,
  transaction_id text,
  amount numeric(10, 2) not null,
  currency text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_order_idx on public.payments (order_id);
create index payments_session_idx on public.payments (session_id);

create table public.app_settings (
  id uuid primary key default gen_random_uuid(),
  payment_gateway public.payment_provider not null default 'stripe',
  payment_public_key text,
  payment_secret_key text,
  currency text not null default 'USD',
  success_url text,
  cancel_url text,
  sender_email text,
  admin_email text,
  product_id uuid references public.products(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.app_settings_public (
  id uuid primary key,
  payment_gateway public.payment_provider not null,
  payment_public_key text,
  currency text not null,
  success_url text,
  cancel_url text,
  product_id uuid references public.products(id),
  updated_at timestamptz not null default now()
);

create or replace function public.sync_app_settings_public()
returns trigger as $$
begin
  insert into public.app_settings_public (
    id,
    payment_gateway,
    payment_public_key,
    currency,
    success_url,
    cancel_url,
    product_id,
    updated_at
  ) values (
    new.id,
    new.payment_gateway,
    new.payment_public_key,
    new.currency,
    new.success_url,
    new.cancel_url,
    new.product_id,
    new.updated_at
  )
  on conflict (id) do update set
    payment_gateway = excluded.payment_gateway,
    payment_public_key = excluded.payment_public_key,
    currency = excluded.currency,
    success_url = excluded.success_url,
    cancel_url = excluded.cancel_url,
    product_id = excluded.product_id,
    updated_at = excluded.updated_at;
  return new;
end;
$$ language plpgsql;

create trigger app_settings_sync_insert
after insert on public.app_settings
for each row execute function public.sync_app_settings_public();

create trigger app_settings_sync_update
after update on public.app_settings
for each row execute function public.sync_app_settings_public();

create table public.email_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  subject text not null,
  html text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create trigger products_updated
before update on public.products
for each row execute function public.set_updated_at();

create trigger orders_updated
before update on public.orders
for each row execute function public.set_updated_at();

create trigger payments_updated
before update on public.payments
for each row execute function public.set_updated_at();

create trigger app_settings_updated
before update on public.app_settings
for each row execute function public.set_updated_at();

create trigger email_templates_updated
before update on public.email_templates
for each row execute function public.set_updated_at();

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.app_settings enable row level security;
alter table public.app_settings_public enable row level security;
alter table public.email_templates enable row level security;
alter table public.admin_users enable row level security;

create policy "Public read active products"
on public.products for select
using (is_active = true);

create policy "Admin manage products"
on public.products for all
using (public.is_admin(auth.uid()));

create policy "Public create orders"
on public.orders for insert
with check (true);

create policy "Admin read orders"
on public.orders for select
using (public.is_admin(auth.uid()));

create policy "Customer read own orders"
on public.orders for select
using ((auth.jwt() ->> 'email') = email);

create policy "Admin update orders"
on public.orders for update
using (public.is_admin(auth.uid()));

create policy "Public create order items"
on public.order_items for insert
with check (true);

create policy "Admin read order items"
on public.order_items for select
using (public.is_admin(auth.uid()));

create policy "Customer read own order items"
on public.order_items for select
using (
  exists(
    select 1 from public.orders
    where orders.id = order_items.order_id
      and orders.email = (auth.jwt() ->> 'email')
  )
);

create policy "Admin read payments"
on public.payments for select
using (public.is_admin(auth.uid()));

create policy "Admin manage app settings"
on public.app_settings for all
using (public.is_admin(auth.uid()));

create policy "Public read app settings"
on public.app_settings_public for select
using (true);

create policy "Admin manage email templates"
on public.email_templates for all
using (public.is_admin(auth.uid()));

create policy "Admin read own admin row"
on public.admin_users for select
using (auth.uid() = user_id);
