with new_product as (
  insert into public.products (
    name,
    description,
    price,
    currency,
    image_url,
    image_urls,
    features,
    size,
    color,
    material,
    brand,
    ply_rating,
    about,
    is_active
  )
  values (
    'PEACHICHA Disposable Hand Towels Folded Paper Guest Towels, Linen Feel Bathroom Towels for Guests, Elegant White Paper Napkins, Big, Soft and Absorbent, 30x42cm, Total 100 Pcs',
    'Elegant disposable hand towels perfect for parties, weddings, and any special events. These premium guest towels provide a more sanitary alternative to reusable hand towels.',
    0,
    'USD',
    '/assets/product-images/peachicha-main.jpg',
    array[
      '/assets/product-images/peachicha-main.jpg',
      '/assets/product-images/peachicha-1.jpg',
      '/assets/product-images/peachicha-2.jpg',
      '/assets/product-images/peachicha-3.jpg',
      '/assets/product-images/peachicha-4.jpg',
      '/assets/product-images/peachicha-5.jpg',
      '/assets/product-images/peachicha-6.jpg'
    ],
    array[
      'Measures 42*30cm when unfolded',
      'Multi-purpose use',
      'Extra durable paper napkins',
      'Sanitary alternative to reusable towels',
      'Perfect for restaurants and events'
    ],
    '100 Pack',
    'White 100',
    'Airlaid Paper',
    'Peachicha',
    '1-Ply',
    array[
      'Measures 42*30cm when unfolded, 20*9cm when folded, these disposable hand towels are big and elegant for your party wedding or any events.',
      'Multi-purpose disposable hand towels, use for drying hands, wiping sink and counter, surfaces cleaning and other general purpose drying applications.',
      'Extra durable paper napkins, Constructed from a dense paper material that feels similar to real cloth, but offers the convenience of a disposable product!',
      'These guest towels provide a more sanitary alternative to having guests re-use your hand towels.',
      'These hand napkins are great for restaurant and commercial or home use and will make an excellent addition to any cocktail party or special event'
    ],
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
