import { Component, inject, signal, effect, untracked } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import {
  ApiService,
  AdminUserCountsResponse,
} from '../../../core/services/api.service';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  NavigationEnd,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataRefreshService } from '../../../core/services/data-refresh.service';
import { DropdownMenuComponent } from '../dropdown-menu/dropdown-menu.component';
import { filter } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroBars3,
  heroUserCircle,
  heroArrowRightStartOnRectangle,
} from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink,
    RouterLinkActive,
    CommonModule,
    NgIcon,
    DropdownMenuComponent,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  viewProviders: [
    provideIcons({
      heroBars3,
      heroUserCircle,
      logOut: heroArrowRightStartOnRectangle,
    }),
  ],
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private dataRefreshService = inject(DataRefreshService);
  router = inject(Router);

  // Auth signals
  isLoading = this.authService.isLoading;
  isAuthenticated = this.authService.isAuthenticated;
  user = this.authService.user;
  isGeneralAdmin = this.authService.isGeneralAdmin;
  adminType = this.authService.adminType;
  adminPlatforms = this.authService.adminPlatforms;
  adminGroups = this.authService.adminGroups;

  // Component state signals
  userMenuOpen = signal(false);
  userCounts = signal<AdminUserCountsResponse>({
    all: 0,
    pending: 0,
    revoked: 0,
    unverified: 0,
  });

  private refreshTick = toSignal(this.dataRefreshService.refresh$, {
    initialValue: null,
  });

  private navigationEndTrigger = toSignal(
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)),
    { initialValue: null },
  );

  navigationPages = [
    { label: 'All', route: '/all-users' },
    { label: 'Pending', route: '/pending-users' },
    { label: 'Revoked', route: '/revoked-users' },
    { label: 'Unverified', route: '/unverified-users' },
  ];

  constructor() {
    effect((onCleanup) => {
      this.refreshTick();
      this.navigationEndTrigger();

      untracked(() => {
        if (
          !this.isAuthenticated() ||
          !this.isGeneralAdmin() ||
          this.isLoading()
        ) {
          return;
        }

        const subscription = this.apiService.getAdminUserCounts().subscribe({
          next: (counts) => this.userCounts.set(counts),
          error: (err) => {
            console.error('Failed to fetch user counts:', err);
            this.userCounts.set({
              all: 0,
              pending: 0,
              revoked: 0,
              unverified: 0,
            });
          },
        });

        onCleanup(() => subscription.unsubscribe());
      });
    });
  }

  navTitle(): string {
    if (!this.isGeneralAdmin()) {
      return 'My BioCommons Access';
    }

    const suffix =
      this.router.url.includes('/profile') ||
      this.router.url.includes('/bundles')
        ? 'Profile'
        : 'Dashboard';

    if (this.adminType() === 'biocommons') {
      return `BioCommons Admin ${suffix}`;
    } else if (this.adminType() === 'platform') {
      return `${this.adminPlatforms()[0].name} Admin ${suffix}`;
    }

    return `${this.adminGroups()[0]?.short_name || ''} Bundle Admin ${suffix}`;
  }

  isNavigationPage(): boolean {
    const currentUrl = this.router.url;
    return this.navigationPages.some((page) => page.route === currentUrl);
  }

  onNavigationChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const selectedRoute = selectElement.value;
    if (selectedRoute) {
      this.router.navigate([selectedRoute]);
    }
  }

  getCurrentRoute(): string {
    return this.router.url;
  }

  logout() {
    this.authService.logout();
  }
}
