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
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, CommonModule],
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
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
          { label: 'All users', route: '/all-users' },
          { label: 'Revoked', route: '/revoked' },
          { label: 'Requests', route: '/requests' },
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
        this.api
          .getAllPending()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (pendingData) => {
              const totalPending =
                (pendingData?.pending_services?.length || 0) +
                (pendingData?.pending_resources?.length || 0);
              this.pendingCount.set(totalPending);
            },
            error: (error) => {
              console.error('Failed to fetch pending count:', error);
              this.pendingCount.set(0);
            },
          });
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

  logout() {
    this.authService.logout();
  }
}
