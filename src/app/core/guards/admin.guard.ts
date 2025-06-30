import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { map, take, filter, switchMap } from 'rxjs/operators';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const auth0Service = inject(Auth0Service);
  const router = inject(Router);

  return auth0Service.isLoading$.pipe(
    filter(isLoading => !isLoading),
    switchMap(() => auth0Service.isAuthenticated$),
    take(1),
    switchMap(isAuthenticated => {
      if (isAuthenticated) {
        return authService.isAdmin().pipe(
          map(isAdmin => {
            if (isAdmin) {
              return true;
            } else {
              router.navigate(['/']);
              return false;
            }
          })
        );
      }
      return [false];
    })
  );
};
