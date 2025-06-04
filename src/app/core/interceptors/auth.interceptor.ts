import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { switchMap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth0 = inject(Auth0Service);

  if (req.url.includes(environment.auth0.backend)) {
    return auth0.getAccessTokenSilently().pipe(
      switchMap((token) => {
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        return next(authReq);
      }),
      catchError((error) => {
        console.error('Failed to get access token:', error);
        return throwError(() => error);
      }),
    );
  }

  return next(req);
};
