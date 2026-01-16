import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-payment-failure-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './payment-failure-page.component.html',
  styleUrl: './payment-failure-page.component.scss'
})
export class PaymentFailurePageComponent {}
