-- Add website branding fields to app_settings table
alter table public.app_settings
  add column if not exists website_name text default 'One Product Store',
  add column if not exists logo_url text,
  add column if not exists favicon_url text;

-- Add website branding fields to app_settings_public table
alter table public.app_settings_public
  add column if not exists website_name text default 'One Product Store',
  add column if not exists logo_url text,
  add column if not exists favicon_url text;

-- Update the sync function to include new fields
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
    website_name,
    logo_url,
    favicon_url,
    updated_at
  ) values (
    new.id,
    new.payment_gateway,
    new.payment_public_key,
    new.currency,
    new.success_url,
    new.cancel_url,
    new.product_id,
    new.website_name,
    new.logo_url,
    new.favicon_url,
    new.updated_at
  )
  on conflict (id) do update set
    payment_gateway = excluded.payment_gateway,
    payment_public_key = excluded.payment_public_key,
    currency = excluded.currency,
    success_url = excluded.success_url,
    cancel_url = excluded.cancel_url,
    product_id = excluded.product_id,
    website_name = excluded.website_name,
    logo_url = excluded.logo_url,
    favicon_url = excluded.favicon_url,
    updated_at = excluded.updated_at;
  return new;
end;
$$ language plpgsql;

-- Add comments for documentation
comment on column public.app_settings.website_name is 'Website name displayed in header and title';
comment on column public.app_settings.logo_url is 'URL to website logo image';
comment on column public.app_settings.favicon_url is 'URL to website favicon';
