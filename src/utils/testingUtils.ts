import {of} from 'rxjs';
import {AuthService as Auth0Service} from '@auth0/auth0-angular';

export function provideMockAuth0Service() {
  const mockAuth0Service = {
    isAuthenticated$: of(true),
    user$: of({ name: 'Test User' }),
    loginWithRedirect: jasmine.createSpy('loginWithRedirect'),
    logout: jasmine.createSpy('logout'),
  };
  return {provide: Auth0Service, useValue: mockAuth0Service};
}
