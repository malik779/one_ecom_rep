import { Component, computed, OnInit, OnDestroy, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { Router, RouterLink, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ProductStore } from '../../../core/state/product.store';
import { SettingsStore } from '../../../core/state/settings.store';
import { OrderService } from '../../../core/services/order.service';
import { PaymentService } from '../../../core/services/payment.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingService } from '../../../core/services/loading.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor, CurrencyPipe, RouterLink, SkeletonComponent, BackButtonComponent],
  templateUrl: './checkout-page.component.html',
  styleUrl: './checkout-page.component.scss'
})
export class CheckoutPageComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  readonly product;
  readonly settings;
  readonly loading;
  readonly processing = signal(false);
  readonly quantity = signal<number>(1);

  readonly currency: ReturnType<typeof computed<string>>;

  readonly form: ReturnType<FormBuilder['group']>;

  readonly countries = ['United States', 'Canada', 'United Kingdom', 'Germany', 'Australia', 'Other'];

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly productStore: ProductStore,
    private readonly settingsStore: SettingsStore,
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
    private readonly toastService: ToastService,
    private readonly loadingService: LoadingService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
    this.product = this.productStore.product;
    this.settings = this.settingsStore.settings;
    this.loading = computed(() => this.productStore.loading() || this.settingsStore.loading());
    this.currency = computed(
      () => this.product()?.currency ?? this.settings()?.currency ?? 'USD'
    );
    this.form = this.formBuilder.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s-]{7,}$/)]],
      billingAddress: ['', [Validators.required, Validators.minLength(10)]],
      country: ['', Validators.required],
      terms: [false, Validators.requiredTrue]
    });
  }

  private async loadData(): Promise<void> {
    await this.settingsStore.loadSettings();
    
    // Get product ID from query params or fallback to settings
    const productId = this.route.snapshot.queryParamMap.get('productId') 
      || this.settingsStore.settings()?.product_id;
    
    // Get quantity from query params, default to 1
    const quantityParam = this.route.snapshot.queryParamMap.get('quantity');
    const quantityValue = quantityParam ? parseInt(quantityParam, 10) : 1;
    this.quantity.set(Math.max(1, Math.min(999, quantityValue || 1)));
    
    if (!productId) {
      this.toastService.error('Product required', 'Please select a product to checkout.');
      await this.router.navigate(['/']);
      return;
    }

    await this.productStore.loadProduct(productId, true);
    if (!this.product()) {
      this.toastService.error('Product not found', 'The selected product is not available.');
      await this.router.navigate(['/']);
    }
  }

  async ngOnInit(): Promise<void> {
    // Load data on initial load
    await this.loadData();

    // Reload data when route params change
    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(async () => {
        await this.loadData();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async submit(): Promise<void> {
    if (this.form.invalid || !this.product()) {
      this.form.markAllAsTouched();
      this.toastService.error('Form incomplete', 'Please complete all required fields.');
      return;
    }

    if (this.processing()) {
      return; // Prevent double submission
    }

    this.processing.set(true);
    this.loadingService.show('Processing your order...');
    
    try {
      const product = this.product()!;
      const value = this.form.getRawValue();
      const qty = this.quantity();
      const totalAmount = product.price * qty;
      
      this.loadingService.show('Creating order...');
      const order = await this.orderService.createOrder({
        full_name: value.fullName ?? '',
        email: value.email ?? '',
        phone: value.phone ?? '',
        billing_address: value.billingAddress ?? '',
        country: value.country ?? '',
        total_amount: totalAmount,
        currency: product.currency
      });

      await this.orderService.createOrderItem({
        order_id: order.id,
        product_id: product.id,
        quantity: qty,
        unit_price: product.price
      });

      const baseUrl = window.location.origin;
      const successUrl =
        this.settings()?.success_url?.length ? this.settings()?.success_url : `${baseUrl}/payment/success`;
      const cancelUrl =
        this.settings()?.cancel_url?.length ? this.settings()?.cancel_url : `${baseUrl}/payment/failure`;

      this.loadingService.show('Redirecting to payment...');
      const session = await this.paymentService.createPaymentSession({
        orderId: order.id,
        successUrl: successUrl ?? `${baseUrl}/payment/success`,
        cancelUrl: cancelUrl ?? `${baseUrl}/payment/failure`
      });

      // Keep loader visible during redirect
      this.loadingService.show('Redirecting to secure payment...');
      window.location.assign(session.checkoutUrl);
    } catch (error: any) {
      this.loadingService.hide();
      this.toastService.error('Checkout failed', error?.message ?? 'Unable to start payment.');
      this.processing.set(false);
    }
    // Note: We don't hide loader on success as we're redirecting
  }
}
