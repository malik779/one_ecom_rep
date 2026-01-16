with new_product as (
  insert into public.products (name, description, price, currency, image_url, features, is_active)
  values (
    'Orbit Pro Headphones',
    'Immersive studio-grade audio engineered for focus, comfort, and precision.',
    249,
    'USD',
    null,
    array['Adaptive noise cancellation', '40-hour battery life', 'Carbon fiber frame', 'Spatial audio'],
    true
  )
  returning id
)
insert into public.app_settings (
  payment_gateway,
  payment_public_key,
  payment_secret_key,
  currency,
  success_url,
  cancel_url,
  sender_email,
  admin_email,
  product_id
)
select
  'stripe',
  'pk_test_your_key',
  'sk_test_your_key',
  'USD',
  'http://localhost:4200/payment/success',
  'http://localhost:4200/payment/failure',
  'store@example.com',
  'admin@example.com',
  new_product.id
from new_product;

insert into public.email_templates (name, subject, html)
values
  (
    'customer_receipt',
    'Your order is confirmed',
    '<h2>Thank you for your order</h2><p>Your order {{orderId}} is confirmed.</p>'
  ),
  (
    'admin_notification',
    'New order received',
    '<h2>New order</h2><p>Order {{orderId}} has been paid.</p>'
  );
