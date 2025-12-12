import { TestBed } from '@angular/core/testing';
import {
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { rootRedirectGuard } from './root-redirect.guard';
import { AuthService } from '../services/auth.service';
import { signal } from '@angular/core';
import { Observable, of } from 'rxjs';

describe('rootRedirectGuard', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', [], {
      isLoading: signal(false),
      isGeneralAdmin$: of(false),
    });
    const routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);

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

  it('should redirect to /all-users when user is admin', (done) => {
    Object.defineProperty(mockAuthService, 'isGeneralAdmin$', {
      value: of(true),
      writable: true,
    });
    const urlTree = {} as UrlTree;
    mockRouter.createUrlTree.and.returnValue(urlTree);

    const result = TestBed.runInInjectionContext(() =>
      rootRedirectGuard(
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
      ),
    );

    (result as Observable<UrlTree>).subscribe((value) => {
      expect(value).toBe(urlTree);
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/all-users']);
      done();
    });
  });

  it('should redirect to /profile when user is not admin', (done) => {
    Object.defineProperty(mockAuthService, 'isGeneralAdmin$', {
      value: of(false),
      writable: true,
    });
    const urlTree = {} as UrlTree;
    mockRouter.createUrlTree.and.returnValue(urlTree);

    const result = TestBed.runInInjectionContext(() =>
      rootRedirectGuard(
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
      ),
    );

    (result as Observable<UrlTree>).subscribe((value) => {
      expect(value).toBe(urlTree);
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/profile']);
      done();
    });
  });
});
