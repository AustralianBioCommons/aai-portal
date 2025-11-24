import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { switchMap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Backend endpoints that don't need an access token
 * (because they involve registration, where the user won't
 * be logged in)
 */
const BYPASS_URLS = ['/register', '/utils/register/'] as readonly string[];
/**
 * HTTP interceptor that adds the Auth0 access token to requests sent to the AAI backend API
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isBackendRequest = req.url.includes(environment.auth0.backend);
  const isBypassUrl = BYPASS_URLS.some((path) => req.url.includes(path));

  // For requests to the AAI backend that's not a registration endpoint
  if (isBackendRequest && !isBypassUrl) {
    const auth0Service = inject(Auth0Service);
    return auth0Service.getAccessTokenSilently().pipe(
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

  // Other requests
  return next(req);
};
