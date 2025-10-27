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
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { DataRefreshService } from '../../../core/services/data-refresh.service';

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
  private dataRefreshService = inject(DataRefreshService);

  @ViewChild('menu', { read: ElementRef }) menu!: ElementRef;
  @ViewChild('userMenuButton', { read: ElementRef })
  userMenuButton!: ElementRef;

  // Auth signals
  isAuthenticated = this.authService.isAuthenticated;
  user = this.authService.user;
  isAdmin = this.authService.isGeneralAdmin;
  isLoading = this.authService.isLoading;

  // Component state
  pendingCount = signal(0);
  revokedCount = signal(0);
  unverifiedCount = signal(0);
  userMenuOpen = signal(false);

  navigationPages = computed(() =>
    this.isAdmin()
      ? [
          { label: 'All', route: '/all-users' },
          { label: 'Pending', route: '/pending-users' },
          { label: 'Revoked', route: '/revoked-users' },
          { label: 'Unverified', route: '/unverified-users' },
        ]
      : [
          { label: 'Services', route: '/services' },
          { label: 'Access', route: '/access' },
          { label: 'Pending', route: '/pending' },
        ],
  );

  constructor() {
    this.setupCountTracking();
    this.setupDataRefreshListener();
    this.setupClickOutsideMenuHandler();
  }

  /**
   * Set up a listener for data refresh events.
   */
  private setupDataRefreshListener() {
    this.dataRefreshService.refresh$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.refreshCounts();
      });
  }

  private refreshCounts() {
    if (!this.isAuthenticated() || this.isLoading() || !this.isAdmin()) {
      return;
    }

    // Fetch all counts in parallel
    forkJoin({
      pending: this.api.getAdminPendingUsers(),
      revoked: this.api.getAdminRevokedUsers(),
      unverified: this.api.getAdminUnverifiedUsers(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ pending, revoked, unverified }) => {
          this.pendingCount.set(pending?.length || 0);
          this.revokedCount.set(revoked?.length || 0);
          this.unverifiedCount.set(unverified?.length || 0);
        },
        error: (error) => {
          console.error('Failed to fetch user counts:', error);
          this.pendingCount.set(0);
          this.revokedCount.set(0);
          this.unverifiedCount.set(0);
        },
      });
  }

  private setupCountTracking() {
    effect(() => {
      this.refreshCounts();
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
