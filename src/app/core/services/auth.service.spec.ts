import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { AuthService, BiocommonsAuth0User } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let mockAuth0Service: jasmine.SpyObj<Auth0Service>;
  let httpMock: HttpTestingController;

  const mockUser: BiocommonsAuth0User = {
    created_at: '2023-01-01T00:00:00Z',
    email: 'test@example.com',
    email_verified: true,
    username: 'testuser',
    identities: [],
    name: 'Test User',
    nickname: 'testuser',
    picture: 'https://example.com/avatar.jpg',
    updated_at: '2023-01-01T00:00:00Z',
    user_id: 'auth0|123',
  };

  function createService(
    isAuthenticated = true,
    tokenResponse = of('default.token.signature'),
  ) {
    const auth0Spy = jasmine.createSpyObj(
      'Auth0Service',
      ['loginWithRedirect', 'logout', 'getAccessTokenSilently'],
      {
        isAuthenticated$: of(isAuthenticated),
        isLoading$: of(false),
        user$: of(isAuthenticated ? mockUser : null),
      },
    );

    auth0Spy.getAccessTokenSilently.and.returnValue(tokenResponse);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Auth0Service, useValue: auth0Spy },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AuthService);
    mockAuth0Service = TestBed.inject(
      Auth0Service,
    ) as jasmine.SpyObj<Auth0Service>;
    httpMock = TestBed.inject(HttpTestingController);
    return { service, mockAuth0Service, httpMock };
  }

  afterEach(() => {
    httpMock?.verify();
  });

  it('should be created', () => {
    const { httpMock } = createService();
    expect(service).toBeTruthy();

    const req = httpMock.expectOne(
      `${environment.auth0.backend}/me/is-general-admin`,
    );
    req.flush(false);
  });

  it('should call loginWithRedirect when login is called', () => {
    const { httpMock } = createService();
    service.login();
    expect(mockAuth0Service.loginWithRedirect).toHaveBeenCalled();

    const req = httpMock.expectOne(
      `${environment.auth0.backend}/me/is-general-admin`,
    );
    req.flush(false);
  });

  it('should call logout with returnTo parameter', () => {
    const { httpMock } = createService();
    service.logout();

    expect(mockAuth0Service.logout).toHaveBeenCalledWith(
      jasmine.objectContaining({
        logoutParams: jasmine.objectContaining({
          returnTo: jasmine.any(String),
        }),
      }),
    );

    const req = httpMock.expectOne(
      `${environment.auth0.backend}/me/is-general-admin`,
    );
    req.flush(false);
  });

  it('should return authentication state', () => {
    const { httpMock } = createService();
    expect(service.isAuthenticated()).toBe(true);

    const req = httpMock.expectOne(
      `${environment.auth0.backend}/me/is-general-admin`,
    );
    req.flush(false);
  });

  it('should return user data', () => {
    const { httpMock } = createService();
    expect(service.user()).toEqual(mockUser);

    const req = httpMock.expectOne(
      `${environment.auth0.backend}/me/is-general-admin`,
    );
    req.flush(false);
  });

  it('should detect admin role correctly', (done) => {
    const { httpMock } = createService();
    service.isGeneralAdmin$.subscribe((isAdmin) => {
      expect(isAdmin).toBe(true);
      done();
    });

    const req = httpMock.expectOne(
      `${environment.auth0.backend}/me/is-general-admin`,
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe(
      'Bearer default.token.signature',
    );
    req.flush(true);
  });

  it('should detect non-admin user correctly', (done) => {
    const { httpMock } = createService();

    service.isGeneralAdmin$.subscribe((isAdmin) => {
      expect(isAdmin).toBe(false);
      done();
    });

    const req = httpMock.expectOne(
      `${environment.auth0.backend}/me/is-general-admin`,
    );
    req.flush(false);
  });

  it('should handle token error gracefully', (done) => {
    createService(
      true,
      throwError(() => new Error('Token error')),
    );

    service.isGeneralAdmin$.subscribe((isAdmin) => {
      expect(isAdmin).toBe(false);
      done();
    });

    httpMock.expectNone(`${environment.auth0.backend}/me/is-general-admin`);
  });

  it('should return false for admin when not authenticated', (done) => {
    createService(false);

    service.isGeneralAdmin$.subscribe((isAdmin) => {
      expect(isAdmin).toBe(false);
      done();
    });

    httpMock.expectNone(`${environment.auth0.backend}/me/is-general-admin`);
  });

  it('should handle HTTP error gracefully', (done) => {
    const { httpMock } = createService();

    service.isGeneralAdmin$.subscribe((isAdmin) => {
      expect(isAdmin).toBe(false);
      done();
    });

    const req = httpMock.expectOne(
      `${environment.auth0.backend}/me/is-general-admin`,
    );
    req.error(new ProgressEvent('error'), {
      status: 500,
      statusText: 'Internal Server Error',
    });
  });

  it('should resolve ensureAuthenticated immediately when already authenticated', (done) => {
    const { httpMock } = createService(true);

    service.ensureAuthenticated().subscribe((isAuth) => {
      expect(isAuth).toBe(true);
      done();
    });

    const req = httpMock.expectOne(
      `${environment.auth0.backend}/me/is-general-admin`,
    );
    req.flush({ is_admin: false });
  });

  it('should perform silent login when user is not authenticated', (done) => {
    const result = createService(false);

    service.ensureAuthenticated().subscribe((isAuth) => {
      expect(isAuth).toBe(true);
      expect(result.mockAuth0Service.getAccessTokenSilently).toHaveBeenCalled();
      done();
    });

    result.httpMock.expectNone(
      `${environment.auth0.backend}/me/is-general-admin`,
    );
  });

  it('should return false when silent login indicates login_required', (done) => {
    createService(
      false,
      throwError(() => ({ error: 'login_required' })),
    );

    service.ensureAuthenticated().subscribe((isAuth) => {
      expect(isAuth).toBe(false);
      done();
    });

    httpMock.expectNone(`${environment.auth0.backend}/me/is-general-admin`);
  });
});
