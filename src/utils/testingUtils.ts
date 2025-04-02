import {of} from 'rxjs';
import {AuthService as Auth0Service} from '@auth0/auth0-angular';

/**
 * Mock version of the AuthService from Auth0 that can be used in tests
 * when components depend on this service. Can be passed to the providers
 * field when configuring TestBed
 */
export function provideMockAuth0Service(options: {isAuthenticated: boolean } = {isAuthenticated: true}) {
  const mockAuth0Service = {
    isAuthenticated$: of(options.isAuthenticated),
    user$: of({ name: 'Test User' }),
    loginWithRedirect: jasmine.createSpy('loginWithRedirect'),
    logout: jasmine.createSpy('logout'),
  };
  return {provide: Auth0Service, useValue: mockAuth0Service};
}
