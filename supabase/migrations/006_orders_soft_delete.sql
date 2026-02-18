-- Soft delete for orders: set deleted_at instead of removing rows.
alter table public.orders
  add column if not exists deleted_at timestamptz default null;

create index if not exists orders_deleted_at_idx on public.orders (deleted_at);

comment on column public.orders.deleted_at is 'Set when order is soft-deleted; null means active.';
