export type PaymentProvider = 'stripe';
export type PaymentStatus = 'created' | 'processing' | 'paid' | 'failed';

export interface PaymentSessionResponse {
  sessionId: string;
  checkoutUrl: string;
}

export interface PaymentConfirmation {
  orderId: string;
  status: PaymentStatus;
  transactionId: string | null;
  amount: number;
  currency: string;
  customerEmail: string;
}
