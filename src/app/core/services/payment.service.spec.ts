import { TestBed } from '@angular/core/testing';
import { PaymentService } from './payment.service';
import { ApiService } from '../api/api';

describe('PaymentService', () => {
  it('creates a payment session via the API', async () => {
    const apiStub = {
      createPaymentSession: vi.fn().mockResolvedValue({
        sessionId: 'sess_123',
        checkoutUrl: 'https://checkout.test'
      })
    };

    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiStub }]
    });

    const service = TestBed.inject(PaymentService);
    const result = await service.createPaymentSession({
      orderId: 'order-1',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/failure'
    });

    expect(apiStub.createPaymentSession).toHaveBeenCalledWith({
      orderId: 'order-1',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/failure'
    });
    expect(result.sessionId).toBe('sess_123');
  });
});
