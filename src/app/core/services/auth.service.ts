import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { Observable, map, catchError, of, switchMap, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';

export type Status = 'approved' | 'revoked' | 'pending';

export interface AuthError {
  error: string;
  error_description: string;
  state?: string;
}

export interface Identity {
  connection: string;
  provider: string;
  user_id: string;
  isSocial: boolean;
}

export interface BPAMetadata {
  registration_reason: string;
  username: string;
}

export interface BiocommonsUserMetadata {
  bpa?: BPAMetadata;
  galaxy_username?: string;
}

export interface BiocommonsAppMetadata {
  registration_from?: 'biocommons' | 'galaxy' | 'bpa';
}

export interface BiocommonsAuth0User {
  created_at: string;
  email: string;
  email_verified: boolean;
  identities: Identity[];
  name: string;
  nickname: string;
  picture: string;
  updated_at: string;
  user_id: string;
  username: string;
  user_metadata?: BiocommonsUserMetadata;
  app_metadata?: BiocommonsAppMetadata;
  last_ip?: string;
  last_login?: string;
  logins_count?: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth0Service = inject(Auth0Service);
  private document = inject(DOCUMENT);
  private http = inject(HttpClient);

  authError = signal<AuthError | null>(null);

  isAuthenticated = toSignal(this.auth0Service.isAuthenticated$, {
    initialValue: false,
  });
  isLoading = toSignal(this.auth0Service.isLoading$, { initialValue: true });
  user = toSignal(
    this.auth0Service.user$ as Observable<BiocommonsAuth0User | null>,
    { initialValue: null },
  );

  constructor() {
    this.checkForAuthErrors();
  }

  // Observable that checks if the current user has admin privileges
  isAdmin$ = this.auth0Service.isAuthenticated$.pipe(
    switchMap((isAuth) =>
      isAuth
        ? this.auth0Service.getAccessTokenSilently().pipe(
            switchMap((token) =>
              this.http.get<{ is_admin: boolean }>(
                `${environment.auth0.backend}/me/is-admin`,
                { headers: { Authorization: `Bearer ${token}` } },
              ),
            ),
            map((response) => response.is_admin),
            catchError((error) => {
              console.error('Failed to check admin status:', error);
              return of(false);
            }),
          )
        : of(false),
    ),
    // shareReplay(1) ensures multiple subscribers share the same HTTP request
    // and new subscribers immediately get the last cached admin status value
    // This prevents redundant API calls when multiple components check admin permissions
    shareReplay(1),
  );

  isAdmin = toSignal(this.isAdmin$, { initialValue: false });

  /**
   * Check for Auth0 callback errors in URL parameters
   */
  private checkForAuthErrors(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    const state = urlParams.get('state');

    if (error && errorDescription) {
      this.authError.set({
        error,
        error_description: errorDescription,
        state: state || undefined,
      });
    }
  }

  /**
   * Clear the current authentication error
   */
  clearAuthError(): void {
    this.authError.set(null);
  }

  login(): void {
    this.auth0Service.loginWithRedirect();
  }

  logout(): void {
    this.auth0Service.logout({
      logoutParams: {
        returnTo: this.document.location.origin,
      },
    });
  }
}
