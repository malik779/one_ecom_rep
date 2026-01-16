import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CheckoutPageComponent } from './checkout-page.component';
import { ProductStore } from '../../../core/state/product.store';
import { SettingsStore } from '../../../core/state/settings.store';
import { OrderService } from '../../../core/services/order.service';
import { PaymentService } from '../../../core/services/payment.service';
import { ToastService } from '../../../core/services/toast.service';
import { mockProduct, mockPublicSettings } from '../../../core/state/mock-data';

describe('CheckoutPageComponent', () => {
  it('shows error when form is invalid', async () => {
    const toastStub = { error: vi.fn() };

    TestBed.configureTestingModule({
      imports: [CheckoutPageComponent],
      providers: [
        {
          provide: ProductStore,
          useValue: { product: signal(mockProduct), loading: signal(false), loadProduct: vi.fn() }
        },
        {
          provide: SettingsStore,
          useValue: { settings: signal(mockPublicSettings), loading: signal(false), loadSettings: vi.fn() }
        },
        { provide: OrderService, useValue: { createOrder: vi.fn(), createOrderItem: vi.fn() } },
        { provide: PaymentService, useValue: { createPaymentSession: vi.fn() } },
        { provide: ToastService, useValue: toastStub }
      ]
    });

    const fixture = TestBed.createComponent(CheckoutPageComponent);
    const component = fixture.componentInstance;

    await component.submit();
    expect(toastStub.error).toHaveBeenCalled();
  });

  it('creates order and redirects on valid form', async () => {
    const orderStub = {
      createOrder: vi.fn().mockResolvedValue({ id: 'order-1' }),
      createOrderItem: vi.fn().mockResolvedValue({})
    };
    const paymentStub = {
      createPaymentSession: vi
        .fn()
        .mockResolvedValue({ sessionId: 'sess_1', checkoutUrl: 'https://checkout' })
    };
    const toastStub = { error: vi.fn() };

    TestBed.configureTestingModule({
      imports: [CheckoutPageComponent],
      providers: [
        {
          provide: ProductStore,
          useValue: { product: signal(mockProduct), loading: signal(false), loadProduct: vi.fn() }
        },
        {
          provide: SettingsStore,
          useValue: { settings: signal({ ...mockPublicSettings, payment_public_key: null }), loading: signal(false), loadSettings: vi.fn() }
        },
        { provide: OrderService, useValue: orderStub },
        { provide: PaymentService, useValue: paymentStub },
        { provide: ToastService, useValue: toastStub }
      ]
    });

    const fixture = TestBed.createComponent(CheckoutPageComponent);
    const component = fixture.componentInstance;
    component.form.patchValue({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+15550100',
      billingAddress: '123 Market Street, SF',
      country: 'United States',
      terms: true
    });

    const assignSpy = vi.spyOn(window.location, 'assign').mockImplementation(() => {});
    await component.submit();

    expect(orderStub.createOrder).toHaveBeenCalled();
    expect(paymentStub.createPaymentSession).toHaveBeenCalled();
    expect(assignSpy).toHaveBeenCalledWith('https://checkout');
    assignSpy.mockRestore();
  });
});
