import { TestBed } from '@angular/core/testing';
import { AuthService, BiocommonsAuth0User } from './auth.service';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { provideMockAuth0Service } from '../../../utils/testingUtils';
import { provideHttpClient } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { of } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let mockAuth0Service: jasmine.SpyObj<Auth0Service>;
  let mockDocument: jasmine.SpyObj<Document>;

  const mockUser: BiocommonsAuth0User = {
    created_at: '2023-01-01T00:00:00Z',
    email: 'test@example.com',
    email_verified: true,
    identities: [],
    name: 'Test User',
    nickname: 'testuser',
    picture: 'https://example.com/avatar.jpg',
    updated_at: '2023-01-01T00:00:00Z',
    user_id: 'auth0|123'
  };

  beforeEach(() => {
    const auth0Spy = jasmine.createSpyObj('Auth0Service', [
      'loginWithRedirect',
      'logout'
    ], {
      isAuthenticated$: of(true),
      user$: of(mockUser)
    });

    const docSpy = jasmine.createSpyObj('Document', [], {
      location: { origin: 'http://localhost:4200' }
    });

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Auth0Service, useValue: auth0Spy },
        { provide: DOCUMENT, useValue: docSpy },
        provideMockAuth0Service({ isAuthenticated: true }),
        provideHttpClient()
      ]
    });

    service = TestBed.inject(AuthService);
    mockAuth0Service = TestBed.inject(Auth0Service) as jasmine.SpyObj<Auth0Service>;
    mockDocument = TestBed.inject(DOCUMENT) as jasmine.SpyObj<Document>;
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
        returnTo: mockDocument.location.origin,
      },
    });
  });

  it('should update authentication state', () => {
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should return user observable', () => {
    const userObservable = service.getUser();
    expect(userObservable).toBeDefined();
    
    userObservable.subscribe(user => {
      expect(user).toEqual(mockUser);
    });
  });
});
