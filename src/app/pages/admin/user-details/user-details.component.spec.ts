import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, UrlTree } from '@angular/router';
import { Renderer2 } from '@angular/core';
import { of, throwError, Observable, EMPTY } from 'rxjs';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';

import { UserDetailsComponent } from './user-details.component';
import {
  ApiService,
  BiocommonsUserDetails,
} from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

describe('UserDetailsComponent', () => {
  let component: UserDetailsComponent;
  let fixture: ComponentFixture<UserDetailsComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockActivatedRoute: {
    snapshot: {
      params: { id: string };
      paramMap: {
        get: (key: string) => string | null;
      };
    };
    params: Observable<{ id: string }>;
    queryParams: Observable<Record<string, never>>;
  };

  const mockUserDetails: BiocommonsUserDetails = {
    user_id: '123',
    name: 'Test User',
    email: 'test@example.com',
    username: 'testuser',
    nickname: 'testuser',
    email_verified: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    last_login: '2023-01-01T00:00:00Z',
    picture: 'https://example.com/picture.jpg',
    identities: [],
    platform_memberships: [
      {
        id: 'pm1',
        platform_id: 'galaxy',
        platform_name: 'Galaxy Australia',
        user_id: '123',
        approval_status: 'approved',
        updated_by: 'admin',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ],
    group_memberships: [
      {
        id: 'gm',
        group_id: 'tsi',
        group_name: 'Threatened Species Initiative',
        group_short_name: 'TSI',
        approval_status: 'pending',
        updated_by: 'admin',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ],
  };

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', [
      'getUserDetails',
      'resendVerificationEmail',
      'approvePlatformAccess',
      'revokePlatformAccess',
      'approveGroupAccess',
      'revokeGroupAccess',
      'unrejectGroupAccess',
      'deleteUser',
      'updateUserUsername',
    ]);
    const rendererSpy = jasmine.createSpyObj('Renderer2', [
      'listen',
      'removeChild',
    ]);
    const routerSpy = jasmine.createSpyObj(
      'Router',
      ['getCurrentNavigation', 'createUrlTree', 'serializeUrl', 'navigate'],
      {
        events: EMPTY,
      },
    );
    routerSpy.getCurrentNavigation.and.returnValue(null);
    routerSpy.createUrlTree.and.returnValue({} as UrlTree);
    routerSpy.serializeUrl.and.returnValue('/mocked-url');

    mockActivatedRoute = {
      snapshot: {
        params: { id: '123' },
        paramMap: {
          get: (key: string) => (key === 'id' ? '123' : null),
        },
      },
      params: of({ id: '123' }),
      queryParams: of({}),
    };

    const authSpy = jasmine.createSpyObj('AuthService', ['refreshUser'], {
      adminPlatforms: signal([]),
      adminGroups: signal([]),
      adminType: signal(null),
    });

    await TestBed.configureTestingModule({
      imports: [UserDetailsComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Renderer2, useValue: rendererSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserDetailsComponent);
    component = fixture.componentInstance;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;

    mockApiService.getUserDetails.and.returnValue(of(mockUserDetails));
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load user details on init', () => {
    fixture.detectChanges();

    expect(mockApiService.getUserDetails).toHaveBeenCalledWith('123');
    expect(component.user()).toEqual(mockUserDetails);
    expect(component.pageLoading()).toBeFalse();
    expect(component.pageError()).toBeNull();
  });

  it('should handle error when loading user details', () => {
    mockApiService.getUserDetails.and.returnValue(
      throwError(() => new Error('API Error')),
    );
    spyOn(console, 'error');

    fixture.detectChanges();

    expect(component.pageError()).toBe('Failed to load user details');
    expect(component.pageLoading()).toBeFalse();
    expect(component.user()).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      'Failed to load user details:',
      jasmine.any(Error),
    );
  });

  it('should handle missing user ID', () => {
    mockActivatedRoute.snapshot.paramMap.get = () => null;

    fixture.detectChanges();

    expect(component.pageError()).toBe('No user ID provided');
    expect(component.pageLoading()).toBeFalse();
    expect(mockApiService.getUserDetails).not.toHaveBeenCalled();
  });

  it('should display user information correctly', () => {
    fixture.detectChanges();

    const userName = fixture.debugElement.query(By.css('[class*="text-3xl"]'));
    const userEmail = fixture.debugElement.query(
      By.css('[class*="font-mono"]'),
    );

    expect(userName.nativeElement.textContent.trim()).toBe('Test User');
    expect(userEmail.nativeElement.textContent.trim()).toBe('123');
  });

  it('should show verified badge for verified users', () => {
    fixture.detectChanges();

    const verifiedBadge = fixture.debugElement.query(By.css('.bg-green-100'));
    expect(verifiedBadge).toBeTruthy();
    expect(verifiedBadge.nativeElement.textContent.trim()).toBe('Verified');
  });

  it('should show unverified badge for unverified users', () => {
    const unverifiedUser = { ...mockUserDetails, email_verified: false };
    mockApiService.getUserDetails.and.returnValue(of(unverifiedUser));

    fixture.detectChanges();

    const unverifiedBadge = fixture.debugElement.query(By.css('.bg-red-100'));
    expect(unverifiedBadge).toBeTruthy();
    expect(unverifiedBadge.nativeElement.textContent.trim()).toBe('Unverified');
  });

  it('should show Actions button for unverified users', () => {
    const unverifiedUser = { ...mockUserDetails, email_verified: false };
    mockApiService.getUserDetails.and.returnValue(of(unverifiedUser));

    fixture.detectChanges();

    const actionsButton = fixture.debugElement.query(By.css('button'));
    expect(actionsButton).toBeTruthy();
    expect(actionsButton.nativeElement.textContent.trim()).toContain('Actions');
  });

  it('should not show Actions button for verified users', () => {
    fixture.detectChanges();

    const buttons = fixture.debugElement.queryAll(By.css('button'));
    const actionsButton = buttons.find((btn) =>
      btn.nativeElement.textContent?.includes('Actions'),
    );
    expect(actionsButton).toBeFalsy();
  });

  const deleteAdminTypes = ['platform', 'biocommons'] as const;
  deleteAdminTypes.forEach((type) => {
    it(`should show Actions button for ${type} admins`, () => {
      const authService = TestBed.inject(
        AuthService,
      ) as jasmine.SpyObj<AuthService>;
      const adminSignal = signal(type);

      Object.defineProperty(authService, 'adminType', {
        get: () => adminSignal,
        configurable: true,
      });
      component.adminType = adminSignal;

      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const actionsButton = buttons.find((btn) =>
        btn.nativeElement.textContent?.includes('Actions'),
      );
      expect(actionsButton).toBeTruthy();
    });
  });

  it('should display platform memberships correctly', () => {
    fixture.detectChanges();

    const allElements = fixture.debugElement.queryAll(By.css('div'));
    const platformSection = allElements.find((el) =>
      el.nativeElement.textContent?.includes('Services'),
    );
    expect(platformSection).toBeTruthy();

    const statusBadges = fixture.debugElement.queryAll(By.css('.bg-green-100'));
    const approvedBadge = statusBadges.find(
      (badge) => badge.nativeElement.textContent.trim() === 'approved',
    );
    expect(approvedBadge).toBeTruthy();
  });

  it('should display group memberships correctly', () => {
    fixture.detectChanges();

    const allElements = fixture.debugElement.queryAll(By.css('div'));
    const groupSection = allElements.find((el) =>
      el.nativeElement.textContent?.includes('Bundles'),
    );
    expect(groupSection).toBeTruthy();

    const pendingBadge = fixture.debugElement.query(By.css('.bg-yellow-100'));
    expect(pendingBadge?.nativeElement.textContent.trim()).toBe('pending');
  });

  it('should get correct platform name', () => {
    expect(component.getPlatformName('galaxy')).toBe('Galaxy Australia');
    expect(component.getPlatformName('bpa_data_portal')).toBe(
      'Bioplatforms Australia Data Portal',
    );
    expect(component.getPlatformName('unknown')).toBe('unknown');
  });

  it('should return true when admin can manage the platform', () => {
    const authService = TestBed.inject(
      AuthService,
    ) as jasmine.SpyObj<AuthService>;
    Object.defineProperty(authService, 'adminPlatforms', {
      value: signal([
        { id: 'galaxy', name: 'Galaxy Australia' },
        { id: 'bpa_data_portal', name: 'BPA Data Portal' },
      ]),
      configurable: true,
    });
    component.adminPlatforms = authService.adminPlatforms;

    expect(component.canManagePlatform('galaxy')).toBeTrue();
    expect(component.canManagePlatform('bpa_data_portal')).toBeTrue();
  });

  it('should return false when admin cannot manage the platform', () => {
    const authService = TestBed.inject(
      AuthService,
    ) as jasmine.SpyObj<AuthService>;
    Object.defineProperty(authService, 'adminPlatforms', {
      value: signal([{ id: 'galaxy', name: 'Galaxy Australia' }]),
      configurable: true,
    });
    component.adminPlatforms = authService.adminPlatforms;

    expect(component.canManagePlatform('bpa_data_portal')).toBeFalse();
    expect(component.canManagePlatform('unknown_platform')).toBeFalse();
  });

  it('should return false when admin has no platforms', () => {
    const authService = TestBed.inject(
      AuthService,
    ) as jasmine.SpyObj<AuthService>;
    Object.defineProperty(authService, 'adminPlatforms', {
      value: signal([]),
      configurable: true,
    });
    component.adminPlatforms = authService.adminPlatforms;

    expect(component.canManagePlatform('galaxy')).toBeFalse();
  });

  it('should resend verification email', () => {
    const mockResponse = { message: 'Email sent successfully' };
    mockApiService.resendVerificationEmail.and.returnValue(of(mockResponse));

    component.user.set(mockUserDetails);
    component.resendVerificationEmail();

    expect(mockApiService.resendVerificationEmail).toHaveBeenCalledWith('123');
    expect(component.openMenuAction()).toBeFalse();
    expect(component.alert()).toEqual({
      type: 'success',
      message: 'Verification email sent successfully',
    });
  });

  it('should handle error when resending verification email', () => {
    mockApiService.resendVerificationEmail.and.returnValue(
      throwError(() => new Error('Email error')),
    );
    spyOn(console, 'error');

    component.user.set(mockUserDetails);
    component.resendVerificationEmail();

    expect(console.error).toHaveBeenCalledWith(
      'Failed to resend verification email:',
      jasmine.any(Error),
    );
    expect(component.alert()).toEqual({
      type: 'error',
      message: 'Failed to resend verification email',
    });
  });

  it('should clear notifications before resending verification email', () => {
    const mockResponse = { message: 'Email sent successfully' };
    mockApiService.resendVerificationEmail.and.returnValue(of(mockResponse));

    component.alert.set({ type: 'error', message: 'Previous error' });
    component.user.set(mockUserDetails);

    component.resendVerificationEmail();

    expect(component.alert()).toEqual({
      type: 'success',
      message: 'Verification email sent successfully',
    });
  });

  it('should display error message when there is an error', () => {
    component.pageError.set('Test error message');
    component.pageLoading.set(false);
    component.user.set(null);
    fixture.detectChanges();

    const errorElement = fixture.debugElement.query(By.css('.text-red-500'));
    expect(errorElement.nativeElement.textContent.trim()).toBe(
      'Test error message',
    );
  });

  it('should set returnUrl from navigation state', () => {
    const mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockRouter.getCurrentNavigation.and.returnValue({
      id: 1,
      initialUrl: {} as UrlTree,
      extractedUrl: {} as UrlTree,
      trigger: 'imperative',
      previousNavigation: null,
      extras: {
        state: {
          returnUrl: '/pending-users',
        },
      },
    });

    fixture = TestBed.createComponent(UserDetailsComponent);
    component = fixture.componentInstance;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    mockApiService.getUserDetails.and.returnValue(of(mockUserDetails));

    fixture.detectChanges();

    expect(component.returnUrl()).toBe('/pending-users');
  });

  it('should set returnUrl from history state when navigation state is not available', () => {
    const mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockRouter.getCurrentNavigation.and.returnValue(null);

    spyOnProperty(history, 'state', 'get').and.returnValue({
      returnUrl: '/revoked-users',
    });

    fixture = TestBed.createComponent(UserDetailsComponent);
    component = fixture.componentInstance;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    mockApiService.getUserDetails.and.returnValue(of(mockUserDetails));

    fixture.detectChanges();

    expect(component.returnUrl()).toBe('/revoked-users');
  });

  describe('Platform Approval and Revoke Modal', () => {
    it('should approve platform access', () => {
      const pendingMembership: BiocommonsUserDetails = {
        ...mockUserDetails,
        platform_memberships: [
          {
            id: 'pm1',
            platform_id: 'galaxy' as const,
            platform_name: 'Galaxy Australia',
            user_id: '123',
            approval_status: 'pending',
            updated_by: 'admin',
            updated_at: '2023-01-01T00:00:00Z',
          },
        ],
      };
      mockApiService.getUserDetails.and.returnValue(of(pendingMembership));
      mockApiService.approvePlatformAccess.and.returnValue(
        of({ updated: true }),
      );

      fixture.detectChanges();

      component.approvePlatform('galaxy');

      expect(mockApiService.approvePlatformAccess).toHaveBeenCalledWith(
        '123',
        'galaxy',
      );
    });

    it('should open revoke modal for platform', () => {
      fixture.detectChanges();

      component.revokePlatform('galaxy');

      expect(component.actionModalData()).toBeTruthy();
      expect(component.actionModalData()?.type).toBe('platform');
      expect(component.actionModalData()?.id).toBe('galaxy');
    });

    it('should close revoke modal and reset form', () => {
      component.actionModalData.set({
        action: 'revoke',
        type: 'platform',
        id: 'galaxy',
        name: 'Galaxy Australia',
        email: 'test@example.com',
      });
      component.reasonControl.setValue('test reason');

      component.closeActionModal();

      expect(component.actionModalData()).toBeNull();
      expect(component.reasonControl.value).toBe('');
    });

    it('should revoke platform access with reason', () => {
      mockApiService.revokePlatformAccess.and.returnValue(
        of({ updated: true }),
      );
      mockApiService.getUserDetails.and.returnValue(of(mockUserDetails));
      fixture.detectChanges();

      component.actionModalData.set({
        action: 'revoke',
        type: 'platform',
        id: 'galaxy',
        name: 'Galaxy Australia',
        email: 'test@example.com',
      });
      component.reasonControl.setValue('Security violation');

      component.confirmActionModal();

      expect(mockApiService.revokePlatformAccess).toHaveBeenCalledWith(
        '123',
        'galaxy',
        'Security violation',
      );
      expect(component.actionModalData()).toBeNull();
    });

    it('should not revoke without reason', () => {
      component.actionModalData.set({
        action: 'revoke',
        type: 'platform',
        id: 'galaxy',
        name: 'Galaxy Australia',
        email: 'test@example.com',
      });
      component.reasonControl.setValue('');

      component.confirmActionModal();

      expect(mockApiService.revokePlatformAccess).not.toHaveBeenCalled();
      expect(component.reasonControl.touched).toBeTrue();
    });

    it('should handle approve platform error', () => {
      const pendingMembership: BiocommonsUserDetails = {
        ...mockUserDetails,
        platform_memberships: [
          {
            id: 'pm1',
            platform_id: 'galaxy' as const,
            platform_name: 'Galaxy Australia',
            user_id: '123',
            approval_status: 'pending',
            updated_by: 'admin',
            updated_at: '2023-01-01T00:00:00Z',
          },
        ],
      };
      mockApiService.getUserDetails.and.returnValue(of(pendingMembership));
      mockApiService.approvePlatformAccess.and.returnValue(
        throwError(() => new Error('Approval failed')),
      );
      spyOn(console, 'error');

      fixture.detectChanges();

      component.approvePlatform('galaxy');

      expect(console.error).toHaveBeenCalledWith(
        'Failed to approve service access:',
        jasmine.any(Error),
      );
      expect(component.alert()?.type).toBe('error');
      expect(component.alert()?.message).toBe(
        'Failed to approve service access',
      );
    });

    it('should handle revoke platform error', () => {
      mockApiService.revokePlatformAccess.and.returnValue(
        throwError(() => new Error('Revoke failed')),
      );
      spyOn(console, 'error');
      fixture.detectChanges();

      component.actionModalData.set({
        action: 'revoke',
        type: 'platform',
        id: 'galaxy',
        name: 'Galaxy Australia',
        email: 'test@example.com',
      });
      component.reasonControl.setValue('Test reason');

      component.confirmActionModal();

      expect(console.error).toHaveBeenCalledWith(
        'Failed to revoke service access:',
        jasmine.any(Error),
      );
      expect(component.alert()?.type).toBe('error');
      expect(component.actionModalData()).toBeNull();
    });

    it('should show revoke modal in DOM when open', () => {
      component.actionModalData.set({
        action: 'revoke',
        type: 'platform',
        id: 'galaxy',
        name: 'Galaxy Australia',
        email: 'test@example.com',
      });
      fixture.detectChanges();

      const modal = fixture.debugElement.query(By.css('.fixed.inset-0'));
      expect(modal).toBeTruthy();

      const modalTitle = fixture.debugElement.query(By.css('#modal-title'));
      expect(modalTitle).toBeTruthy();
      expect(modalTitle.nativeElement.textContent).toContain(
        'Do you want to revoke',
      );
    });

    it('should display revocation reason tooltip for revoked platforms', () => {
      const revokedMembership: BiocommonsUserDetails = {
        ...mockUserDetails,
        platform_memberships: [
          {
            id: 'pm1',
            platform_id: 'galaxy' as const,
            platform_name: 'Galaxy Australia',
            user_id: '123',
            approval_status: 'revoked',
            updated_by: 'admin',
            updated_at: '2023-01-01T00:00:00Z',
            revocation_reason: 'Access expired',
          },
        ],
      };
      mockApiService.getUserDetails.and.returnValue(of(revokedMembership));
      fixture.detectChanges();

      const tooltip = fixture.debugElement.query(
        By.css('.group-hover\\:block'),
      );
      expect(tooltip).toBeTruthy();
    });
  });

  describe('Group Membership Actions', () => {
    it('should approve group membership', () => {
      mockApiService.approveGroupAccess.and.returnValue(of({ updated: true }));
      mockApiService.getUserDetails.and.returnValue(of(mockUserDetails));
      fixture.detectChanges();

      component.approveGroup('tsi');

      expect(mockApiService.approveGroupAccess).toHaveBeenCalledWith(
        '123',
        'tsi',
      );
      expect(component.alert()?.type).toBe('success');
      expect(component.alert()?.message).toBe(
        'Bundle access approved successfully',
      );
    });

    it('should unreject group membership', () => {
      mockApiService.unrejectGroupAccess.and.returnValue(of({ updated: true }));
      mockApiService.getUserDetails.and.returnValue(of(mockUserDetails));
      fixture.detectChanges();

      component.unrejectGroup('tsi');
      expect(mockApiService.unrejectGroupAccess).toHaveBeenCalledWith(
        '123',
        'tsi',
      );
      expect(component.alert()?.type).toBe('success');
      expect(component.alert()?.message).toBe(
        'Bundle access unrejected successfully',
      );
    });

    it('should open revoke modal for group membership', () => {
      fixture.detectChanges();

      component.revokeGroup('tsi', 'Threatened Species Initiative');

      expect(component.actionModalData()).toBeTruthy();
      expect(component.actionModalData()?.type).toBe('group');
      expect(component.actionModalData()?.id).toBe('tsi');
      expect(component.actionModalData()?.name).toBe(
        'Threatened Species Initiative',
      );
    });

    it('should revoke group membership with reason', () => {
      mockApiService.revokeGroupAccess.and.returnValue(of({ updated: true }));
      mockApiService.getUserDetails.and.returnValue(of(mockUserDetails));
      fixture.detectChanges();

      component.actionModalData.set({
        action: 'revoke',
        type: 'group',
        id: 'tsi',
        name: 'Threatened Species Initiative',
        email: 'test@example.com',
      });
      component.reasonControl.setValue('No longer needed');

      component.confirmActionModal();

      expect(mockApiService.revokeGroupAccess).toHaveBeenCalledWith(
        '123',
        'tsi',
        'No longer needed',
      );
      expect(component.actionModalData()).toBeNull();
    });
  });

  describe('User Deletion', () => {
    it('should open delete modal', () => {
      fixture.detectChanges();
      component.deleteUserBegin();
      expect(component.actionModalData()).toBeTruthy();
      expect(component.actionModalData()?.type).toBe('user');
      expect(component.actionModalData()?.action).toBe('delete');
    });

    it('should delete user with reason', () => {
      mockApiService.deleteUser.and.returnValue(
        of('User deleted successfully'),
      );
      mockApiService.getUserDetails.and.returnValue(of(mockUserDetails));
      fixture.detectChanges();

      component.actionModalData.set({
        action: 'delete',
        type: 'user',
        id: '123',
        name: 'user@example.com',
        email: 'user@example.com',
      });
      component.reasonControl.setValue('Deleting user');

      component.confirmActionModal();

      expect(mockApiService.deleteUser).toHaveBeenCalledWith(
        '123',
        'Deleting user',
      );
      expect(component.actionModalData()).toBeNull();
    });

    it('should handle error when deleting user', () => {
      mockApiService.deleteUser.and.returnValue(
        throwError(() => new Error('API Error')),
      );
      spyOn(console, 'error');
      fixture.detectChanges();

      component.actionModalData.set({
        action: 'delete',
        type: 'user',
        id: '123',
        name: 'user@example.com',
        email: 'user@example.com',
      });
      component.reasonControl.setValue('Deleting user');

      component.confirmActionModal();

      expect(console.error).toHaveBeenCalledWith(
        'Failed to delete user:',
        jasmine.any(Error),
      );
      expect(component.alert()).toEqual({
        type: 'error',
        message: 'Failed to delete user',
      });
      expect(component.actionModalData()).toBeNull();
    });
  });

  describe('Username Update', () => {
    it('should open username modal', () => {
      fixture.detectChanges();
      component['openUsernameModal']();
      expect(component.activeModal()).toBe('username');
      expect(component.usernameForm.value.username).toBe('testuser');
    });

    it('should close username modal', () => {
      fixture.detectChanges();
      component.activeModal.set('username');
      component.usernameForm.patchValue({ username: 'newusername' });
      component['closeUsernameModal']();
      expect(component.activeModal()).toBeNull();
    });

    it('should update username successfully', () => {
      const updatedUser = { ...mockUserDetails, username: 'newusername' };
      mockApiService.updateUserUsername.and.returnValue(of(updatedUser));
      mockApiService.getUserDetails.and.returnValue(of(updatedUser));
      fixture.detectChanges();

      component.activeModal.set('username');
      component.usernameForm.patchValue({ username: 'newusername' });
      component['updateUsername']();

      expect(mockApiService.updateUserUsername).toHaveBeenCalledWith(
        '123',
        'newusername',
      );
      expect(component.alert()).toEqual({
        type: 'success',
        message: "User's username updated successfully",
      });
      expect(component.activeModal()).toBeNull();
    });

    it('should not update username if form is invalid', () => {
      fixture.detectChanges();
      component.activeModal.set('username');
      component.usernameForm.patchValue({ username: '' });
      component['updateUsername']();

      expect(mockApiService.updateUserUsername).not.toHaveBeenCalled();
    });

    it('should handle error when updating username', () => {
      mockApiService.updateUserUsername.and.returnValue(
        throwError(() => ({ error: { message: 'Username already taken' } })),
      );
      spyOn(console, 'error');
      fixture.detectChanges();

      component.activeModal.set('username');
      component.usernameForm.patchValue({ username: 'newusername' });
      component['updateUsername']();

      expect(console.error).toHaveBeenCalledWith(
        'Failed to update username: ',
        jasmine.any(Object),
      );
      expect(component.alert()).toEqual({
        type: 'error',
        message: 'Username already taken',
      });
      expect(component.activeModal()).toBeNull();
    });

    it('should handle field-level validation error', () => {
      const error = {
        error: {
          message: 'Validation failed',
          field_errors: [{ field: 'username', message: 'Username is taken' }],
        },
      };
      mockApiService.updateUserUsername.and.returnValue(
        throwError(() => error),
      );
      spyOn(console, 'error');
      fixture.detectChanges();

      component.activeModal.set('username');
      component.usernameForm.patchValue({ username: 'takenusername' });
      component['updateUsername']();

      // Modal should stay open when there's a field-level error
      expect(component.activeModal()).toBe('username');
      // No general alert should be shown (error is shown inline on the field)
      expect(component.alert()).toBeNull();
    });
  });
});
