import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileComponent } from './profile.component';
import {
  ApiService,
  BiocommonsUserDetails,
  UserProfileData,
} from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;

  type ProfileTestHarness = ProfileComponent & {
    openModal(type: 'username' | 'password' | 'name' | 'email'): void;
    updateUsername(): void;
    updateName(): void;
    updatePassword(): void;
    sendEmailOtp(): void;
    confirmEmailChange(): void;
  };
  let harness: ProfileTestHarness;

  const mockUser: UserProfileData = {
    user_id: 'auth0|1234567890',
    name: 'Example User',
    email: 'user@example.com',
    email_verified: true,
    username: 'user123',
    picture: 'https://example.com/user.jpg',
    created_at: '2024-01-01T00:00:00Z',
    last_login: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    show_welcome_message: null,
    platform_memberships: [
      {
        platform_id: 'galaxy',
        platform_name: 'Galaxy Australia',
        approval_status: 'approved',
      },
    ],
    group_memberships: [
      {
        group_id: 'biocommons/group/tsi',
        group_name: 'Threatened Species Initiative',
        group_short_name: 'TSI',
        approval_status: 'pending',
      },
    ],
  };

  const updatedProfile: UserProfileData = {
    ...mockUser,
    username: 'valid-username',
  };

  const mockAuth0User: BiocommonsUserDetails = {
    created_at: '2024-01-01T00:00:00Z',
    email: 'user@example.com',
    email_verified: true,
    identities: [],
    name: 'Example User',
    nickname: 'valid-username',
    picture: 'https://example.com/user.jpg',
    updated_at: '2024-01-02T00:00:00Z',
    user_id: 'auth0|1234567890',
    username: 'valid-username',
    last_login: '2024-01-04T00:00:00Z',
    platform_memberships: [],
    group_memberships: [],
  };

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', [
      'getUserProfile',
      'updateUsername',
      'updatePassword',
      'updateName',
      'requestEmailChange',
      'continueEmailChange',
    ]);
    const authSpy = jasmine.createSpyObj('AuthService', ['refreshUser'], {
      isGeneralAdmin: signal(false),
    });

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiService, useValue: apiSpy },
        { provide: AuthService, useValue: authSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {},
              paramMap: { get: () => null },
            },
            firstChild: null,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    harness = component as ProfileTestHarness;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    mockApiService.getUserProfile.and.returnValue(of(mockUser));
    mockApiService.updateUsername.and.returnValue(of(mockAuth0User));
    mockApiService.updatePassword.and.returnValue(of(true));
    mockApiService.updateName.and.returnValue(of(mockAuth0User));
    mockApiService.requestEmailChange.and.returnValue(
      of({ message: 'OTP sent to the requested email address.' }),
    );
    mockApiService.continueEmailChange.and.returnValue(of(void 0));
  });

  const openModal = (type: 'username' | 'password' | 'name' | 'email') =>
    harness.openModal(type);
  const updateUsername = () => harness.updateUsername();
  const updateName = () => harness.updateName();
  const updatePassword = () => harness.updatePassword();
  const sendEmailOtp = () => harness.sendEmailOtp();
  const confirmEmailChange = () => harness.confirmEmailChange();

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load the user profile data', () => {
    fixture.detectChanges();
    expect(mockApiService.getUserProfile).toHaveBeenCalled();
    expect(component.user()).toEqual(mockUser);
    expect(component.pageLoading()).toBeFalse();
    expect(component.pageError()).toBeNull();
  });

  it('should show welcome message when show_welcome_message is true', () => {
    const userWithWelcomeMessage: UserProfileData = {
      ...mockUser,
      show_welcome_message: true,
    };
    mockApiService.getUserProfile.and.returnValue(of(userWithWelcomeMessage));

    fixture.detectChanges();

    expect(component.alert()).toEqual({
      type: 'success',
      message: 'Password updated. Welcome to your new access profile!',
    });
  });

  it('should not show welcome message when show_welcome_message is false', () => {
    const userWithoutWelcomeMessage: UserProfileData = {
      ...mockUser,
      show_welcome_message: false,
    };
    mockApiService.getUserProfile.and.returnValue(
      of(userWithoutWelcomeMessage),
    );

    fixture.detectChanges();

    expect(component.alert()).toBeNull();
  });

  it('should display user info correctly', () => {
    fixture.detectChanges();
    const userName = fixture.debugElement.query(By.css('#user-name'));
    const userEmail = fixture.debugElement.query(By.css('#user-email'));
    expect(userName.nativeElement.textContent).toContain('Example User');
    expect(userEmail.nativeElement.textContent).toContain('user@example.com');
  });

  it('updates the name when a valid value is entered', () => {
    fixture.detectChanges();
    const loadSpy = spyOn(
      component as unknown as { loadUserProfile(): void },
      'loadUserProfile',
    ).and.callThrough();

    openModal('name');
    component.nameForm.controls.firstName.setValue('Jane');
    component.nameForm.controls.lastName.setValue('Doe');
    updateName();
    fixture.detectChanges();

    expect(mockApiService.updateName).toHaveBeenCalledWith('Jane', 'Doe');
    expect(component.alert()).toEqual({
      type: 'success',
      message: 'Name updated successfully',
    });
    expect(loadSpy).toHaveBeenCalled();
  });

  it('updates firstName and lastName when user has given_name and family_name', () => {
    const userWithNames: UserProfileData = {
      ...mockAuth0User,
      given_name: 'John',
      family_name: 'Doe',
      last_login: '2024-01-04T00:00:00Z',
      show_welcome_message: null,
    };
    mockApiService.getUserProfile.and.returnValue(of(userWithNames));
    mockApiService.updateName.and.returnValue(of(mockAuth0User));

    fixture.detectChanges();
    const loadSpy = spyOn(
      component as unknown as { loadUserProfile(): void },
      'loadUserProfile',
    ).and.callThrough();

    openModal('name');
    component.nameForm.controls.firstName.setValue('Jane');
    component.nameForm.controls.lastName.setValue('Smith');
    updateName();
    fixture.detectChanges();

    expect(mockApiService.updateName).toHaveBeenCalledWith('Jane', 'Smith');
    expect(component.alert()).toEqual({
      type: 'success',
      message: 'Name updated successfully',
    });
    expect(loadSpy).toHaveBeenCalled();
  });

  it('shows an error alert when updating the name fails', () => {
    const errorResponse = { error: { detail: 'Unable to update name' } };
    mockApiService.updateName.and.returnValue(throwError(() => errorResponse));

    fixture.detectChanges();

    openModal('name');
    component.nameForm.controls.firstName.setValue('Bad');
    component.nameForm.controls.lastName.setValue('Name');
    updateName();
    fixture.detectChanges();

    expect(component.alert()).toEqual({
      type: 'error',
      message: 'Unable to update name',
    });
  });

  it('updates the username when a valid value is entered', () => {
    mockApiService.updateUsername.and.returnValue(of(mockAuth0User));
    fixture.detectChanges();
    mockApiService.getUserProfile.and.returnValue(of(updatedProfile));

    openModal('username');
    fixture.detectChanges();

    component.usernameForm.controls.username.setValue('valid-username');
    component.usernameForm.controls.username.markAsTouched();
    updateUsername();
    fixture.detectChanges();

    expect(mockApiService.updateUsername).toHaveBeenCalledWith(
      'valid-username',
    );
    expect(component.user()).toEqual(updatedProfile);
    expect(component.alert()).toEqual({
      type: 'success',
      message: 'Username updated successfully',
    });
  });

  it('shows a validation error and skips saving when the username is invalid', () => {
    fixture.detectChanges();

    openModal('username');
    fixture.detectChanges();

    component.usernameForm.controls.username.setValue('Ab');
    component.usernameForm.controls.username.markAsTouched();
    updateUsername();
    fixture.detectChanges();

    expect(mockApiService.updateUsername).not.toHaveBeenCalled();
    const validationError = fixture.debugElement
      .queryAll(By.css('div.text-xs.text-red-500'))
      .some((el) =>
        el.nativeElement.textContent
          .trim()
          .includes('needs at least 3 characters'),
      );
    expect(validationError).toBeTrue();
    expect(component.alert()).toBeNull();
  });

  it('shows inline username error when API rejects the username', () => {
    const errorResponse = {
      status: 400,
      error: {
        message: 'Username is already taken',
        field_errors: [
          { field: 'username', message: 'Username is already taken' },
        ],
      },
    };
    mockApiService.updateUsername.and.returnValue(
      throwError(() => errorResponse),
    );

    fixture.detectChanges();

    openModal('username');
    fixture.detectChanges();

    component.usernameForm.controls.username.setValue('already-in-use');
    component.usernameForm.controls.username.markAsTouched();
    updateUsername();
    fixture.detectChanges();

    expect(component.alert()).toBeNull();
    expect(component.activeModal()).toBe('username');
  });

  it('sends an OTP when a new email address is entered', () => {
    mockApiService.requestEmailChange.and.returnValue(
      of({ message: 'Please check your inbox' }),
    );

    fixture.detectChanges();

    openModal('email');
    component.emailForm.controls.email.setValue('new@example.com');
    fixture.detectChanges();

    sendEmailOtp();
    fixture.detectChanges();

    expect(mockApiService.requestEmailChange).toHaveBeenCalledWith(
      'new@example.com',
    );
    expect(component.emailFlowState()).toBe('otp-sent');
    expect(component.emailModalNotice()).toBe('Please check your inbox');
  });

  it('shows an inline error when the email OTP request fails', () => {
    mockApiService.requestEmailChange.and.returnValue(
      throwError(() => ({ error: { detail: 'Rate limited' } })),
    );

    fixture.detectChanges();

    openModal('email');
    component.emailForm.controls.email.setValue('new@example.com');
    fixture.detectChanges();

    sendEmailOtp();
    fixture.detectChanges();

    expect(component.emailFlowState()).toBe('idle');
  });

  it('confirms the email change when a valid OTP is submitted', () => {
    const loadSpy = spyOn(
      component as unknown as { loadUserProfile(): void },
      'loadUserProfile',
    ).and.callThrough();
    mockApiService.continueEmailChange.and.returnValue(of(void 0));

    fixture.detectChanges();

    openModal('email');
    component.emailFlowState.set('otp-sent');
    component.emailOtp.set('123456');
    fixture.detectChanges();

    confirmEmailChange();
    fixture.detectChanges();

    expect(mockApiService.continueEmailChange).toHaveBeenCalledWith('123456');
    expect(component.emailFlowState()).toBe('idle');
    expect(component.otpError()).toBeNull();
    expect(loadSpy).toHaveBeenCalled();
  });

  it('shows an inline error when OTP confirmation returns a conflict', () => {
    mockApiService.continueEmailChange.and.returnValue(
      throwError(() => ({ status: 409 })),
    );

    fixture.detectChanges();

    openModal('email');
    component.emailFlowState.set('otp-sent');
    component.emailOtp.set('123456');
    fixture.detectChanges();

    confirmEmailChange();
    fixture.detectChanges();

    expect(component.otpError()).toBe(
      'That email is already used by another account.',
    );
    expect(component.emailFlowState()).toBe('otp-sent');
  });

  it('locks the email flow after too many OTP attempts', () => {
    const errorResponse = {
      status: 429,
      error: { detail: 'Too many verification attempts. Try again later.' },
    };
    mockApiService.continueEmailChange.and.returnValue(
      throwError(() => errorResponse),
    );

    fixture.detectChanges();

    openModal('email');
    component.emailFlowState.set('otp-sent');
    component.emailOtp.set('123456');
    fixture.detectChanges();

    confirmEmailChange();
    fixture.detectChanges();

    expect(component.emailOtpLocked()).toBeTrue();
    expect(component.otpError()).toBe(errorResponse.error.detail);
    const shouldDisableModalPrimary = () =>
      (
        component as unknown as {
          shouldDisableModalPrimary(): boolean;
        }
      ).shouldDisableModalPrimary();
    expect(shouldDisableModalPrimary()).toBeTrue();
  });

  it('handles a successful password change', () => {
    component.passwordForm.controls.currentPassword.setValue('Current123!');
    component.passwordForm.controls.newPassword.setValue('NewPassword1!');

    fixture.detectChanges();
    updatePassword();
    fixture.detectChanges();

    expect(mockApiService.updatePassword).toHaveBeenCalledWith(
      'Current123!',
      'NewPassword1!',
    );
    expect(component.alert()).toEqual({
      type: 'success',
      message: 'Password changed successfully',
    });
  });

  it('shows general alert when password update fails', () => {
    const errorResponse = {
      status: 400,
      error: {
        message: 'Failed to update password',
      },
    };
    mockApiService.updatePassword.and.returnValue(
      throwError(() => errorResponse),
    );

    fixture.detectChanges();

    openModal('password');
    component.passwordForm.controls.currentPassword.setValue('Current123!');
    component.passwordForm.controls.newPassword.setValue('ValidPassword1!');

    fixture.detectChanges();
    updatePassword();
    fixture.detectChanges();

    expect(mockApiService.updatePassword).toHaveBeenCalled();
    expect(component.activeModal()).toBeNull();
    expect(component.alert()).toEqual({
      type: 'error',
      message: 'Failed to update password',
    });
  });

  it('shows inline password error when the current password is incorrect', () => {
    const errorResponse = {
      status: 400,
      error: {
        message: 'Current password is incorrect',
        field_errors: [
          {
            field: 'currentPassword',
            message: 'Current password is incorrect',
          },
        ],
      },
    };
    mockApiService.updatePassword.and.returnValue(
      throwError(() => errorResponse),
    );

    fixture.detectChanges();
    openModal('password');
    component.passwordForm.controls.currentPassword.setValue('WrongPassword1!');
    component.passwordForm.controls.newPassword.setValue('NewValid1!');

    fixture.detectChanges();
    updatePassword();
    fixture.detectChanges();

    expect(mockApiService.updatePassword).toHaveBeenCalled();
    expect(component.activeModal()).toBe('password');
    expect(component.alert()).toBeNull();
    const currentPasswordErrors = component['getErrorMessages'](
      component.passwordForm,
      'currentPassword',
    );
    expect(currentPasswordErrors).toContain('Current password is incorrect');
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

  it('should display error message when the profile fails to load', () => {
    mockApiService.getUserProfile.and.returnValue(
      throwError(() => new Error('Test error message')),
    );

    fixture.detectChanges();

    const errorElement = fixture.debugElement.query(By.css('.text-red-500'));
    expect(errorElement.nativeElement.textContent.trim()).toBe(
      'Failed to load user profile',
    );
    expect(component.pageLoading()).toBeFalse();
  });

  it('shows a message when a launch URL is unavailable', () => {
    (
      component as unknown as {
        platformLaunchUrls: Record<string, string | undefined>;
      }
    ).platformLaunchUrls['galaxy'] = undefined;

    fixture.detectChanges();

    const fallback = fixture.debugElement.query(
      By.css('.text-sm.font-medium.text-red-500'),
    );
    expect(fallback.nativeElement.textContent.trim()).toBe(
      'Launch link unavailable',
    );
  });
});
