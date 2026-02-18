import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

@Component({
  selector: 'app-payment-failure-page',
  standalone: true,
  imports: [RouterLink, BackButtonComponent],
  templateUrl: './payment-failure-page.component.html',
  styleUrl: './payment-failure-page.component.scss'
})
export class PaymentFailurePageComponent {}
