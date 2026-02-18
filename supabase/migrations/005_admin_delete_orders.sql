-- Allow admins to delete orders (order_items cascade via FK).
create policy "Admin delete orders"
on public.orders for delete
using (public.is_admin(auth.uid()));
