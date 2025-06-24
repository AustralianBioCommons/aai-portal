import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

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
  private auth0 = inject(Auth0Service);
  private document = inject(DOCUMENT);
  private http = inject(HttpClient);

  isAuthenticated = signal<boolean>(false);
  user = signal<BiocommonsAuth0User | null>(null);
  user$ = toObservable(this.user);

  constructor() {
    // Subscribe to Auth0 authentication state
    this.auth0.isAuthenticated$.subscribe((isAuthenticated) => {
      this.isAuthenticated.set(isAuthenticated);
    });

    // Fetch user data when authenticated
    this.auth0.user$.subscribe((user) => {
      this.user.set(user as BiocommonsAuth0User);
    });
  }

  login(): void {
    this.auth0.loginWithRedirect();
  }

  logout(): void {
    this.auth0.logout({
      logoutParams: {
        returnTo: this.document.location.origin,
      },
    });
  }

  getUser(): Observable<BiocommonsAuth0User | null> {
    return this.user$;
  }
}
