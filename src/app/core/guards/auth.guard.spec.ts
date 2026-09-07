import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

describe('authGuard', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj(
      'AuthService',
      ['ensureAuthenticated', 'login'],
      {
        isLoading: signal(false),
        authError: signal(null),
      },
    );

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: authSpy }, provideRouter([])],
    });

    mockAuthService = TestBed.inject(
      AuthService,
    ) as jasmine.SpyObj<AuthService>;
  });

  it('should be created', () => {
    const executeGuard = TestBed.runInInjectionContext(() => authGuard);
    expect(executeGuard).toBeTruthy();
  });

  it('should return true when user is authenticated', (done) => {
    mockAuthService.ensureAuthenticated.and.returnValue(of(true));

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    (result as Observable<boolean>).subscribe((value) => {
      expect(value).toBe(true);
      done();
    });
  });

  it('should trigger login when user is not authenticated', (done) => {
    mockAuthService.ensureAuthenticated.and.returnValue(of(false));

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    (result as Observable<boolean>).subscribe((value) => {
      expect(value).toBe(false);
      expect(mockAuthService.login).toHaveBeenCalled();
      done();
    });
  });

  it('should route to portal /login (not Auth0) when tenant has no custom domain', (done) => {
    mockAuthService.ensureAuthenticated.and.returnValue(of(false));
    const originalDomain = environment.auth0.domain;
    environment.auth0.domain = 'biocloud-dev-aaf.au.auth0.com';

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    (result as Observable<boolean | UrlTree>).subscribe((value) => {
      expect(mockAuthService.login).not.toHaveBeenCalled();
      expect(value).not.toBe(false);
      expect((value as UrlTree).toString()).toBe('/login');
      environment.auth0.domain = originalDomain;
      done();
    });
  });
});
