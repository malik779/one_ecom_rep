import { Component, Input, Output, EventEmitter, signal, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-quantity-selector',
  standalone: true,
  imports: [FormsModule, NgIf],
  template: `
    <div class="quantity-selector">
      <label *ngIf="label" class="quantity-label">{{ label }}</label>
      <div class="quantity-controls">
        <button
          type="button"
          class="quantity-button"
          [disabled]="quantity() <= min"
          (click)="decrement()"
          aria-label="Decrease quantity"
          [attr.aria-disabled]="quantity() <= min"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <input
          type="number"
          class="quantity-input"
          [value]="quantity()"
          [min]="min"
          [max]="max"
          [disabled]="disabled"
          (input)="onInputChange($event)"
          (blur)="onBlur()"
          aria-label="Quantity"
        />
        <button
          type="button"
          class="quantity-button"
          [disabled]="quantity() >= max"
          (click)="increment()"
          aria-label="Increase quantity"
          [attr.aria-disabled]="quantity() >= max"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .quantity-selector {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .quantity-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .quantity-controls {
      display: inline-flex;
      align-items: center;
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      background: var(--surface);
      width: fit-content;
    }

    .quantity-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      padding: 0;
      border: none;
      background: transparent;
      color: var(--text-primary);
      cursor: pointer;
      transition: all 0.2s ease;
      border-right: 1px solid var(--border);

      &:last-child {
        border-right: none;
        border-left: 1px solid var(--border);
      }

      &:hover:not(:disabled) {
        background: var(--bg);
        color: var(--primary);
      }

      &:active:not(:disabled) {
        transform: scale(0.95);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      svg {
        display: block;
      }
    }

    .quantity-input {
      width: 60px;
      height: 40px;
      padding: 0 8px;
      border: none;
      background: transparent;
      text-align: center;
      font-size: 1rem;
      font-weight: 500;
      color: var(--text-primary);
      -moz-appearance: textfield;
      appearance: textfield;

      &::-webkit-inner-spin-button,
      &::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      &:focus {
        outline: none;
        background: var(--bg);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    @media (max-width: 768px) {
      .quantity-button {
        width: 36px;
        height: 36px;
      }

      .quantity-input {
        width: 50px;
        height: 36px;
        font-size: 0.9rem;
      }
    }
  `]
})
export class QuantitySelectorComponent implements OnInit, OnChanges {
  @Input() initialValue: number = 1;
  @Input() min: number = 1;
  @Input() max: number = 999;
  @Input() label?: string;
  @Input() disabled: boolean = false;
  @Output() quantityChange = new EventEmitter<number>();

  readonly quantity = signal<number>(1);

  ngOnInit(): void {
    this.quantity.set(Math.max(this.min, Math.min(this.max, this.initialValue)));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialValue'] && !changes['initialValue'].firstChange) {
      this.quantity.set(Math.max(this.min, Math.min(this.max, this.initialValue)));
    }
  }

  increment(): void {
    if (this.quantity() < this.max && !this.disabled) {
      const newValue = this.quantity() + 1;
      this.quantity.set(newValue);
      this.quantityChange.emit(newValue);
    }
  }

  decrement(): void {
    if (this.quantity() > this.min && !this.disabled) {
      const newValue = this.quantity() - 1;
      this.quantity.set(newValue);
      this.quantityChange.emit(newValue);
    }
  }

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10);
    
    if (!isNaN(value)) {
      const clampedValue = Math.max(this.min, Math.min(this.max, value));
      this.quantity.set(clampedValue);
      this.quantityChange.emit(clampedValue);
      
      // Update input value if it was clamped
      if (value !== clampedValue) {
        input.value = clampedValue.toString();
      }
    }
  }

  onBlur(): void {
    // Ensure value is valid on blur
    const currentValue = this.quantity();
    if (currentValue < this.min) {
      this.quantity.set(this.min);
      this.quantityChange.emit(this.min);
    } else if (currentValue > this.max) {
      this.quantity.set(this.max);
      this.quantityChange.emit(this.max);
    }
  }
}
