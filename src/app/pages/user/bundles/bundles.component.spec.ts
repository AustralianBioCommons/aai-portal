import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BundlesComponent } from './bundles.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import {
  ApiService,
  UserGroupStatus,
} from '../../../core/services/api.service';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { AuthService } from '../../../core/services/auth.service';
import { signal } from '@angular/core';

describe('BundlesComponent', () => {
  let component: BundlesComponent;
  let fixture: ComponentFixture<BundlesComponent>;
  let apiService: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockUser = (email: string) => ({
    sub: 'auth0|123',
    email,
    email_verified: true,
    name: 'Test User',
    updated_at: '',
  });

  beforeEach(async () => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getUserGroups',
      'requestGroupAccess',
    ]);
    const authServiceStub = { user: signal(mockUser('user@unsw.edu.au')) };

    await TestBed.configureTestingModule({
      imports: [BundlesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: AuthService, useValue: authServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BundlesComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    router = TestBed.inject(Router);
    apiService.getUserGroups.and.returnValue(of([]));
  });

  it('should create', () => {
    apiService.getUserGroups.and.returnValue(of([]));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('Groups that are already approved are disabled in the selection', () => {
    const mockGroups: UserGroupStatus[] = [
      {
        group_id: 'biocommons/group/tsi',
        group_name: 'Threatened Species Initiative',
        approval_status: 'approved',
      },
    ];
    apiService.getUserGroups.and.returnValue(of(mockGroups));

    fixture.detectChanges();

    const tsiBundle = component.bundles().find((b) => b.id === 'tsi');
    expect(tsiBundle?.disabled).toBeTrue();
  });

  it('Selected bundle is submitted via the apiService', () => {
    apiService.getUserGroups.and.returnValue(of([]));
    fixture.detectChanges();

    const bundleId = 'tsi';
    component.bundleForm.patchValue({ bundle: bundleId });

    apiService.requestGroupAccess.and.returnValue(of({ message: 'Success' }));
    const routerSpy = spyOn(router, 'navigate');

    component.submit();

    expect(apiService.requestGroupAccess).toHaveBeenCalledWith(
      `biocommons/group/${bundleId}`,
      '',
    );
    expect(routerSpy).toHaveBeenCalledWith(['/profile']);
  });

  it('should submit bundle with reason when provided', () => {
    apiService.getUserGroups.and.returnValue(of([]));
    fixture.detectChanges();

    const bundleId = 'tsi';
    const reason = 'Need access for biodiversity research';
    component.bundleForm.patchValue({ bundle: bundleId, reason: reason });

    apiService.requestGroupAccess.and.returnValue(of({ message: 'Success' }));
    const routerSpy = spyOn(router, 'navigate');

    component.submit();

    expect(apiService.requestGroupAccess).toHaveBeenCalledWith(
      `biocommons/group/${bundleId}`,
      reason,
    );
    expect(routerSpy).toHaveBeenCalledWith(['/profile']);
  });

  it('should disable submit button when no bundle is selected', () => {
    apiService.getUserGroups.and.returnValue(of([]));
    fixture.detectChanges();

    // Initially no bundle is selected
    expect(component.selected()).toBeUndefined();

    const buttonDebugEl = fixture.debugElement.query(
      By.directive(ButtonComponent),
    );
    expect(buttonDebugEl).withContext('app-button not found').toBeTruthy();

    const buttonCmp = buttonDebugEl.componentInstance as ButtonComponent;
    expect(buttonCmp.disabled()).toBeTrue();
  });

  it('should enable submit button when bundle is selected and disable when deselected', () => {
    fixture.detectChanges();
    const buttonDebugEl = fixture.debugElement.query(
      By.directive(ButtonComponent),
    );
    expect(buttonDebugEl).withContext('app-button not found').toBeTruthy();

    const buttonCmp = buttonDebugEl.componentInstance as ButtonComponent;

    // Select a bundle
    component.bundleForm.patchValue({ bundle: 'tsi' });
    fixture.detectChanges();

    expect(component.selected()).toBeDefined();
    expect(component.selected()?.id).toBe('tsi');
    expect(buttonCmp.disabled()).toBe(false);

    // Deselect the bundle
    component.bundleForm.patchValue({ bundle: '' });
    fixture.detectChanges();

    expect(component.selected()).toBeUndefined();
    expect(buttonCmp.disabled()).toBe(true);
  });

  describe('SBP email domain check', () => {
    beforeEach(() => {
      apiService.getUserGroups.and.returnValue(of([]));
      fixture.detectChanges();
      component.bundleForm.patchValue({ bundle: 'sbp_workflow_execution' });
    });

    it('should set errorAlert and not call API when email domain is not allowed', () => {
      const authService = TestBed.inject(AuthService) as unknown as {
        user: ReturnType<typeof signal>;
      };
      (authService.user as ReturnType<typeof signal<unknown>>).set(
        mockUser('user@gmail.com'),
      );

      component.submit();

      expect(component.errorAlert()).toBeTruthy();
      expect(apiService.requestGroupAccess).not.toHaveBeenCalled();
    });

    it('should submit when email domain is on the allowed list', () => {
      apiService.requestGroupAccess.and.returnValue(of({ message: 'Success' }));

      component.submit();

      expect(component.errorAlert()).toBeNull();
      expect(apiService.requestGroupAccess).toHaveBeenCalledWith(
        'biocommons/group/sbp_workflow_execution',
        '',
      );
    });

    it('should clear errorAlert when bundle selection changes', () => {
      const authService = TestBed.inject(AuthService) as unknown as {
        user: ReturnType<typeof signal>;
      };
      (authService.user as ReturnType<typeof signal<unknown>>).set(
        mockUser('user@gmail.com'),
      );
      component.submit();
      expect(component.errorAlert()).toBeTruthy();

      component.bundleForm.patchValue({ bundle: 'tsi' });

      expect(component.errorAlert()).toBeNull();
    });
  });
});
