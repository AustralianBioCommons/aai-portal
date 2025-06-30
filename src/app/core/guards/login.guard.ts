import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { map, take, filter, switchMap } from 'rxjs/operators';

export const loginGuard: CanActivateFn = () => {
  const auth0Service = inject(Auth0Service);
  const router = inject(Router);

  return auth0Service.isLoading$.pipe(
    filter(isLoading => !isLoading),
    switchMap(() => auth0Service.isAuthenticated$),
    take(1),
    map(isAuthenticated => {
      if (isAuthenticated) {
        router.navigate(['/']);
        return false;
      } else {
        return true;
      }
    })
  );
};
