import { TestBed } from '@angular/core/testing';
import {
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { loginGuard } from './login.guard';
import { AuthService } from '../services/auth.service';
import { signal } from '@angular/core';
import { Observable } from 'rxjs';

describe('loginGuard', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated'], {
      isLoading: signal(false),
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    mockAuthService = TestBed.inject(
      AuthService,
    ) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    const executeGuard = TestBed.runInInjectionContext(() => loginGuard);
    expect(executeGuard).toBeTruthy();
  });

  it('should return true when user is not authenticated', (done) => {
    mockAuthService.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      loginGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    (result as Observable<boolean>).subscribe((value) => {
      expect(value).toBe(true);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
      done();
    });
  });

  it('should return false and navigate to home when user is authenticated', (done) => {
    mockAuthService.isAuthenticated.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      loginGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    (result as Observable<boolean>).subscribe((value) => {
      expect(value).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
      done();
    });
  });
});
