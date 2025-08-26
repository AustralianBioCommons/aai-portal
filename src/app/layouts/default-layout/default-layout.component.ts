import { Component, inject, signal } from '@angular/core';
import { FooterComponent } from '../footer/footer.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, take, switchMap, tap, map } from 'rxjs/operators';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { of } from 'rxjs';

@Component({
  selector: 'app-default-layout',
  imports: [
    FooterComponent,
    NavbarComponent,
    RouterOutlet,
    LoadingSpinnerComponent,
  ],
  templateUrl: './default-layout.component.html',
  styleUrl: './default-layout.component.css',
})
export class DefaultLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  isInitializing = signal(false);

  constructor() {
    if (this.router.url === '/') {
      this.handleRootNavigation();
    }
  }

  private handleRootNavigation(): void {
    this.isInitializing.set(true);

    toObservable(this.authService.isLoading)
      .pipe(
        filter((isLoading) => !isLoading),
        take(1),
        switchMap(() => this.getNavigationRoute()),
        tap((route) => {
          this.router.navigate([route]);
          this.isInitializing.set(false);
        }),
      )
      .subscribe();
  }

  private getNavigationRoute() {
    if (!this.authService.isAuthenticated()) {
      return of('/services');
    }

    return this.authService.isAdmin$.pipe(
      take(1),
      map((isAdmin) => (isAdmin ? '/all-users' : '/services')),
    );
  }
}
