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

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let reloadSpy: jasmine.Spy;

  type ProfileTestHarness = ProfileComponent & {
    openModal(type: 'username' | 'password' | 'name' | 'email'): void;
    updateUsername(): void;
    updateName(): void;
    submitPasswordChange(): void;
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
      'updateUserUsername',
      'updatePassword',
      'updateFullName',
      'requestEmailChange',
      'continueEmailChange',
    ]);
    const authSpy = jasmine.createSpyObj('AuthService', [], {
      isGeneralAdmin: signal(false),
    });

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    harness = component as ProfileTestHarness;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    mockApiService.getUserProfile.and.returnValue(of(mockUser));
    mockApiService.updateUserUsername.and.returnValue(of(mockAuth0User));
    mockApiService.updatePassword.and.returnValue(of(true));
    mockApiService.updateFullName.and.returnValue(of(mockAuth0User));
    mockApiService.requestEmailChange.and.returnValue(
      of({ message: 'OTP sent to the requested email address.' }),
    );
    mockApiService.continueEmailChange.and.returnValue(of(void 0));
    reloadSpy = spyOn(component, 'reloadPage').and.stub();
    sessionStorage.removeItem('profile_flash_message');
  });

  const openModal = (type: 'username' | 'password' | 'name' | 'email') =>
    harness.openModal(type);
  const updateUsername = () => harness.updateUsername();
  const updateName = () => harness.updateName();
  const submitPasswordChange = () => harness.submitPasswordChange();
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
    expect(component.loading()).toBeFalse();
    expect(component.error()).toBeNull();
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
    component.nameControl.setValue('Updated Name');
    updateName();
    fixture.detectChanges();

    expect(mockApiService.updateFullName).toHaveBeenCalledWith('Updated Name');
    expect(component.alert()).toEqual({
      type: 'success',
      message: 'Name updated successfully.',
    });
    expect(loadSpy).toHaveBeenCalled();
  });

  it('shows an error alert when updating the name fails', () => {
    const errorResponse = { error: { detail: 'Unable to update name' } };
    mockApiService.updateFullName.and.returnValue(
      throwError(() => errorResponse),
    );

    fixture.detectChanges();

    openModal('name');
    component.nameControl.setValue('Bad Name');
    updateName();
    fixture.detectChanges();

    expect(component.alert()).toEqual({
      type: 'error',
      message: 'Unable to update name',
    });
    expect(component.savingField()).toBeNull();
  });

  it('updates the username when a valid value is entered', () => {
    mockApiService.updateUserUsername.and.returnValue(of(mockAuth0User));
    fixture.detectChanges();
    mockApiService.getUserProfile.and.returnValue(of(updatedProfile));

    openModal('username');
    fixture.detectChanges();

    component.usernameControl.setValue('valid-username');
    component.usernameControl.markAsTouched();
    updateUsername();
    fixture.detectChanges();

    expect(mockApiService.updateUserUsername).toHaveBeenCalledWith(
      'valid-username',
    );
    expect(component.user()).toEqual(updatedProfile);
    expect(component.alert()).toEqual({
      type: 'success',
      message: 'Username updated successfully.',
    });
  });

  it('shows a validation error and skips saving when the username is invalid', () => {
    fixture.detectChanges();

    openModal('username');
    fixture.detectChanges();

    component.usernameControl.setValue('Ab');
    component.usernameControl.markAsTouched();
    updateUsername();
    fixture.detectChanges();

    expect(mockApiService.updateUserUsername).not.toHaveBeenCalled();
    const validationError = fixture.debugElement
      .queryAll(By.css('div.text-xs.text-red-600'))
      .some((el) =>
        el.nativeElement.textContent
          .trim()
          .includes('Please enter a valid username'),
      );
    expect(validationError).toBeTrue();
    expect(component.usernameError()).toBe(
      'Please enter a valid username before saving.',
    );
    expect(component.alert()).toBeNull();
  });

  it('shows inline username error when API rejects the username', () => {
    const errorResponse = {
      status: 400,
      error: { detail: 'Username already taken' },
    };
    mockApiService.updateUserUsername.and.returnValue(
      throwError(() => errorResponse),
    );

    fixture.detectChanges();

    openModal('username');
    fixture.detectChanges();

    component.usernameControl.setValue('already-in-use');
    component.usernameControl.markAsTouched();
    updateUsername();
    fixture.detectChanges();

    expect(component.usernameError()).toBe('Username already taken');
    expect(component.alert()).toBeNull();
    const inlineError = fixture.debugElement
      .queryAll(By.css('div.text-xs.text-red-600'))
      .find((el) =>
        el.nativeElement.textContent.includes('Username already taken'),
      );
    expect(inlineError).toBeTruthy();
  });

  it('sends an OTP when a new email address is entered', () => {
    mockApiService.requestEmailChange.and.returnValue(
      of({ message: 'Please check your inbox' }),
    );

    fixture.detectChanges();

    openModal('email');
    component.emailControl.setValue('new@example.com');
    fixture.detectChanges();

    sendEmailOtp();
    fixture.detectChanges();

    expect(mockApiService.requestEmailChange).toHaveBeenCalledWith(
      'new@example.com',
    );
    expect(component.emailFlowState()).toBe('otp-sent');
    expect(component.emailModalNotice()).toBe('Please check your inbox');
    expect(component.emailError()).toBeNull();
  });

  it('shows an inline error when the email OTP request fails', () => {
    mockApiService.requestEmailChange.and.returnValue(
      throwError(() => ({ error: { detail: 'Rate limited' } })),
    );

    fixture.detectChanges();

    openModal('email');
    component.emailControl.setValue('new@example.com');
    fixture.detectChanges();

    sendEmailOtp();
    fixture.detectChanges();

    expect(component.emailError()).toBe('Rate limited');
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
    sessionStorage.removeItem('profile_flash_message');
    component.currentPasswordControl.setValue('Current123!');
    component.newPasswordControl.setValue('NewPassword1!');

    fixture.detectChanges();
    submitPasswordChange();
    fixture.detectChanges();

    expect(mockApiService.updatePassword).toHaveBeenCalledWith(
      'Current123!',
      'NewPassword1!',
    );
    expect(sessionStorage.getItem('profile_flash_message')).toBe(
      JSON.stringify({
        type: 'success',
        message: 'Password changed successfully.',
      }),
    );
    expect(component.alert()).toBeNull();
    expect(reloadSpy).toHaveBeenCalled();
    expect(component.savingField()).toBeNull();
  });

  it('shows inline password error when password update fails', () => {
    sessionStorage.removeItem('profile_flash_message');
    const errorResponse = new Error('New password rejected');
    mockApiService.updatePassword.and.returnValue(
      throwError(() => errorResponse),
    );

    component.currentPasswordControl.setValue('Current123!');
    component.newPasswordControl.setValue('InvalidPassword1!');

    fixture.detectChanges();
    submitPasswordChange();
    fixture.detectChanges();

    expect(mockApiService.updatePassword).toHaveBeenCalled();
    expect(component.passwordError()).toBe(
      'Failed to update password. Please check your current password and try again.',
    );
    expect(component.alert()).toBeNull();
    expect(reloadSpy).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('profile_flash_message')).toBeNull();
    expect(component.savingField()).toBeNull();
  });

  it('shows inline password error when the current password is incorrect', () => {
    sessionStorage.removeItem('profile_flash_message');
    const errorResponse = new Error('Current password incorrect');
    mockApiService.updatePassword.and.returnValue(
      throwError(() => errorResponse),
    );

    component.currentPasswordControl.setValue('WrongPassword1!');
    component.newPasswordControl.setValue('NewValid1!');

    fixture.detectChanges();
    submitPasswordChange();
    fixture.detectChanges();

    expect(mockApiService.updatePassword).toHaveBeenCalled();
    expect(component.passwordError()).toBe(
      'Failed to update password. Please check your current password and try again.',
    );
    expect(component.alert()).toBeNull();
    expect(reloadSpy).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('profile_flash_message')).toBeNull();
    expect(component.savingField()).toBeNull();
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
    expect(component.loading()).toBeFalse();
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
