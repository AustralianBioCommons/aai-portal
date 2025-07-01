import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { of, throwError } from 'rxjs';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { AuthService, BiocommonsAuth0User } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockAuth0Service: jasmine.SpyObj<Auth0Service>;
  let mockDocument: { location: { origin: string } };

  const mockUser: BiocommonsAuth0User = {
    created_at: '2023-01-01T00:00:00Z',
    email: 'test@example.com',
    email_verified: true,
    identities: [],
    name: 'Test User',
    nickname: 'testuser',
    picture: 'https://example.com/avatar.jpg',
    updated_at: '2023-01-01T00:00:00Z',
    user_id: 'auth0|123',
  };

  beforeEach(() => {
    const auth0Spy = jasmine.createSpyObj(
      'Auth0Service',
      ['loginWithRedirect', 'logout', 'getAccessTokenSilently'],
      {
        isAuthenticated$: of(true),
        isLoading$: of(false),
        user$: of(mockUser),
      },
    );

    mockDocument = {
      location: { origin: 'http://localhost:4200' },
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Auth0Service, useValue: auth0Spy },
        { provide: DOCUMENT, useValue: mockDocument },
      ],
    });

    service = TestBed.inject(AuthService);
    mockAuth0Service = TestBed.inject(
      Auth0Service,
    ) as jasmine.SpyObj<Auth0Service>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call loginWithRedirect when login is called', () => {
    service.login();
    expect(mockAuth0Service.loginWithRedirect).toHaveBeenCalled();
  });

  it('should call logout with correct parameters', () => {
    service.logout();
    expect(mockAuth0Service.logout).toHaveBeenCalledWith({
      logoutParams: {
        returnTo: 'http://localhost:4200',
      },
    });
  });

  it('should return authentication state', () => {
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should return user data', () => {
    expect(service.user()).toEqual(mockUser);
  });

  it('should detect admin role correctly', (done) => {
    const adminToken = btoa(
      JSON.stringify({
        'https://biocommons.org.au/roles': ['user', 'admin'],
      }),
    );
    const mockJWT = `header.${adminToken}.signature`;

    mockAuth0Service.getAccessTokenSilently.and.returnValue(of(mockJWT));

    setTimeout(() => {
      expect(service.isAdmin()).toBe(true);
      done();
    }, 0);
  });

  it('should detect non-admin user correctly', (done) => {
    const userToken = btoa(
      JSON.stringify({
        'https://biocommons.org.au/roles': ['user'],
      }),
    );
    const mockJWT = `header.${userToken}.signature`;

    mockAuth0Service.getAccessTokenSilently.and.returnValue(of(mockJWT));

    setTimeout(() => {
      expect(service.isAdmin()).toBe(false);
      done();
    }, 0);
  });

  it('should handle token error gracefully', (done) => {
    mockAuth0Service.getAccessTokenSilently.and.returnValue(
      throwError(() => new Error('Token error')),
    );

    setTimeout(() => {
      expect(service.isAdmin()).toBe(false);
      done();
    }, 0);
  });

  it('should return false for admin when not authenticated', (done) => {
    const unauthenticatedAuth0Spy = jasmine.createSpyObj(
      'Auth0Service',
      ['loginWithRedirect', 'logout', 'getAccessTokenSilently'],
      {
        isAuthenticated$: of(false),
        isLoading$: of(false),
        user$: of(null),
      },
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Auth0Service, useValue: unauthenticatedAuth0Spy },
        { provide: DOCUMENT, useValue: mockDocument },
      ],
    });

    const unauthenticatedService = TestBed.inject(AuthService);

    setTimeout(() => {
      expect(unauthenticatedService.isAdmin()).toBe(false);
      done();
    }, 0);
  });
});
