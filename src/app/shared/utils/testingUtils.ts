import { of } from 'rxjs';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { BiocommonsAuth0User } from '../../core/services/auth.service';
import { AuthService } from '../../core/services/auth.service';
import { signal } from '@angular/core';

/**
 * Mock version of the AuthService from Auth0 that can be used in tests
 * when components depend on this service. Can be passed to the providers
 * field when configuring TestBed
 */
export function provideMockAuth0Service(
  options: { isAuthenticated: boolean; user?: BiocommonsAuth0User } = {
    isAuthenticated: true,
  },
) {
  const user = options.user || { name: 'TestUser' };
  const mockAuth0Service = {
    isAuthenticated$: of(options.isAuthenticated),
    user$: of(user),
    loginWithRedirect: jasmine.createSpy('loginWithRedirect'),
    logout: jasmine.createSpy('logout'),
  };
  return { provide: Auth0Service, useValue: mockAuth0Service };
}

/**
 * Mock version of our AuthService that can be used in testing
 * when components depend on it.
 *
 * Pass this to the providers field when configuring TestBed.
 *
 * Pass data to options to set up the AuthService with specific values
 * and user data
 *
 */
export function provideMockAuthService(options: {
  isAuthenticated: boolean;
  user?: BiocommonsAuth0User;
}) {
  const user = options.user || { name: 'TestUser' };
  const userSignal = signal(user);
  const mockAuthService = jasmine.createSpyObj(
    'AuthService',
    { getUser: of(user) },
    {
      isAuthenticated: signal(options.isAuthenticated),
      user: userSignal,
      user$: of(userSignal),
    },
  );
  return { provide: AuthService, useValue: mockAuthService };
}
