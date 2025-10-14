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

    const actionsButton = fixture.debugElement.query(By.css('button'));
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
      el.nativeElement.textContent?.includes('Platform Access'),
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
      el.nativeElement.textContent?.includes('Bundle Access'),
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

  it('should handle resend verification email with no user ID', () => {
    spyOn(console, 'error');
    component.user.set(null);

    component.resendVerificationEmail();

    expect(mockApiService.resendVerificationEmail).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('No user ID available');
    expect(component.alert()).toEqual({
      type: 'error',
      message: 'No user ID available',
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
});
