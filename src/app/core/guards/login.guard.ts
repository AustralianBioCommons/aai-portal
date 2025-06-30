import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs/operators';

export const loginGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return toObservable(authService.isLoading).pipe(
    filter(isLoading => !isLoading),
    take(1),
    map(() => {
      const isAuthenticated = authService.isAuthenticated();
      
      if (isAuthenticated) {
        router.navigate(['/']);
        return false;
      } else {
        return true;
      }
    })
  );
};
