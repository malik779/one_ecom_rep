export type PaymentGateway = 'stripe';

export interface PublicAppSettings {
  payment_gateway: PaymentGateway;
  payment_public_key: string | null;
  currency: string;
  success_url: string;
  cancel_url: string;
  product_id: string | null;
  website_name: string | null;
  logo_url: string | null;
  favicon_url: string | null;
}

export interface AdminAppSettings extends PublicAppSettings {
  sender_email: string | null;
  admin_email: string | null;
  smtp_host: string | null;
  smtp_user: string | null;
  smtp_pass: string | null;
  smtp_port: number | null;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
}
