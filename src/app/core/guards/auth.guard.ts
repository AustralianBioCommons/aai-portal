import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, switchMap, take } from 'rxjs/operators';

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
      authService.login();
      return false;
    }),
  );
};
