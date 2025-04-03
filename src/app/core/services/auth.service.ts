import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { AuthService as Auth0Service, User } from '@auth0/auth0-angular';
import { HttpClient } from '@angular/common/http';
import { concatMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { toObservable } from '@angular/core/rxjs-interop';

export interface BiocommonsUserMetadata {
  first_name?: string;
  last_name?: string;
  systems?: {
    approved?: string[];
    requested?: string[];
  }
}

/** Define the extra fields we expect on top of the Auth0 User type */
export interface UserWithMetadata extends User {
  user_metadata?: BiocommonsUserMetadata;
  user_id?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth0 = inject(Auth0Service);
  private document = inject(DOCUMENT);
  private http = inject(HttpClient);

  isAuthenticated = signal<boolean>(false);
  user = signal<UserWithMetadata | null>(null);
  user$ = toObservable(this.user);

  constructor() {
    // Subscribe to Auth0 authentication state
    this.auth0.isAuthenticated$.subscribe((isAuthenticated) => {
      this.isAuthenticated.set(isAuthenticated);
    });

    // Fetch user data when authenticated
    this.auth0.user$
      .pipe(
        concatMap((user) =>
          this.http.get(
            encodeURI(`${environment.auth0.audience}users/${user?.sub}`),
          ),
        ),
        tap((user) => this.user.set(user)),
      )
      .subscribe();
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

  getUser(){
    return this.user$;
  }

  updateUserMetadata(userId: string, metadata: any) {
    return this.http
      .patch(
        `${environment.auth0.audience}users/${userId}`,
        { user_metadata: metadata },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
      .pipe(tap((updatedUser: UserWithMetadata) => this.user.set(updatedUser)));
  }
}
