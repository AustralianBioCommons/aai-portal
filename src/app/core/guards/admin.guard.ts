import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return toObservable(authService.isLoading).pipe(
    filter((isLoading) => !isLoading),
    take(1),
    switchMap(() => {
      if (!authService.isAuthenticated()) {
        router.navigate(['/']);
        return of(false);
      }

      return authService.isGeneralAdmin$.pipe(
        take(1),
        map((isAdmin) => {
          if (isAdmin) {
            return true;
          } else {
            router.navigate(['/']);
            return false;
          }
        }),
      );
    }),
  );
};
