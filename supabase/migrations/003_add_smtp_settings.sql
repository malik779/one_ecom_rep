-- Add SMTP configuration fields to app_settings table
alter table public.app_settings
  add column if not exists smtp_host text,
  add column if not exists smtp_user text,
  add column if not exists smtp_pass text,
  add column if not exists smtp_port integer default 465;

-- Add comment for documentation
comment on column public.app_settings.smtp_host is 'SMTP server hostname';
comment on column public.app_settings.smtp_user is 'SMTP username/email';
comment on column public.app_settings.smtp_pass is 'SMTP password (encrypted in transit)';
comment on column public.app_settings.smtp_port is 'SMTP server port (default: 465 for TLS)';
