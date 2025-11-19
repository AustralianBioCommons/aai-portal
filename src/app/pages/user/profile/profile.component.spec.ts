import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileComponent } from './profile.component';
import {
  ApiService,
  BiocommonsUserDetails,
  UserProfileData,
} from '../../../core/services/api.service';
import { InlineEditFieldComponent } from '../../../shared/components/inline-edit-field/inline-edit-field.component';
import { PasswordEditFieldComponent } from '../../../shared/components/password-edit-field/password-edit-field.component';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let reloadSpy: jasmine.Spy;

  const mockUser: UserProfileData = {
    user_id: 'auth0|1234567890',
    name: 'Example User',
    email: 'user@example.com',
    email_verified: true,
    username: 'user123',
    picture: 'https://example.com/user.jpg',
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
  // Full data from Auth0
  const mockAuth0User: BiocommonsUserDetails = {
    ...mockUser,
    username: 'valid-username',
    created_at: 'today',
    identities: [],
    updated_at: 'today',
    nickname: 'valid-username',
    platform_memberships: [],
    group_memberships: [],
  };

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', [
      'getUserProfile',
      'updateUserUsername',
      'updatePassword',
    ]);
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [{ provide: ApiService, useValue: apiSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    mockApiService.getUserProfile.and.returnValue(of(mockUser));
    mockApiService.updateUserUsername.and.returnValue(of(mockAuth0User));
    mockApiService.updatePassword.and.returnValue(of(true));
    reloadSpy = spyOn(component, 'reloadPage').and.stub();
    sessionStorage.removeItem('profile_flash_message');
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should load user profile data', () => {
    fixture.detectChanges();

    expect(mockApiService.getUserProfile).toHaveBeenCalled();
    expect(component.user()).toEqual(mockUser);
    expect(component.loading()).toBeFalse();
    expect(component.error()).toBeNull();
  });

  it('should handle error when loading user details', () => {
    mockApiService.getUserProfile.and.returnValue(
      throwError(() => new Error('API Error')),
    );
    spyOn(console, 'error');

    fixture.detectChanges();

    expect(component.error()).toBe('Failed to load user profile');
    expect(component.loading()).toBeFalse();
    expect(component.user()).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      'Failed to load user profile:',
      jasmine.any(Error),
    );
  });

  it('should display user information correctly', () => {
    fixture.detectChanges();

    const userName = fixture.debugElement.query(By.css('#user-name'));
    const userEmail = fixture.debugElement.query(By.css('#user-email'));

    expect(userName.nativeElement.textContent).toContain('Example User');
    expect(userEmail.nativeElement.textContent).toContain('user@example.com');
  });

  it('updates the username when a valid value is entered', () => {
    const updatedAuth0User = { ...mockAuth0User, username: 'valid-username' };
    mockApiService.updateUserUsername.and.returnValue(of(updatedAuth0User));

    fixture.detectChanges();

    const usernameFieldDebug = fixture.debugElement.query(
      By.directive(InlineEditFieldComponent),
    );
    const usernameField =
      usernameFieldDebug.componentInstance as InlineEditFieldComponent;

    usernameField.startEdit();
    usernameField.onInput('valid-username');
    fixture.detectChanges();

    usernameField.submit();
    fixture.detectChanges();

    expect(mockApiService.updateUserUsername).toHaveBeenCalledWith(
      'valid-username',
    );
    expect(component.user()).toEqual(updatedAuth0User);
    expect(component.alert()).toEqual({
      type: 'success',
      message: 'Username updated successfully.',
    });
  });

  it('shows a validation error and skips saving when the username is invalid', () => {
    fixture.detectChanges();

    const usernameFieldDebug = fixture.debugElement.query(
      By.directive(InlineEditFieldComponent),
    );
    const usernameField =
      usernameFieldDebug.componentInstance as InlineEditFieldComponent;

    usernameField.startEdit();
    usernameField.onInput('Ab');

    usernameField.submit();
    fixture.detectChanges();

    expect(mockApiService.updateUserUsername).not.toHaveBeenCalled();
    expect(usernameField.validationError()).toBe(
      'Invalid username: please check the requirements and try again.',
    );
    expect(component.alert()).toBeNull();
  });

  it('shows an error alert with detail when username update fails with API error', () => {
    const errorResponse = { error: { detail: 'Username already taken' } };
    mockApiService.updateUserUsername.and.returnValue(
      throwError(() => errorResponse),
    );

    fixture.detectChanges();

    const usernameFieldDebug = fixture.debugElement.query(
      By.directive(InlineEditFieldComponent),
    );
    const usernameField =
      usernameFieldDebug.componentInstance as InlineEditFieldComponent;

    usernameField.startEdit();
    usernameField.onInput('valid-username');
    usernameField.submit();
    fixture.detectChanges();

    expect(mockApiService.updateUserUsername).toHaveBeenCalledWith(
      'valid-username',
    );
    expect(component.alert()).toEqual({
      type: 'error',
      message: 'Failed to update username: Username already taken',
    });
  });

  it('handles a successful password change', () => {
    sessionStorage.removeItem('profile_flash_message');
    mockApiService.updatePassword.and.returnValue(of(true));

    fixture.detectChanges();
    const passwordField = fixture.debugElement.query(
      By.directive(PasswordEditFieldComponent),
    ).componentInstance as PasswordEditFieldComponent;

    passwordField.startEdit();
    passwordField.currentPassword.set('Current123!');
    passwordField.onNewPasswordChange('NewPassword1!');
    passwordField.submit();

    fixture.detectChanges();

    expect(mockApiService.updatePassword).toHaveBeenCalledWith(
      'Current123!',
      'NewPassword1!',
    );
    expect(passwordField.isEditing()).toBeFalse();
    expect(sessionStorage.getItem('profile_flash_message')).toBe(
      JSON.stringify({
        type: 'success',
        message: 'Password changed successfully.',
      }),
    );
    expect(reloadSpy).toHaveBeenCalled();
    expect(component.savingField()).toBeNull();
  });

  it('shows an error alert when password update fails with invalid new password', () => {
    sessionStorage.removeItem('profile_flash_message');
    const errorResponse = new Error('New password rejected');
    mockApiService.updatePassword.and.returnValue(
      throwError(() => errorResponse),
    );

    fixture.detectChanges();
    const passwordField = fixture.debugElement.query(
      By.directive(PasswordEditFieldComponent),
    ).componentInstance as PasswordEditFieldComponent;
    const consoleSpy = spyOn(console, 'error');

    passwordField.startEdit();
    passwordField.currentPassword.set('Current123!');
    passwordField.onNewPasswordChange('InvalidPassword1!');
    passwordField.submit();

    fixture.detectChanges();

    expect(mockApiService.updatePassword).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to update password:',
      errorResponse,
    );
    expect(component.alert()).toEqual({
      type: 'error',
      message:
        'Failed to update password. Please check your current password and try again.',
    });
    expect(reloadSpy).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('profile_flash_message')).toBeNull();
    expect(component.savingField()).toBeNull();
  });

  it('shows an error alert when the current password is incorrect', () => {
    sessionStorage.removeItem('profile_flash_message');
    const errorResponse = new Error('Current password incorrect');
    mockApiService.updatePassword.and.returnValue(
      throwError(() => errorResponse),
    );

    fixture.detectChanges();
    const passwordField = fixture.debugElement.query(
      By.directive(PasswordEditFieldComponent),
    ).componentInstance as PasswordEditFieldComponent;
    const consoleSpy = spyOn(console, 'error');

    passwordField.startEdit();
    passwordField.currentPassword.set('WrongPassword1!');
    passwordField.onNewPasswordChange('NewValid1!');
    passwordField.submit();

    fixture.detectChanges();

    expect(mockApiService.updatePassword).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to update password:',
      errorResponse,
    );
    expect(component.alert()).toEqual({
      type: 'error',
      message:
        'Failed to update password. Please check your current password and try again.',
    });
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

  it('should display error message when there is an error', () => {
    mockApiService.getUserProfile.and.returnValue(
      throwError(() => new Error('Test error message')),
    );
    component.loading.set(false);
    component.user.set(null);
    fixture.detectChanges();

    const errorElement = fixture.debugElement.query(By.css('.text-red-500'));
    expect(errorElement.nativeElement.textContent.trim()).toBe(
      'Failed to load user profile',
    );
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
