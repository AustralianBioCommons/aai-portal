import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { signal } from '@angular/core';
import { Observable, of } from 'rxjs';

describe('authGuard', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj(
      'AuthService',
      ['ensureAuthenticated', 'login'],
      {
        isLoading: signal(false),
      },
    );

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authSpy },
      ],
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
});
