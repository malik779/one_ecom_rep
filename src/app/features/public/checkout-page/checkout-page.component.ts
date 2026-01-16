import { Component, computed, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { loadStripe } from '@stripe/stripe-js';
import { ProductStore } from '../../../core/state/product.store';
import { SettingsStore } from '../../../core/state/settings.store';
import { OrderService } from '../../../core/services/order.service';
import { PaymentService } from '../../../core/services/payment.service';
import { ToastService } from '../../../core/services/toast.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor, CurrencyPipe, RouterLink, SkeletonComponent],
  templateUrl: './checkout-page.component.html',
  styleUrl: './checkout-page.component.scss'
})
export class CheckoutPageComponent implements OnInit {
  readonly product = this.productStore.product;
  readonly settings = this.settingsStore.settings;
  readonly loading = computed(() => this.productStore.loading() || this.settingsStore.loading());
  readonly processing = signal(false);

  readonly currency = computed(
    () => this.product()?.currency ?? this.settings()?.currency ?? 'USD'
  );

  readonly form = this.formBuilder.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s\-]{7,}$/)]],
    billingAddress: ['', [Validators.required, Validators.minLength(10)]],
    country: ['', Validators.required],
    terms: [false, Validators.requiredTrue]
  });

  readonly countries = ['United States', 'Canada', 'United Kingdom', 'Germany', 'Australia', 'Other'];

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly productStore: ProductStore,
    private readonly settingsStore: SettingsStore,
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
    private readonly toastService: ToastService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.settingsStore.loadSettings();
    const productId = this.settingsStore.settings()?.product_id ?? undefined;
    await this.productStore.loadProduct(productId);
  }

  async submit(): Promise<void> {
    if (this.form.invalid || !this.product()) {
      this.form.markAllAsTouched();
      this.toastService.error('Form incomplete', 'Please complete all required fields.');
      return;
    }

    this.processing.set(true);
    try {
      const product = this.product()!;
      const value = this.form.getRawValue();
      const order = await this.orderService.createOrder({
        full_name: value.fullName ?? '',
        email: value.email ?? '',
        phone: value.phone ?? '',
        billing_address: value.billingAddress ?? '',
        country: value.country ?? '',
        total_amount: product.price,
        currency: product.currency
      });

      await this.orderService.createOrderItem({
        order_id: order.id,
        product_id: product.id,
        quantity: 1,
        unit_price: product.price
      });

      const baseUrl = window.location.origin;
      const successUrl =
        this.settings()?.success_url?.length ? this.settings()?.success_url : `${baseUrl}/payment/success`;
      const cancelUrl =
        this.settings()?.cancel_url?.length ? this.settings()?.cancel_url : `${baseUrl}/payment/failure`;

      const session = await this.paymentService.createPaymentSession({
        orderId: order.id,
        successUrl: successUrl ?? `${baseUrl}/payment/success`,
        cancelUrl: cancelUrl ?? `${baseUrl}/payment/failure`
      });

      const publicKey = this.settings()?.payment_public_key;
      if (publicKey) {
        const stripe = await loadStripe(publicKey);
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId: session.sessionId });
          return;
        }
      }

      window.location.assign(session.checkoutUrl);
    } catch (error: any) {
      this.toastService.error('Checkout failed', error?.message ?? 'Unable to start payment.');
    } finally {
      this.processing.set(false);
    }
  }
}
