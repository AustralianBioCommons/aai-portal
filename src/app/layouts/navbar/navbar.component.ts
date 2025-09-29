import {
  Component,
  inject,
  Renderer2,
  ViewChild,
  ElementRef,
  signal,
  computed,
  effect,
  DestroyRef,
} from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private api = inject(ApiService);
  private renderer = inject(Renderer2);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  @ViewChild('menu', { read: ElementRef }) menu!: ElementRef;
  @ViewChild('userMenuButton', { read: ElementRef })
  userMenuButton!: ElementRef;

  // Auth signals
  isAuthenticated = this.authService.isAuthenticated;
  user = this.authService.user;
  isAdmin = this.authService.isAdmin;
  isLoading = this.authService.isLoading;

  // Component state
  pendingCount = signal(0);
  userMenuOpen = signal(false);

  // Computed properties
  adminStatusLoading = computed(
    () => this.isLoading() && this.isAuthenticated(),
  );

  navigationPages = computed(() =>
    this.isAdmin()
      ? [
          { label: 'All', route: '/users' },
          { label: 'Requests', route: '/requests' },
          { label: 'Revoked', route: '/revoked' },
          { label: 'Unverified', route: '/users-unverified' },
        ]
      : [
          { label: 'Services', route: '/services' },
          { label: 'Access', route: '/access' },
          { label: 'Pending', route: '/pending' },
        ],
  );

  constructor() {
    this.setupPendingCountTracking();
    this.setupClickOutsideMenuHandler();
  }

  private setupPendingCountTracking() {
    effect(() => {
      if (this.isAuthenticated() && !this.isLoading()) {
        if (this.isAdmin()) {
          // Admin: Get pending users
          this.api
            .getAdminPendingUsers()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (pendingUsers) => {
                this.pendingCount.set(pendingUsers?.length || 0);
              },
              error: (error) => {
                console.error('Failed to fetch pending users count:', error);
                this.pendingCount.set(0);
              },
            });
        } else {
          // Non-admin: Get pending requests (platforms and groups)
          this.api
            .getUserAllPending()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (pendingData) => {
                const totalPending =
                  (pendingData?.platforms?.length || 0) +
                  (pendingData?.groups?.length || 0);
                this.pendingCount.set(totalPending);
              },
              error: (error) => {
                console.error('Failed to fetch pending requests count:', error);
                this.pendingCount.set(0);
              },
            });
        }
      }
    });
  }

  private setupClickOutsideMenuHandler() {
    this.renderer.listen('window', 'click', (e: Event) => {
      const target = e.target as Element;
      if (
        !this.userMenuButton?.nativeElement.contains(target) &&
        !this.menu?.nativeElement.contains(target)
      ) {
        this.userMenuOpen.set(false);
      }
    });
  }

  toggleUserMenu() {
    this.userMenuOpen.set(!this.userMenuOpen());
  }

  isActive(url: string): boolean {
    return this.router.url === url;
  }

  isNavigationPage(): boolean {
    const currentUrl = this.router.url;
    return this.navigationPages().some((page) => page.route === currentUrl);
  }

  logout() {
    this.authService.logout();
  }
}
