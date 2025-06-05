import {
  Component,
  inject,
  effect,
  Renderer2,
  ViewChild,
  ElementRef,
  OnDestroy,
  signal,
} from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { LoginButtonComponent } from '../../shared/components/buttons/login-button/login-button.component';
import { LogoutButtonComponent } from '../../shared/components/buttons/logout-button/logout-button.component';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink,
    LoginButtonComponent,
    LogoutButtonComponent,
    CommonModule,
  ],
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnDestroy {
  private auth = inject(AuthService);
  private api = inject(ApiService);
  private renderer = inject(Renderer2);
  private router = inject(Router);

  @ViewChild('menu', { read: ElementRef }) menu!: ElementRef;
  @ViewChild('userMenuButton', { read: ElementRef })
  userMenuButton!: ElementRef;

  isAuthenticated = signal(false);
  user = signal<any>(null);
  pendingCount = signal(0);
  userType = 'user';
  userMenuOpen = false;

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

  private userSubscription!: Subscription;

  constructor() {
    toObservable(this.auth.isAuthenticated)
      .pipe(
        takeUntilDestroyed(),
        filter((isAuth) => isAuth),
        switchMap(() => this.api.getAllPending()),
      )
      .subscribe({
        next: (pendingData) => {
          const totalPending =
            (pendingData.pending_services?.length || 0) +
            (pendingData.pending_resources?.length || 0);
          this.pendingCount.set(totalPending);
        },
        error: (error) => {
          console.error('Failed to fetch pending count:', error);
          this.pendingCount.set(0);
        },
      });

    effect(() => {
      this.isAuthenticated.set(this.auth.isAuthenticated());
      this.user.set(this.auth.user());
    });

    this.renderer.listen('window', 'click', (e: Event) => {
      if (
        !this.userMenuButton?.nativeElement.contains(e.target) &&
        !this.menu?.nativeElement.contains(e.target)
      ) {
        this.userMenuOpen = false;
      }
    });
  }

  getUserType() {
    return this.userType === 'admin' ? this.adminPages : this.userPages;
  }

  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
  }

  isActive(url: string): boolean {
    return this.router.url === url;
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
}
