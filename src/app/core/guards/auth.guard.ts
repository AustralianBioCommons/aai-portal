import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, switchMap, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);

  return toObservable(authService.isLoading).pipe(
    filter((isLoading) => !isLoading),
    take(1),
    switchMap(() => authService.ensureAuthenticated()),
    map((isAuthenticated) => {
      if (isAuthenticated) {
        return true;
      }
      authService.login();
      return false;
    }),
  );
};
