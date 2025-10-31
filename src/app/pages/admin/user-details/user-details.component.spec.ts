import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, UrlTree } from '@angular/router';
import { Renderer2 } from '@angular/core';
import { of, throwError, Observable, EMPTY } from 'rxjs';
import { By } from '@angular/platform-browser';

import { UserDetailsComponent } from './user-details.component';
import {
  ApiService,
  BiocommonsUserDetails,
} from '../../../core/services/api.service';

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
      },
    ],
    group_memberships: [
      {
        id: 'pm2',
        group_id: 'bpa',
        group_name: 'Bioplatforms Australia',
        group_short_name: 'BPA',
        approval_status: 'pending',
        updated_by: 'admin',
      },
    ],
  };

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', [
      'getUserDetails',
      'resendVerificationEmail',
      'approvePlatformAccess',
      'revokePlatformAccess',
    ]);
    const rendererSpy = jasmine.createSpyObj('Renderer2', [
      'listen',
      'removeChild',
    ]);
    const routerSpy = jasmine.createSpyObj(
      'Router',
      ['getCurrentNavigation', 'createUrlTree', 'serializeUrl'],
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

    await TestBed.configureTestingModule({
      imports: [UserDetailsComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy },
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
    expect(component.loading()).toBeFalse();
    expect(component.error()).toBeNull();
  });

  it('should handle error when loading user details', () => {
    mockApiService.getUserDetails.and.returnValue(
      throwError(() => new Error('API Error')),
    );
    spyOn(console, 'error');

    fixture.detectChanges();

    expect(component.error()).toBe('Failed to load user details');
    expect(component.loading()).toBeFalse();
    expect(component.user()).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      'Failed to load user details:',
      jasmine.any(Error),
    );
  });

  it('should handle missing user ID', () => {
    mockActivatedRoute.snapshot.paramMap.get = () => null;

    fixture.detectChanges();

    expect(component.error()).toBe('No user ID provided');
    expect(component.loading()).toBeFalse();
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

  it('should show Actions button only for unverified users', () => {
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

  it('should toggle action menu when Actions button is clicked', () => {
    const unverifiedUser = { ...mockUserDetails, email_verified: false };
    mockApiService.getUserDetails.and.returnValue(of(unverifiedUser));

    fixture.detectChanges();

    expect(component.actionMenuOpen()).toBeFalse();

    component.toggleActionMenu();
    expect(component.actionMenuOpen()).toBeTrue();

    component.toggleActionMenu();
    expect(component.actionMenuOpen()).toBeFalse();
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

  it('should resend verification email', () => {
    const mockResponse = { message: 'Email sent successfully' };
    mockApiService.resendVerificationEmail.and.returnValue(of(mockResponse));

    component.user.set(mockUserDetails);
    component.resendVerificationEmail();

    expect(mockApiService.resendVerificationEmail).toHaveBeenCalledWith('123');
    expect(component.actionMenuOpen()).toBeFalse();
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
    component.error.set('Test error message');
    component.loading.set(false);
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

  describe('Platform Toggle and Revoke Modal', () => {
    it('should toggle platform approval to approved', () => {
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
          },
        ],
      };
      mockApiService.getUserDetails.and.returnValue(of(pendingMembership));
      mockApiService.approvePlatformAccess.and.returnValue(
        of({ updated: true }),
      );

      fixture.detectChanges();

      component.togglePlatformApproval('galaxy', 'pending');

      expect(mockApiService.approvePlatformAccess).toHaveBeenCalledWith(
        '123',
        'galaxy',
      );
    });

    it('should open revoke modal when toggling approved platform', () => {
      fixture.detectChanges();

      component.togglePlatformApproval('galaxy', 'approved');

      expect(component.showRevokeModal()).toBeTrue();
      expect(component.selectedPlatformForRevoke()).toBe('galaxy');
    });

    it('should close revoke modal and reset form', () => {
      component.showRevokeModal.set(true);
      component.selectedPlatformForRevoke.set('galaxy');
      component.revokeReasonControl.setValue('test reason');

      component.closeRevokeModal();

      expect(component.showRevokeModal()).toBeFalse();
      expect(component.selectedPlatformForRevoke()).toBeNull();
      expect(component.revokeReasonControl.value).toBe('');
    });

    it('should revoke platform access with reason', () => {
      mockApiService.revokePlatformAccess.and.returnValue(
        of({ updated: true }),
      );
      mockApiService.getUserDetails.and.returnValue(of(mockUserDetails));
      fixture.detectChanges();

      component.selectedPlatformForRevoke.set('galaxy');
      component.revokeReasonControl.setValue('Security violation');

      component.confirmRevokePlatformAccess();

      expect(mockApiService.revokePlatformAccess).toHaveBeenCalledWith(
        '123',
        'galaxy',
        'Security violation',
      );
      expect(component.showRevokeModal()).toBeFalse();
    });

    it('should not revoke without reason', () => {
      component.selectedPlatformForRevoke.set('galaxy');
      component.revokeReasonControl.setValue('');

      component.confirmRevokePlatformAccess();

      expect(mockApiService.revokePlatformAccess).not.toHaveBeenCalled();
      expect(component.revokeReasonControl.touched).toBeTrue();
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
          },
        ],
      };
      mockApiService.getUserDetails.and.returnValue(of(pendingMembership));
      mockApiService.approvePlatformAccess.and.returnValue(
        throwError(() => new Error('Approval failed')),
      );
      spyOn(console, 'error');

      fixture.detectChanges();

      component.togglePlatformApproval('galaxy', 'pending');

      expect(console.error).toHaveBeenCalledWith(
        'Failed to approve platform access:',
        jasmine.any(Error),
      );
      expect(component.alert()?.type).toBe('error');
      expect(component.alert()?.message).toBe(
        'Failed to approve platform access',
      );
    });

    it('should handle revoke platform error', () => {
      mockApiService.revokePlatformAccess.and.returnValue(
        throwError(() => new Error('Revoke failed')),
      );
      spyOn(console, 'error');
      fixture.detectChanges();

      component.selectedPlatformForRevoke.set('galaxy');
      component.revokeReasonControl.setValue('Test reason');

      component.confirmRevokePlatformAccess();

      expect(console.error).toHaveBeenCalledWith(
        'Failed to revoke platform access:',
        jasmine.any(Error),
      );
      expect(component.alert()?.type).toBe('error');
      expect(component.showRevokeModal()).toBeFalse();
    });

    it('should display toggle switch for platform memberships', () => {
      fixture.detectChanges();

      const toggleButton = fixture.debugElement.query(
        By.css('button[role="switch"]'),
      );
      expect(toggleButton).toBeTruthy();
      expect(toggleButton.nativeElement.getAttribute('aria-checked')).toBe(
        'true',
      );
    });

    it('should show revoke modal in DOM when open', () => {
      component.showRevokeModal.set(true);
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
});
