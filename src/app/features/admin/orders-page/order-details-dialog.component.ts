import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe, CurrencyPipe, NgFor, NgIf, NgClass } from '@angular/common';
import { OrderSummary } from '../../../core/models/order.model';

@Component({
  selector: 'app-order-details-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    DatePipe,
    CurrencyPipe,
    NgFor,
    NgIf,
    NgClass
  ],
  template: `
    <h2 mat-dialog-title>Order Details</h2>
    <mat-dialog-content *ngIf="order">
      <div class="order-detail-grid">
        <div>
          <strong>Order ID</strong>
          <p>{{ order.id }}</p>
        </div>
        <div>
          <strong>Date</strong>
          <p>{{ order.created_at | date: 'medium' }}</p>
        </div>
        <div>
          <strong>Status</strong>
          <p><span class="status" [ngClass]="getStatusClass(order.status)">{{ formatStatus(order.status) }}</span></p>
        </div>
        <div>
          <strong>Total</strong>
          <p>{{ order.total_amount | currency: order.currency }}</p>
        </div>
        <div>
          <strong>Customer</strong>
          <p>{{ order.full_name }}</p>
        </div>
        <div>
          <strong>Email</strong>
          <p>{{ order.email }}</p>
        </div>
        <div>
          <strong>Phone</strong>
          <p>{{ order.phone }}</p>
        </div>
        <div>
          <strong>Country</strong>
          <p>{{ order.country }}</p>
        </div>
        <div class="full-width">
          <strong>Billing Address</strong>
          <p>{{ order.billing_address }}</p>
        </div>
        <div>
          <strong>Transaction ID</strong>
          <p>{{ order.transaction_id || 'Pending' }}</p>
        </div>
        <div class="full-width">
          <strong>Order Items</strong>
          <ul class="order-items-list">
            <li *ngFor="let item of order.items">
              <div class="order-item">
                <span class="item-name">{{ item.product_name }}</span>
                <span class="item-details">
                  Quantity: {{ item.quantity }} × {{ item.unit_price | currency: order.currency }} =
                  {{ (item.quantity * item.unit_price) | currency: order.currency }}
                </span>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .order-detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      color: var(--text-secondary);
      min-width: 600px;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    strong {
      display: block;
      margin-bottom: 8px;
      color: var(--text-primary);
      font-weight: 600;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    p {
      margin: 0;
      font-size: 0.95rem;
      line-height: 1.6;
    }

    .status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .status-paid {
      background-color: #10b981;
      color: white;
    }

    .status-pending {
      background-color: #f59e0b;
      color: white;
    }

    .status-failed {
      background-color: #ef4444;
      color: white;
    }

    .status-refunded {
      background-color: #6b7280;
      color: white;
    }

    .order-items-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .order-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px;
      background: rgba(91, 124, 250, 0.05);
      border-radius: 8px;
      border: 1px solid var(--border);
    }

    .item-name {
      font-weight: 600;
      color: var(--text-primary);
    }

    .item-details {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    mat-dialog-content {
      max-height: 70vh;
      overflow-y: auto;
    }
  `]
})
export class OrderDetailsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<OrderDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public order: OrderSummary
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'paid':
        return 'status-paid';
      case 'pending':
        return 'status-pending';
      case 'failed':
        return 'status-failed';
      case 'refunded':
        return 'status-refunded';
      default:
        return '';
    }
  }

  formatStatus(status: string): string {
    if (!status) return '';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }
}
