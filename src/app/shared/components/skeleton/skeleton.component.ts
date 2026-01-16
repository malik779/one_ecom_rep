import { Component, Input } from '@angular/core';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [NgStyle],
  template: '<div class="skeleton" [ngStyle]="{ height, width, borderRadius: radius }"></div>'
})
export class SkeletonComponent {
  @Input() height = '16px';
  @Input() width = '100%';
  @Input() radius = '12px';
}
