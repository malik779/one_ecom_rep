export type PaymentGateway = 'stripe';

export interface PublicAppSettings {
  payment_gateway: PaymentGateway;
  payment_public_key: string | null;
  currency: string;
  success_url: string;
  cancel_url: string;
  product_id: string | null;
}

export interface AdminAppSettings extends PublicAppSettings {
  sender_email: string | null;
  admin_email: string | null;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
}
