import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { Observable, map, catchError, of, switchMap, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';

export type Status = 'approved' | 'revoked' | 'pending';

export interface Resource {
  name: string;
  status: Status;
  id: string;
}

export interface Service {
  name: string;
  id: string;
  status: Status;
  last_updated: string;
  updated_by: string;
  resources: Resource[];
}

export interface Group {
  name: string;
  id: string;
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
  groups: Group[];
  services: Service[];
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

  isAuthenticated = toSignal(this.auth0Service.isAuthenticated$, {
    initialValue: false,
  });
  isLoading = toSignal(this.auth0Service.isLoading$, { initialValue: true });
  user = toSignal(
    this.auth0Service.user$ as Observable<BiocommonsAuth0User | null>,
    { initialValue: null },
  );

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
    shareReplay(1),
  );

  isAdmin = toSignal(this.isAdmin$, { initialValue: false });

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
