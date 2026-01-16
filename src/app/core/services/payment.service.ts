import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api';
import { PaymentConfirmation, PaymentSessionResponse } from '../models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly api = inject(ApiService);

  createPaymentSession(payload: {
    orderId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<PaymentSessionResponse> {
    return this.api.createPaymentSession(payload);
  }

  confirmPayment(sessionId: string): Promise<PaymentConfirmation> {
    return this.api.confirmPayment(sessionId);
  }
}
