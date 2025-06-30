import {
  Component,
  inject,
  Renderer2,
  ViewChild,
  ElementRef,
  signal,
} from '@angular/core';
import { AuthService, BiocommonsAuth0User } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { LogoutButtonComponent } from '../../shared/components/buttons/logout-button/logout-button.component';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, shareReplay, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink,
    LogoutButtonComponent,
    CommonModule,
  ],
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private api = inject(ApiService);
  private renderer = inject(Renderer2);
  private router = inject(Router);

  @ViewChild('menu', { read: ElementRef }) menu!: ElementRef;
  @ViewChild('userMenuButton', { read: ElementRef })
  userMenuButton!: ElementRef;

  isAuthenticated = signal(false);
  user = signal<BiocommonsAuth0User | null>(null);
  isAdmin = signal<boolean>(false);
  pendingCount = signal(0);
  userMenuOpen = signal(false);

  userPages = [
    {
      label: 'Services',
      route: '/services',
    },
    {
      label: 'Access',
      route: '/access',
    },
    {
      label: 'Pending',
      route: '/pending',
    },
  ];

  adminPages = [
    {
      label: 'All users',
      route: '/all-users',
    },
    {
      label: 'Revoked',
      route: '/revoked',
    },
    {
      label: 'Requests',
      route: '/requests',
    },
  ];

  constructor() {
    const isAuthenticated$ = toObservable(this.authService.isAuthenticated).pipe(
      takeUntilDestroyed(),
      shareReplay(1)
    );

    // Set isAuthenticated
    isAuthenticated$.subscribe(isAuthenticated => this.isAuthenticated.set(isAuthenticated));

    // Set user
    toObservable(this.authService.user)
      .pipe(takeUntilDestroyed())
      .subscribe(user => this.user.set(user));

    // Set isAdmin if authenticated
    isAuthenticated$
      .pipe(
        filter(Boolean),
        switchMap(() => this.authService.isAdmin())
      )
      .subscribe(isAdmin => this.isAdmin.set(isAdmin));

    // Set pending count if authenticated
    isAuthenticated$
      .pipe(
        filter(Boolean),
        switchMap(() => this.api.getAllPending())
      )
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

    // Close menu on outside click
    this.renderer.listen('window', 'click', (e: Event) => {
      if (
        !this.userMenuButton?.nativeElement.contains(e.target) &&
        !this.menu?.nativeElement.contains(e.target)
      ) {
        this.userMenuOpen.set(false);
      }
    });
  }


  getUserType() {
    return this.isAdmin() ? this.adminPages : this.userPages;
  }

  toggleUserMenu() {
    this.userMenuOpen.set(!this.userMenuOpen());
  }

  isActive(url: string): boolean {
    return this.router.url === url;
  }
}
