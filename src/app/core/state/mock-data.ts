import { AdminAppSettings, PublicAppSettings } from '../models/settings.model';
import { Product } from '../models/product.model';

export const mockProduct: Product = {
  id: 'demo-product',
  name: 'Orbit Pro Headphones',
  description:
    'Immersive studio-grade audio engineered for focus, comfort, and precision. Built for deep work and clear calls.',
  price: 249,
  currency: 'USD',
  image_url: '/product-placeholder.svg',
  image_urls: ['/product-placeholder.svg'],
  features: [
    'Adaptive noise cancellation',
    '40-hour battery life',
    'Ultra-light carbon fiber frame',
    'Spatial audio with clarity boost'
  ],
  is_active: true
};

export const mockPublicSettings: PublicAppSettings = {
  payment_gateway: 'stripe',
  payment_public_key: 'pk_test_placeholder',
  currency: 'USD',
  success_url: 'http://localhost:4200/payment/success',
  cancel_url: 'http://localhost:4200/payment/failure',
  product_id: mockProduct.id
};

export const mockAdminSettings: AdminAppSettings = {
  ...mockPublicSettings,
  sender_email: 'store@example.com',
  admin_email: 'admin@example.com'
};
