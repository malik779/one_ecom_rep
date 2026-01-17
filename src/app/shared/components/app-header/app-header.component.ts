import { Component, computed, inject, signal, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf],
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.scss'
})
export class AppHeaderComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  
  readonly session = this.authService.session;
  readonly isAdmin = this.authService.isAdmin;
  readonly isLoggedIn = computed(() => {
    const session = this.session();
    const admin = this.isAdmin();
    return !!(session?.user && admin);
  });
  readonly userEmail = computed(() => this.session()?.user?.email ?? '');
  readonly dropdownOpen = signal(false);

  toggleDropdown(): void {
    this.dropdownOpen.update((open) => !open);
  }

  closeDropdown(): void {
    this.dropdownOpen.set(false);
  }

  async goToDashboard(): Promise<void> {
    this.closeDropdown();
    await this.router.navigate(['/admin/orders']);
  }

  async logout(): Promise<void> {
    this.closeDropdown();
    await this.authService.signOut();
    await this.router.navigate(['/']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-dropdown')) {
      this.closeDropdown();
    }
  }
}
