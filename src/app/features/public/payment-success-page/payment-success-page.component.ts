import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { PaymentService } from '../../../core/services/payment.service';
import { ToastService } from '../../../core/services/toast.service';
import { PaymentConfirmation } from '../../../core/models/payment.model';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-payment-success-page',
  standalone: true,
  imports: [NgIf, RouterLink, SkeletonComponent],
  templateUrl: './payment-success-page.component.html',
  styleUrl: './payment-success-page.component.scss'
})
export class PaymentSuccessPageComponent implements OnInit {
  readonly loading = signal(true);
  readonly confirmation = signal<PaymentConfirmation | null>(null);
  readonly error = signal<string | null>(null);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly paymentService: PaymentService,
    private readonly toastService: ToastService
  ) {}

  async ngOnInit(): Promise<void> {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    if (!sessionId) {
      this.error.set('Missing payment session.');
      this.loading.set(false);
      return;
    }

    try {
      const confirmation = await this.paymentService.confirmPayment(sessionId);
      this.confirmation.set(confirmation);
      this.toastService.success('Payment confirmed', 'A receipt has been emailed to you.');
    } catch (error: any) {
      this.error.set(error?.message ?? 'Unable to verify payment.');
    } finally {
      this.loading.set(false);
    }
  }
}
