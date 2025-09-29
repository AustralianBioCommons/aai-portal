import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { platformAdminGuard } from './platform-admin.guard';
import { signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiService } from '../services/api.service';
import { toObservable } from '@angular/core/rxjs-interop';

describe('adminGuard', () => {
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['getAdminPlatforms']);

    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiSpy }],
    });

    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should be created', () => {
    const executeGuard = TestBed.runInInjectionContext(() =>
      platformAdminGuard('galaxy'),
    );
    expect(executeGuard).toBeTruthy();
  });

  it('should return true when user has admin rights to the platform', (done) => {
    mockApiService.getAdminPlatforms.and.returnValue(
      of([{ id: 'galaxy', name: 'Galaxy Australia' }]),
    );

    const result = TestBed.runInInjectionContext(() => {
      const galaxyGuard = platformAdminGuard('galaxy');
      return galaxyGuard(
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
      );
    });

    (result as Observable<boolean>).subscribe((canActivate) => {
      expect(canActivate).toBe(true);
      done();
    });
  });

  it("should return false when user doesn't have admin rights to the platform", (done) => {
    mockApiService.getAdminPlatforms.and.returnValue(
      of([{ id: 'bpa_data_portal', name: 'BPA' }]),
    );

    const result = TestBed.runInInjectionContext(() => {
      const galaxyGuard = platformAdminGuard('galaxy');
      return galaxyGuard(
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
      );
    });

    (result as Observable<boolean>).subscribe((canActivate) => {
      expect(canActivate).toBe(false);
      done();
    });
  });
});
