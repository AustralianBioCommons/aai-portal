import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { switchMap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * HTTP interceptor that adds the Auth0 access token to requests sent to the AAI backend API
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth0 = inject(Auth0Service);

  const isBackendRequest = req.url.includes(environment.auth0.backend);
  const isPublicEndpoint = req.url.includes('/register');

  // For requests to the AAI backend that's not a registration endpoint
  if (isBackendRequest && !isPublicEndpoint) {
    return auth0.getAccessTokenSilently().pipe(
      switchMap((token) => {
        // Add Bearer token to request headers
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

  // Other requests
  return next(req);
};
