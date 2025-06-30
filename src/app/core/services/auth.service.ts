import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { Observable, map, catchError, of, switchMap } from 'rxjs';

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

  isAuthenticated = toSignal(this.auth0Service.isAuthenticated$, { initialValue: false });
  user = toSignal(this.auth0Service.user$ as Observable<BiocommonsAuth0User | null>, { initialValue: null });

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

  private decodeToken(token: string): any {
    try {
      if (!token || token.split('.').length !== 3) {
        throw new Error('Invalid JWT token format');
      }

      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = atob(base64);

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  isAdmin(): Observable<boolean> {
    return this.auth0Service.isAuthenticated$.pipe(
      switchMap((isAuth) => {
        if (!isAuth) {
          return of(false);
        }
        
        return this.auth0Service.getAccessTokenSilently().pipe(
          map((token) => {
            const decodedToken = this.decodeToken(token);
            const roles = decodedToken?.['https://biocommons.org.au/roles'] || [];
            return roles.some((role: string) => role.toLowerCase().includes('admin'));
          }),
          catchError((error) => {
            console.error('Failed to get access token for admin check:', error);
            return of(false);
          })
        );
      })
    );
  }
}
