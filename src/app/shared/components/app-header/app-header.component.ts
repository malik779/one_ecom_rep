import { Component, computed, inject, signal, HostListener, OnInit, OnDestroy, effect } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { SettingsStore } from '../../../core/state/settings.store';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf],
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.scss'
})
export class AppHeaderComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly settingsStore = inject(SettingsStore);
  
  readonly session = this.authService.session;
  readonly isAdmin = this.authService.isAdmin;
  readonly settings = this.settingsStore.settings;
  readonly websiteName = computed(() => this.settings()?.website_name || 'One Product Store');
  readonly logoUrl = computed(() => this.settings()?.logo_url || null);
  
  readonly isLoggedIn = computed(() => {
    const session = this.session();
    const admin = this.isAdmin();
    return !!(session?.user && admin);
  });
  readonly userEmail = computed(() => this.session()?.user?.email ?? '');
  readonly dropdownOpen = signal(false);

  constructor() {
    // Update document title and favicon when settings change
    effect(() => {
      const settings = this.settings();
      if (settings) {
        this.updateDocumentTitle();
        this.updateFavicon();
      }
    });
  }

  ngOnInit(): void {
    // Load settings if not already loaded
    if (!this.settings()) {
      this.settingsStore.loadSettings();
    }
  }

  ngOnDestroy(): void {
    // Effect cleanup is handled automatically
  }

  private updateDocumentTitle(): void {
    const name = this.websiteName();
    if (name) {
      document.title = name;
    }
  }

  private updateFavicon(): void {
    const faviconUrl = this.settings()?.favicon_url;
    if (faviconUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = faviconUrl;
    }
  }

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
