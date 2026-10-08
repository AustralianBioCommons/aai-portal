import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return toObservable(authService.isLoading).pipe(
    filter((isLoading) => !isLoading),
    take(1),
    switchMap(() => authService.ensureAuthenticated()),
    map((isAuthenticated) => {
      if (isAuthenticated) {
        return true;
      }
      if (authService.authError()) {
        return router.createUrlTree(['/login']);
      }
      // Tenants without a custom domain (raw *.auth0.com host, e.g. dev-aaf)
      // can't show the register link on the Auth0 Universal Login screen, since
      // page templates require a custom domain. Route unauthenticated users to
      // the portal /login page instead, which carries the register link. Custom
      // domain envs (dev/staging/prod) go straight to Auth0, whose custom
      // template already shows the link.
      if (environment.auth0.domain.endsWith('.auth0.com')) {
        return router.createUrlTree(['/login']);
      }
      authService.login();
      return false;
    }),
  );
};
