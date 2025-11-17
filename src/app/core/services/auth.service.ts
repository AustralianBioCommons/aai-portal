import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import {
  Observable,
  map,
  catchError,
  of,
  switchMap,
  shareReplay,
  take,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminPlatformResponse, AdminGroupResponse } from './api.service';

export type AdminType = 'biocommons' | 'platform' | 'bundle' | null;

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

  /**
   * Helper method to create authenticated API observables
   */
  private createAuth0Request$<T>(
    endpoint: string,
    errorMessage: string,
    fallbackValue: T,
  ): Observable<T> {
    return this.auth0Service.isAuthenticated$.pipe(
      switchMap((isAuth) =>
        isAuth
          ? this.auth0Service.getAccessTokenSilently().pipe(
              switchMap((token) =>
                this.http.get<T>(`${environment.auth0.backend}${endpoint}`, {
                  headers: { Authorization: `Bearer ${token}` },
                }),
              ),
              catchError((error) => {
                console.error(errorMessage, error);
                return of(fallbackValue);
              }),
            )
          : of(fallbackValue),
      ),
      shareReplay(1),
    );
  }

  // Observable that checks if the current user has general admin privileges
  // (BioCommons admin, platform admin, or group admin) - this is used to
  // determine whether to show admin-only features in the UI
  isGeneralAdmin$ = this.createAuth0Request$<boolean>(
    '/me/is-general-admin',
    'Failed to check admin status:',
    false,
  );

  isGeneralAdmin = toSignal(this.isGeneralAdmin$, { initialValue: false });

  // Observable that fetches the platforms the current user has admin privileges for
  adminPlatforms$ = this.createAuth0Request$<AdminPlatformResponse[]>(
    '/me/platforms/admin-roles',
    'Failed to fetch admin platforms: ',
    [],
  );

  adminPlatforms = toSignal(this.adminPlatforms$, { initialValue: [] });

  // Observable that fetches the groups the current user has admin privileges for
  adminGroups$ = this.createAuth0Request$<AdminGroupResponse[]>(
    '/me/groups/admin-roles',
    'Failed to fetch admin groups: ',
    [],
  );

  adminGroups = toSignal(this.adminGroups$, { initialValue: [] });

  // Computed signal that determines the type of admin based on their roles
  adminType = computed<AdminType>(() => {
    if (!this.isGeneralAdmin()) {
      return null;
    }

    const platforms = this.adminPlatforms();
    const groups = this.adminGroups();

    // BioCommons admin: manages multiple platforms
    if (platforms.length > 1) {
      return 'biocommons';
    }

    // Platform admin: manages exactly one platform
    if (platforms.length === 1) {
      return 'platform';
    }

    // Bundle admin: manages groups but no platforms
    if (groups.length > 0) {
      return 'bundle';
    }

    return null;
  });

  constructor() {
    this.checkForAuthErrors();
  }

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

  /**
   * Attempt a silent authentication with Auth0, allowing SSO sessions from
   * other applications to flow through without user interaction.
   */
  ensureAuthenticated(): Observable<boolean> {
    return this.auth0Service.isAuthenticated$.pipe(
      take(1),
      switchMap((isAuth) => {
        if (isAuth) {
          return of(true);
        }

        return this.auth0Service.getAccessTokenSilently().pipe(
          map(() => true),
          catchError((error) => {
            const benignErrors = new Set([
              'login_required',
              'consent_required',
              'interaction_required',
            ]);

            if (!benignErrors.has(error?.error)) {
              console.error('Silent authentication failed:', error);
            }

            return of(false);
          }),
        );
      }),
    );
  }
}
