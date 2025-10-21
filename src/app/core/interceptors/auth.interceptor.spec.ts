import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptors,
  HttpClient,
} from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { of, throwError } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { environment } from '../../../environments/environment';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<Auth0Service>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<Auth0Service>('AuthService', [
      'getAccessTokenSilently',
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Auth0Service, useValue: authServiceSpy },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('bypasses registration endpoints without adding authorization header', () => {
    const url = `${environment.auth0.backend}/register`;
    authServiceSpy.getAccessTokenSilently.and.returnValue(of('token'));

    http.get(url).subscribe();

    const req = httpMock.expectOne(url);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('attaches bearer token for protected backend requests', () => {
    const url = `${environment.auth0.backend}/admin/users`;
    authServiceSpy.getAccessTokenSilently.and.returnValue(of('token-123'));

    http.get(url).subscribe();

    const req = httpMock.expectOne(url);
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-123');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    req.flush({});
  });

  it('propagates errors when token acquisition fails', () => {
    const url = `${environment.auth0.backend}/admin/users`;
    const authError = new Error('token error');
    spyOn(console, 'error');
    authServiceSpy.getAccessTokenSilently.and.returnValue(
      throwError(() => authError),
    );

    http.get(url).subscribe({
      next: fail,
      error: (error) => {
        expect(error).toBe(authError);
      },
    });

    httpMock.expectNone(url);
    expect(console.error).toHaveBeenCalledWith(
      'Failed to get access token:',
      authError,
    );
  });
});
