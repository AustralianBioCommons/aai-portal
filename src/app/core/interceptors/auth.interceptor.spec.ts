// auth.interceptor.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { of } from 'rxjs';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { authInterceptor } from './auth.interceptor';
import { environment } from '../../../environments/environment';

describe('authInterceptor (bypass URLs)', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  // Simple spyable mock for Auth0Service
  const auth0Mock = {
    getAccessTokenSilently: jasmine
      .createSpy('getAccessTokenSilently')
      .and.returnValue(of('test-token')),
  };

  const backend = environment.auth0.backend; // e.g. 'https://api.example.com'

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: Auth0Service, useValue: auth0Mock },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    auth0Mock.getAccessTokenSilently.calls.reset();
  });

  afterEach(() => {
    httpMock.verify();
  });

  // List of backend paths that should bypass auth
  const BYPASS_PATHS: readonly string[] = [
    '/register',
    '/utils/registration_info',
  ] as const;

  BYPASS_PATHS.forEach((path) => {
    it(`should NOT attach token for bypass path: ${path}`, () => {
      const url = `${backend}${path}`;

      http.get(url).subscribe();
      const req = httpMock.expectOne(url);

      expect(auth0Mock.getAccessTokenSilently).not.toHaveBeenCalled();
      expect(req.request.headers.has('Authorization')).toBeFalse();
      expect(req.request.headers.has('Content-Type')).toBeFalse();

      req.flush({ ok: true });
    });
  });

  it('should attach token for other backend URLs (non-bypass control)', () => {
    const url = `${backend}/users/me`;

    http.get(url).subscribe();
    const req = httpMock.expectOne(url);

    // For non-bypass backend, token should be requested and header set
    expect(auth0Mock.getAccessTokenSilently).toHaveBeenCalledTimes(1);
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');

    req.flush({ ok: true });
  });

  it('should leave non-backend URLs untouched (extra safety)', () => {
    const url = `https://other.example.com/public`;

    http.get(url).subscribe();
    const req = httpMock.expectOne(url);

    expect(auth0Mock.getAccessTokenSilently).not.toHaveBeenCalled();
    expect(req.request.headers.has('Authorization')).toBeFalse();
    expect(req.request.headers.has('Content-Type')).toBeFalse();

    req.flush({ ok: true });
  });
});
