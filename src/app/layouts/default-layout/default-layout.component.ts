import { Component, inject, signal, OnInit } from '@angular/core';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, take, switchMap, tap, map, startWith } from 'rxjs/operators';
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
export class DefaultLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  private authLoading$ = toObservable(this.authService.isLoading);

  isInitializing = signal(false);

  ngOnInit() {
    this.router.events
      .pipe(
        startWith(new NavigationEnd(0, this.router.url, this.router.url)),
        filter(
          (event): event is NavigationEnd =>
            event instanceof NavigationEnd && event.url === '/',
        ),
        tap(() => this.handleRootNavigation()),
      )
      .subscribe();
  }

  private handleRootNavigation(): void {
    this.isInitializing.set(true);
    this.authLoading$
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
    return this.authService.isAuthenticated()
      ? this.authService.isGeneralAdmin$.pipe(
          take(1),
          map((isAdmin) => (isAdmin ? '/all-users' : '/services')),
        )
      : of('/services');
  }
}
