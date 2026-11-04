import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ProfileComponent } from './profile.component';
import {
  ApiService,
  BiocommonsUserDetails,
  UserProfileData,
} from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoginProxyService } from '../../../core/services/login-proxy.service';
import { of, Subject, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {
  environment,
  updateEnvironment,
} from '../../../../environments/environment';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockLoginProxyService: jasmine.SpyObj<LoginProxyService>;

  type ProfileTestHarness = ProfileComponent & {
    openModal(type: 'username' | 'password' | 'name' | 'email'): void;
    updateUsername(): void;
    updateName(): void;
    updatePassword(): void;
    sendEmailOtp(): void;
    confirmEmailChange(): void;
    onModalPrimaryButtonClick(): void;
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
    environment.features.sbpEnabled = true;
    const apiSpy = jasmine.createSpyObj('ApiService', [
      'getUserProfile',
      'updateUsername',
      'updatePassword',
      'updateName',
      'requestEmailChange',
      'continueEmailChange',
      'migrateAuth0ToAaf',
      'migrateAafToAuth0',
      'completeAafToAuth0',
      'checkAustralianResearchInstitution',
      'deleteAccount',
    ]);
    const authSpy = jasmine.createSpyObj(
      'AuthService',
      ['refreshUser', 'logout', 'loginForAafMigration'],
      {
        isGeneralAdmin: signal(false),
      },
    );

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiService, useValue: apiSpy },
        { provide: AuthService, useValue: authSpy },
        {
          provide: LoginProxyService,
          useValue: jasmine.createSpyObj('LoginProxyService', [
            'checkAafEmail',
          ]),
        },
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
    mockAuthService = TestBed.inject(
      AuthService,
    ) as jasmine.SpyObj<AuthService>;
    mockLoginProxyService = TestBed.inject(
      LoginProxyService,
    ) as jasmine.SpyObj<LoginProxyService>;
    mockLoginProxyService.checkAafEmail.and.returnValue(of(false));
    mockApiService.migrateAuth0ToAaf.and.returnValue(
      of({
        migration_id: 'migration-123',
        expires_at: '2026-10-29T03:10:00Z',
      }),
    );
    mockAuthService.loginForAafMigration.and.returnValue(of(void 0));
    mockApiService.migrateAafToAuth0.and.returnValue(
      of({
        migration_id: 'reverse-migration-123',
        expires_at: '2026-10-29T03:10:00Z',
        new_email: 'new@example.com',
      }),
    );
    mockApiService.completeAafToAuth0.and.returnValue(
      of({
        migration_id: 'reverse-migration-123',
        user_id: mockUser.user_id,
        new_email: 'new@example.com',
      }),
    );
    mockApiService.getUserProfile.and.returnValue(of(mockUser));
    mockApiService.updateUsername.and.returnValue(of(mockAuth0User));
    mockApiService.updatePassword.and.returnValue(of(true));
    mockApiService.updateName.and.returnValue(of(mockAuth0User));
    mockApiService.requestEmailChange.and.returnValue(
      of({ message: 'OTP sent to the requested email address.' }),
    );
    mockApiService.continueEmailChange.and.returnValue(of(void 0));
    mockApiService.checkAustralianResearchInstitution.and.returnValue(of(true));
    mockApiService.deleteAccount.and.returnValue(
      of({ message: 'Account deleted successfully' }),
    );
  });

  afterEach(() => {
    fixture.destroy();
    updateEnvironment();
  });

  const openModal = (type: 'username' | 'password' | 'name' | 'email') =>
    harness.openModal(type);
  const updateUsername = () => harness.updateUsername();
  const updateName = () => harness.updateName();
  const updatePassword = () => harness.updatePassword();
  const sendEmailOtp = () => harness.sendEmailOtp();
  const confirmEmailChange = () => harness.confirmEmailChange();
  const primaryClick = () => harness.onModalPrimaryButtonClick();

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

  describe('email migration', () => {
    const migrationReminder =
      'Please complete this process within 10 minutes to ensure a successful change';
    const institutionalLoginMessage =
      'Institutional login available. Please click "Log in" and sign in using your institutional credentials to continue changing your email address.';

    const enterEmail = (email: string, accountType = 'auth0') => {
      mockApiService.getUserProfile.and.returnValue(
        of({ ...mockUser, account_type: accountType }),
      );
      fixture.detectChanges();
      openModal('email');
      component.emailForm.controls.email.setValue(email);
      fixture.detectChanges();
    };

    it('asks for an email before offering a migration', () => {
      fixture.detectChanges();
      openModal('email');
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain(
        'Enter your new email address to continue.',
      );
      expect(fixture.nativeElement.textContent).not.toContain(
        migrationReminder,
      );
      expect(
        fixture.nativeElement.querySelector('#migration-new-password'),
      ).toBeNull();
      expect(mockLoginProxyService.checkAafEmail).not.toHaveBeenCalled();
    });

    it('does not check invalid or unchanged emails', () => {
      enterEmail(mockUser.email);
      primaryClick();
      component.emailForm.controls.email.setValue('invalid');
      primaryClick();

      expect(mockLoginProxyService.checkAafEmail).not.toHaveBeenCalled();
      expect(mockApiService.requestEmailChange).not.toHaveBeenCalled();
    });

    it('creates the Auth0 to AAF migration only after Log in is clicked', () => {
      mockLoginProxyService.checkAafEmail.and.returnValue(of(true));
      enterEmail('new@sydney.edu.au');

      primaryClick();
      fixture.detectChanges();

      expect(mockLoginProxyService.checkAafEmail).toHaveBeenCalledWith(
        'new@sydney.edu.au',
      );
      expect(component.emailFlowState()).toBe('auth0-to-aaf');
      expect(fixture.nativeElement.textContent).toContain(
        institutionalLoginMessage,
      );
      expect(fixture.nativeElement.textContent).toContain(migrationReminder);
      expect(mockApiService.migrateAuth0ToAaf).not.toHaveBeenCalled();
      expect(mockApiService.requestEmailChange).not.toHaveBeenCalled();

      primaryClick();

      expect(mockApiService.migrateAuth0ToAaf).toHaveBeenCalledWith(
        'new@sydney.edu.au',
      );
      expect(mockAuthService.loginForAafMigration).toHaveBeenCalledWith(
        'new@sydney.edu.au',
        'migration-123',
      );
    });

    it('shows password fields and the reminder for AAF to Auth0', () => {
      enterEmail('new@example.com', 'AAF');
      primaryClick();
      fixture.detectChanges();

      expect(component.emailFlowState()).toBe('aaf-to-auth0');
      expect(fixture.nativeElement.textContent).toContain(
        'You will log in to BioCommons Access directly with a password, please create one now',
      );
      expect(fixture.nativeElement.textContent).toContain(migrationReminder);
      expect(
        fixture.nativeElement.querySelector('#migration-new-password'),
      ).toBeTruthy();
      expect(mockApiService.requestEmailChange).not.toHaveBeenCalled();
    });

    it('uses the ordinary OTP flow when the account type stays Auth0', () => {
      enterEmail('new@example.com');
      expect(fixture.nativeElement.textContent).not.toContain(
        migrationReminder,
      );
      primaryClick();
      fixture.detectChanges();

      expect(mockApiService.requestEmailChange).toHaveBeenCalledWith(
        'new@example.com',
      );
      expect(component.emailFlowState()).toBe('otp-sent');
      expect(component.emailMigrationDirection()).toBeNull();
      expect(fixture.nativeElement.textContent).toContain(migrationReminder);
      const form: HTMLFormElement =
        fixture.nativeElement.querySelector('app-modal form');
      expect(form.firstElementChild?.textContent).toContain(migrationReminder);
      expect(form.firstElementChild?.getAttribute('role')).toBe('note');
    });

    it('rechecks the updated email after changing from an institutional email to a non-AAF email', () => {
      mockLoginProxyService.checkAafEmail.and.callFake((email) =>
        of(email.endsWith('@sydney.edu.au')),
      );
      enterEmail('new@sydney.edu.au');
      primaryClick();
      fixture.detectChanges();
      expect(component.emailFlowState()).toBe('auth0-to-aaf');

      const input: HTMLInputElement =
        fixture.nativeElement.querySelector('#modal-email');
      input.value = 'new@example.com';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.emailFlowState()).toBe('idle');
      expect(component.emailMigrationDirection()).toBeNull();
      expect(fixture.nativeElement.textContent).toContain(
        'Enter your new email address to continue.',
      );
      expect(fixture.nativeElement.textContent).not.toContain(
        institutionalLoginMessage,
      );
      expect(fixture.nativeElement.textContent).not.toContain(
        migrationReminder,
      );

      primaryClick();
      fixture.detectChanges();

      expect(mockLoginProxyService.checkAafEmail.calls.allArgs()).toEqual([
        ['new@sydney.edu.au'],
        ['new@example.com'],
      ]);
      expect(mockApiService.requestEmailChange).toHaveBeenCalledWith(
        'new@example.com',
      );
      expect(component.emailFlowState()).toBe('otp-sent');
      expect(mockApiService.migrateAuth0ToAaf).not.toHaveBeenCalled();
      expect(mockApiService.migrateAafToAuth0).not.toHaveBeenCalled();
      expect(mockAuthService.loginForAafMigration).not.toHaveBeenCalled();
    });

    it('requires a valid matching password before requesting migration and OTP', () => {
      enterEmail('new@example.com', 'aaf');
      primaryClick();
      primaryClick();
      expect(mockApiService.migrateAafToAuth0).not.toHaveBeenCalled();

      component.migrationPasswordForm.setValue({
        newPassword: 'Valid123!',
        confirmNewPassword: 'Different123!',
      });
      primaryClick();
      expect(mockApiService.migrateAafToAuth0).not.toHaveBeenCalled();

      component.migrationPasswordForm.controls.confirmNewPassword.setValue(
        'Valid123!',
      );
      primaryClick();
      fixture.detectChanges();

      expect(mockApiService.migrateAafToAuth0).toHaveBeenCalledWith(
        'new@example.com',
        'Valid123!',
      );
      expect(mockApiService.requestEmailChange).not.toHaveBeenCalled();
      expect(component.emailFlowState()).toBe('otp-sent');
      expect(fixture.nativeElement.textContent).toContain(migrationReminder);
      expect(component.emailModalNotice()).toBe(
        'OTP sent to the requested email address.',
      );
      expect(component.migrationPasswordForm.controls.newPassword.value).toBe(
        '',
      );
      expect(
        component.migrationPasswordForm.controls.confirmNewPassword.value,
      ).toBe('');
    });

    it('sends the password at migration creation and verifies using only the ID and OTP', () => {
      enterEmail('new@example.com', 'aaf');
      primaryClick();
      component.migrationPasswordForm.setValue({
        newPassword: ' Valid123! ',
        confirmNewPassword: ' Valid123! ',
      });
      primaryClick();
      expect(mockApiService.migrateAafToAuth0).toHaveBeenCalledWith(
        'new@example.com',
        ' Valid123! ',
      );
      expect(component.migrationPasswordForm.controls.newPassword.value).toBe(
        '',
      );
      component.emailOtp.set('123456');
      primaryClick();

      expect(mockApiService.completeAafToAuth0).toHaveBeenCalledWith(
        'reverse-migration-123',
        '123456',
      );
      expect(mockApiService.continueEmailChange).not.toHaveBeenCalled();
      expect(component.activeModal()).toBeNull();
      expect(component.migrationPasswordForm.controls.newPassword.value).toBe(
        '',
      );
      expect(mockAuthService.refreshUser).toHaveBeenCalled();
    });

    for (const accountType of ['auth0', 'aaf'] as const) {
      it(`requires a six-digit OTP before confirming an email change from ${accountType}`, () => {
        enterEmail('new@example.com', accountType);
        primaryClick();
        if (accountType === 'aaf') {
          component.migrationPasswordForm.setValue({
            newPassword: 'Valid123!',
            confirmNewPassword: 'Valid123!',
          });
          primaryClick();
        }

        for (const otp of ['12345', '12345a']) {
          component.emailOtp.set(otp);
          primaryClick();

          expect(component.otpError()).toBe(
            'Please enter a 6-digit verification code.',
          );
          expect(component.activeModal()).toBe('email');
          expect(mockApiService.completeAafToAuth0).not.toHaveBeenCalled();
          expect(mockApiService.continueEmailChange).not.toHaveBeenCalled();
        }
      });
    }

    it('keeps an invalid migration OTP inline and retries completion with the same migration ID', () => {
      mockApiService.completeAafToAuth0.and.returnValue(
        throwError(() => ({ status: 400, error: { detail: 'Invalid OTP.' } })),
      );
      enterEmail('new@example.com', 'aaf');
      primaryClick();
      component.migrationPasswordForm.setValue({
        newPassword: 'Valid123!',
        confirmNewPassword: 'Valid123!',
      });
      primaryClick();
      component.emailOtp.set('123456');
      primaryClick();

      expect(component.otpError()).toBe('Invalid OTP.');
      expect(component.activeModal()).toBe('email');
      expect(component.migrationPasswordForm.controls.newPassword.value).toBe(
        '',
      );

      mockApiService.completeAafToAuth0.and.returnValue(
        of({
          migration_id: 'reverse-migration-123',
          user_id: mockUser.user_id,
          new_email: 'new@example.com',
        }),
      );
      component.emailOtp.set('654321');
      primaryClick();

      expect(mockApiService.completeAafToAuth0.calls.allArgs()).toEqual([
        ['reverse-migration-123', '123456'],
        ['reverse-migration-123', '654321'],
      ]);
      expect(mockApiService.migrateAafToAuth0).toHaveBeenCalledTimes(1);
      expect(mockApiService.continueEmailChange).not.toHaveBeenCalled();
      expect(component.activeModal()).toBeNull();
    });

    it('shows migration identity conflicts as general errors rather than duplicate-email errors', () => {
      const message = 'Migration database identity is not ready.';
      mockApiService.completeAafToAuth0.and.returnValue(
        throwError(() => ({ status: 409, error: { detail: message } })),
      );
      enterEmail('new@example.com', 'aaf');
      primaryClick();
      component.migrationPasswordForm.setValue({
        newPassword: 'Valid123!',
        confirmNewPassword: 'Valid123!',
      });
      primaryClick();
      component.emailOtp.set('123456');
      primaryClick();

      expect(component.alert()).toEqual({ type: 'error', message });
      expect(component.activeModal()).toBeNull();
    });

    it('shows duplicate emails from the AAF to Auth0 endpoint beside the email field', () => {
      const message = 'Email is already in use by another user.';
      mockApiService.migrateAafToAuth0.and.returnValue(
        throwError(() => ({ status: 409, error: { detail: message } })),
      );
      enterEmail('new@example.com', 'aaf');
      primaryClick();
      component.migrationPasswordForm.setValue({
        newPassword: 'Valid123!',
        confirmNewPassword: 'Valid123!',
      });
      primaryClick();
      fixture.detectChanges();

      const input: HTMLInputElement =
        fixture.nativeElement.querySelector('#modal-email');
      expect(input.classList).toContain('border-red-500');
      expect(
        fixture.nativeElement.querySelector('#modal-email-error').textContent,
      ).toContain(message);
      expect(component.alert()).toBeNull();
      expect(component.activeModal()).toBe('email');
      expect(mockApiService.completeAafToAuth0).not.toHaveBeenCalled();
    });

    it('shows migration OTP failures in the existing error alert', () => {
      mockApiService.migrateAafToAuth0.and.returnValue(
        throwError(() => ({ error: { detail: 'Mail unavailable' } })),
      );
      enterEmail('new@example.com', 'aaf');
      primaryClick();
      component.migrationPasswordForm.setValue({
        newPassword: 'Valid123!',
        confirmNewPassword: 'Valid123!',
      });
      primaryClick();

      expect(component.activeModal()).toBeNull();
      expect(component.alert()).toEqual({
        type: 'error',
        message: 'Mail unavailable',
      });
      expect(component.emailLoading()).toBeFalse();
    });

    it('clears the code and migration when the email is edited after OTP is sent', () => {
      enterEmail('new@example.com', 'aaf');
      primaryClick();
      component.migrationPasswordForm.setValue({
        newPassword: 'Valid123!',
        confirmNewPassword: 'Valid123!',
      });
      primaryClick();
      component.emailOtp.set('123456');
      component.emailForm.controls.email.setValue('other@example.com');

      expect(component.emailFlowState()).toBe('idle');
      expect(component.emailOtp()).toBe('');
      expect(component.migrationPasswordForm.controls.newPassword.value).toBe(
        '',
      );
    });

    it('shows an error alert when institutional lookup fails and allows reopening', () => {
      mockLoginProxyService.checkAafEmail.and.returnValue(
        throwError(() => new Error('network')),
      );
      enterEmail('new@sydney.edu.au');
      primaryClick();

      expect(component.emailFlowState()).toBe('idle');
      expect(component.activeModal()).toBeNull();
      expect(component.alert()).toEqual({
        type: 'error',
        message: 'Failed to check your institution. Please try again.',
      });
      expect(component.emailLoading()).toBeFalse();
      expect(mockApiService.requestEmailChange).not.toHaveBeenCalled();

      mockLoginProxyService.checkAafEmail.and.returnValue(of(true));
      openModal('email');
      component.emailForm.controls.email.setValue('new@sydney.edu.au');
      primaryClick();
      expect(component.emailFlowState()).toBe('auth0-to-aaf');
      expect(component.alert()).toBeNull();
    });

    it('shows duplicate migration email errors on the email field and clears them when edited', () => {
      const message = 'Email is already in use by another user.';
      mockLoginProxyService.checkAafEmail.and.returnValue(of(true));
      mockApiService.migrateAuth0ToAaf.and.returnValue(
        throwError(() => ({ status: 409, error: { detail: message } })),
      );
      enterEmail('new@sydney.edu.au');
      primaryClick();
      primaryClick();
      fixture.detectChanges();

      const emailInput: HTMLInputElement =
        fixture.nativeElement.querySelector('#modal-email');
      const emailError: HTMLElement =
        fixture.nativeElement.querySelector('#modal-email-error');
      expect(emailInput.classList).toContain('border-red-500');
      expect(emailInput.getAttribute('aria-invalid')).toBe('true');
      expect(emailInput.getAttribute('aria-describedby')).toBe(
        'modal-email-error',
      );
      expect(emailError.textContent).toContain(message);
      expect(emailError.classList).toContain('text-red-500');
      expect(component.alert()).toBeNull();
      expect(component.activeModal()).toBe('email');
      expect(mockAuthService.loginForAafMigration).not.toHaveBeenCalled();

      component.emailForm.controls.email.setValue('other@sydney.edu.au');
      fixture.detectChanges();

      expect(emailInput.classList).not.toContain('border-red-500');
      expect(emailInput.getAttribute('aria-invalid')).toBe('false');
      expect(
        fixture.nativeElement.querySelector('#modal-email-error'),
      ).toBeNull();
    });

    it('shows other migration conflicts in the existing alert without marking the email invalid', () => {
      const message =
        'A pending migration request already exists for this user. Please try again.';
      mockLoginProxyService.checkAafEmail.and.returnValue(of(true));
      mockApiService.migrateAuth0ToAaf.and.returnValue(
        throwError(() => ({ status: 409, error: { detail: message } })),
      );
      enterEmail('new@sydney.edu.au');
      primaryClick();
      primaryClick();
      fixture.detectChanges();

      expect(component.emailLoading()).toBeFalse();
      expect(component.activeModal()).toBeNull();
      expect(component.alert()).toEqual({ type: 'error', message });
      expect(fixture.nativeElement.textContent).toContain(message);
      expect(
        component['getErrorMessages'](component.emailForm, 'email'),
      ).toEqual([]);
      expect(mockAuthService.loginForAafMigration).not.toHaveBeenCalled();
    });

    it('handles an Auth0 redirect failure so the user can retry', () => {
      mockLoginProxyService.checkAafEmail.and.returnValue(of(true));
      mockAuthService.loginForAafMigration.and.returnValue(
        throwError(() => new Error('redirect failed')),
      );
      enterEmail('new@sydney.edu.au');
      primaryClick();
      primaryClick();

      expect(component.emailLoading()).toBeFalse();
      expect(component.activeModal()).toBeNull();
      expect(component.alert()).toEqual({
        type: 'error',
        message: 'Failed to change email address. Please try again.',
      });
    });

    for (const stage of [
      'auth0-to-aaf',
      'aaf-to-auth0',
      'otp-request',
      'otp-confirm',
    ] as const) {
      it(`shows a consistent error alert for permission failures during ${stage}`, () => {
        const denied = throwError(() => ({
          status: 403,
          error: {
            detail: 'You do not have permission to perform this action.',
          },
        }));
        if (stage === 'auth0-to-aaf') {
          mockLoginProxyService.checkAafEmail.and.returnValue(of(true));
          mockApiService.migrateAuth0ToAaf.and.returnValue(denied);
          enterEmail('new@sydney.edu.au');
          primaryClick();
          primaryClick();
        } else if (stage === 'aaf-to-auth0') {
          mockApiService.migrateAafToAuth0.and.returnValue(denied);
          enterEmail('new@example.com', 'aaf');
          primaryClick();
          component.migrationPasswordForm.setValue({
            newPassword: 'Valid123!',
            confirmNewPassword: 'Valid123!',
          });
          primaryClick();
        } else if (stage === 'otp-request') {
          mockApiService.requestEmailChange.and.returnValue(denied);
          enterEmail('new@example.com');
          primaryClick();
        } else {
          mockApiService.continueEmailChange.and.returnValue(denied);
          enterEmail('new@example.com');
          primaryClick();
          component.emailOtp.set('123456');
          primaryClick();
        }
        fixture.detectChanges();

        expect(component.activeModal()).toBeNull();
        expect(component.alert()).toEqual({
          type: 'error',
          message:
            'Unable to change your email address. Please contact support.',
        });
        expect(
          fixture.nativeElement.querySelector('app-alert')?.textContent,
        ).toContain(
          'Unable to change your email address. Please contact support.',
        );
        expect(fixture.nativeElement.textContent).not.toContain(
          'You do not have permission to perform this action.',
        );
        expect(
          component['getErrorMessages'](component.emailForm, 'email'),
        ).toEqual([]);
        expect(component.migrationPasswordForm.controls.newPassword.value).toBe(
          '',
        );
      });
    }

    it('resets the migration and clears passwords when the new email changes', () => {
      enterEmail('new@example.com', 'aaf');
      primaryClick();
      component.migrationPasswordForm.setValue({
        newPassword: 'Secret123!',
        confirmNewPassword: 'Secret123!',
      });
      component.emailForm.controls.email.setValue('other@sydney.edu.au');

      expect(component.emailFlowState()).toBe('idle');
      expect(component.emailMigrationDirection()).toBeNull();
      expect(component.migrationPasswordForm.controls.newPassword.value).toBe(
        '',
      );
    });

    it('ignores a late institution lookup after Cancel', () => {
      const lookup = new Subject<boolean>();
      mockLoginProxyService.checkAafEmail.and.returnValue(lookup);
      enterEmail('new@sydney.edu.au');
      primaryClick();
      component['closeModal']();
      lookup.next(true);

      expect(component.activeModal()).toBeNull();
      expect(component.emailFlowState()).toBe('idle');
      expect(mockApiService.migrateAuth0ToAaf).not.toHaveBeenCalled();
    });

    it('prevents duplicate requests and a late redirect after Cancel', () => {
      const migration = new Subject<{
        migration_id: string;
        expires_at: string;
      }>();
      mockLoginProxyService.checkAafEmail.and.returnValue(of(true));
      mockApiService.migrateAuth0ToAaf.and.returnValue(migration);
      enterEmail('new@sydney.edu.au');
      primaryClick();
      primaryClick();
      primaryClick();
      expect(mockApiService.migrateAuth0ToAaf).toHaveBeenCalledTimes(1);

      component['closeModal']();
      migration.next({
        migration_id: 'late',
        expires_at: '2026-10-29T03:10:00Z',
      });
      expect(mockAuthService.loginForAafMigration).not.toHaveBeenCalled();
    });
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

  it('shows the existing error alert when the email OTP request fails', () => {
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
    expect(component.activeModal()).toBeNull();
    expect(component.alert()).toEqual({
      type: 'error',
      message: 'Rate limited',
    });
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

  it('shows an error alert and closes modal after too many OTP attempts', () => {
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

    expect(component.alert()).toEqual({
      type: 'error',
      message:
        'Too many failed attempts. Please wait before trying again or contact the administrators if this issue persists.',
    });
    expect(component.activeModal()).toBeNull();
  });

  describe('SBP bundle email-change reminder', () => {
    const sbpReminder =
      'Access to the Structural Biology Platform Bundle requires';

    const userWithSbp = (
      approvalStatus: 'approved' | 'pending',
    ): UserProfileData => ({
      ...mockUser,
      group_memberships: [
        {
          group_id: 'biocommons/group/sbp_workflow_execution',
          group_name: 'Structural Biology Platform Bundle',
          group_short_name: 'SBP',
          approval_status: approvalStatus,
        },
      ],
    });

    it('reports an approved SBP bundle via hasApprovedSbpBundle()', () => {
      mockApiService.getUserProfile.and.returnValue(
        of(userWithSbp('approved')),
      );
      fixture.detectChanges();

      expect(
        (
          component as unknown as { hasApprovedSbpBundle(): boolean }
        ).hasApprovedSbpBundle(),
      ).toBeTrue();
    });

    it('does not report a pending SBP bundle as approved', () => {
      mockApiService.getUserProfile.and.returnValue(of(userWithSbp('pending')));
      fixture.detectChanges();

      expect(
        (
          component as unknown as { hasApprovedSbpBundle(): boolean }
        ).hasApprovedSbpBundle(),
      ).toBeFalse();
    });

    it('returns false when the user has no SBP bundle', () => {
      fixture.detectChanges();

      expect(
        (
          component as unknown as { hasApprovedSbpBundle(): boolean }
        ).hasApprovedSbpBundle(),
      ).toBeFalse();
    });

    // Type a new email into the open email modal and let the debounced
    // institution check resolve (no Send OTP click).
    const typeNewEmail = (email: string) => {
      openModal('email');
      component.emailForm.controls.email.setValue(email);
      tick(400);
      fixture.detectChanges();
    };

    it('shows the red reminder when SBP is approved and the typed email is non-institutional', fakeAsync(() => {
      mockApiService.getUserProfile.and.returnValue(
        of(userWithSbp('approved')),
      );
      mockApiService.checkAustralianResearchInstitution.and.returnValue(
        of(false),
      );
      fixture.detectChanges();

      typeNewEmail('new@gmail.com');

      expect(
        mockApiService.checkAustralianResearchInstitution,
      ).toHaveBeenCalledWith('new@gmail.com');
      expect(component.sbpEmailNotInstitutional()).toBeTrue();
      expect((fixture.nativeElement as HTMLElement).textContent).toContain(
        sbpReminder,
      );
    }));

    it('keeps the SBP warning when only the email domain case changes', fakeAsync(() => {
      mockApiService.getUserProfile.and.returnValue(
        of(userWithSbp('approved')),
      );
      mockApiService.checkAustralianResearchInstitution.and.returnValue(
        of(false),
      );
      fixture.detectChanges();

      typeNewEmail('new@gmail.com');
      expect(component.sbpEmailNotInstitutional()).toBeTrue();

      component.emailForm.controls.email.setValue('new@GMAIL.COM');
      fixture.detectChanges();
      expect(component.sbpEmailNotInstitutional()).toBeTrue();
      tick(400);
      fixture.detectChanges();

      expect(component.sbpEmailNotInstitutional()).toBeTrue();
      expect((fixture.nativeElement as HTMLElement).textContent).toContain(
        sbpReminder,
      );
      expect(
        mockApiService.checkAustralianResearchInstitution,
      ).toHaveBeenCalledOnceWith('new@gmail.com');
    }));

    it('does not show the reminder when the typed email is institutional', fakeAsync(() => {
      mockApiService.getUserProfile.and.returnValue(
        of(userWithSbp('approved')),
      );
      mockApiService.checkAustralianResearchInstitution.and.returnValue(
        of(true),
      );
      fixture.detectChanges();

      typeNewEmail('new@sydney.edu.au');

      expect(component.sbpEmailNotInstitutional()).toBeFalse();
      expect((fixture.nativeElement as HTMLElement).textContent).not.toContain(
        sbpReminder,
      );
    }));

    it('does not check the email or show the reminder without an approved SBP bundle', fakeAsync(() => {
      mockApiService.checkAustralianResearchInstitution.and.returnValue(
        of(false),
      );
      fixture.detectChanges();

      typeNewEmail('new@gmail.com');

      expect(
        mockApiService.checkAustralianResearchInstitution,
      ).not.toHaveBeenCalled();
      expect((fixture.nativeElement as HTMLElement).textContent).not.toContain(
        sbpReminder,
      );
    }));

    it('does not call the API for an invalid email', fakeAsync(() => {
      mockApiService.getUserProfile.and.returnValue(
        of(userWithSbp('approved')),
      );
      fixture.detectChanges();

      typeNewEmail('not-an-email');

      expect(
        mockApiService.checkAustralianResearchInstitution,
      ).not.toHaveBeenCalled();
      expect(component.sbpEmailNotInstitutional()).toBeFalse();
    }));

    it('does not show the reminder when the institution check errors', fakeAsync(() => {
      mockApiService.getUserProfile.and.returnValue(
        of(userWithSbp('approved')),
      );
      mockApiService.checkAustralianResearchInstitution.and.returnValue(
        throwError(() => new Error('network')),
      );
      fixture.detectChanges();

      typeNewEmail('new@gmail.com');

      expect(component.sbpEmailNotInstitutional()).toBeFalse();
      expect((fixture.nativeElement as HTMLElement).textContent).not.toContain(
        sbpReminder,
      );
    }));

    it('hides the reminder again when the email is corrected to institutional', fakeAsync(() => {
      mockApiService.getUserProfile.and.returnValue(
        of(userWithSbp('approved')),
      );
      mockApiService.checkAustralianResearchInstitution.and.returnValue(
        of(false),
      );
      fixture.detectChanges();

      typeNewEmail('new@gmail.com');
      expect(component.sbpEmailNotInstitutional()).toBeTrue();

      mockApiService.checkAustralianResearchInstitution.and.returnValue(
        of(true),
      );
      component.emailForm.controls.email.setValue('new@sydney.edu.au');
      tick(400);
      fixture.detectChanges();

      expect(component.sbpEmailNotInstitutional()).toBeFalse();
      expect((fixture.nativeElement as HTMLElement).textContent).not.toContain(
        sbpReminder,
      );
    }));

    it('does not report an approved SBP bundle when SBP is disabled', () => {
      (component as unknown as { sbpEnabled: boolean }).sbpEnabled = false;
      mockApiService.getUserProfile.and.returnValue(
        of(userWithSbp('approved')),
      );
      fixture.detectChanges();

      expect(
        (
          component as unknown as { hasApprovedSbpBundle(): boolean }
        ).hasApprovedSbpBundle(),
      ).toBeFalse();
    });
  });

  it('filters SBP services and bundles from profile data when SBP is disabled', () => {
    fixture.destroy();
    environment.features.sbpEnabled = false;

    const userWithSbpAccess: UserProfileData = {
      ...mockUser,
      platform_memberships: [
        ...mockUser.platform_memberships,
        {
          platform_id: 'sbp',
          platform_name: 'Structural Biology Platform',
          approval_status: 'approved',
        },
      ],
      group_memberships: [
        ...mockUser.group_memberships,
        {
          group_id: 'biocommons/group/sbp_workflow_execution',
          group_name: 'Structural Biology Platform Bundle',
          group_short_name: 'SBP',
          approval_status: 'approved',
        },
      ],
    };
    mockApiService.getUserProfile.and.returnValue(of(userWithSbpAccess));

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    harness = component as ProfileTestHarness;
    fixture.detectChanges();

    expect(component.user()?.platform_memberships).toEqual([
      mockUser.platform_memberships[0],
    ]);
    expect(component.user()?.group_memberships).toEqual([
      mockUser.group_memberships[0],
    ]);
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain(
      'Structural Biology Platform',
    );
  });

  it('handles a successful password change', () => {
    component.passwordForm.controls.currentPassword.setValue('Current123!');
    component.passwordForm.controls.newPassword.setValue('NewPassword1!');
    component.passwordForm.controls.confirmNewPassword.setValue(
      'NewPassword1!',
    );

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
    component.passwordForm.controls.confirmNewPassword.setValue(
      'ValidPassword1!',
    );

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
    component.passwordForm.controls.confirmNewPassword.setValue('NewValid1!');

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

  describe('valueUnchangedValidator', () => {
    it('should add valueUnchanged validator when opening username modal', () => {
      fixture.detectChanges();
      openModal('username');
      fixture.detectChanges();

      // Username should have the unchanged value
      expect(component.usernameForm.value.username).toBe(mockUser.username);

      // Should be invalid if value hasn't changed
      component.usernameForm.markAllAsTouched();
      expect(
        component.usernameForm.get('username')?.hasError('valueUnchanged'),
      ).toBeTrue();
    });

    it('should show error when trying to save unchanged username', () => {
      fixture.detectChanges();
      openModal('username');
      component.usernameForm.markAllAsTouched();
      fixture.detectChanges();

      const errors = component['getErrorMessages'](
        component.usernameForm,
        'username',
      );
      expect(errors).toContain(
        'New username must be different from the current username',
      );
    });

    it('should not show error when username is changed', () => {
      fixture.detectChanges();
      openModal('username');
      component.usernameForm.patchValue({ username: 'newusername' });
      component.usernameForm.markAllAsTouched();
      fixture.detectChanges();

      expect(
        component.usernameForm.get('username')?.hasError('valueUnchanged'),
      ).toBeFalse();
    });

    it('should add valueUnchanged validator when opening email modal', () => {
      fixture.detectChanges();
      openModal('email');
      fixture.detectChanges();

      expect(component.emailForm.value.email).toBe(mockUser.email);

      component.emailForm.markAllAsTouched();
      expect(
        component.emailForm.get('email')?.hasError('valueUnchanged'),
      ).toBeTrue();
    });

    it('should show error when trying to save unchanged email', () => {
      fixture.detectChanges();
      openModal('email');
      component.emailForm.markAllAsTouched();
      fixture.detectChanges();

      const errors = component['getErrorMessages'](
        component.emailForm,
        'email',
      );
      expect(errors).toContain(
        'New email must be different from the current email',
      );
    });

    it('should not show error when email is changed', () => {
      fixture.detectChanges();
      openModal('email');
      component.emailForm.patchValue({ email: 'newemail@example.com' });
      component.emailForm.markAllAsTouched();
      fixture.detectChanges();

      expect(
        component.emailForm.get('email')?.hasError('valueUnchanged'),
      ).toBeFalse();
    });

    it('should remove valueUnchanged validator when closing modal', () => {
      fixture.detectChanges();
      openModal('username');
      fixture.detectChanges();

      expect(
        component.usernameForm.get('username')?.hasError('valueUnchanged'),
      ).toBeTrue();

      component['closeModal']();
      fixture.detectChanges();

      // After closing, the validator should be removed
      component.usernameForm.patchValue({ username: mockUser.username });
      expect(
        component.usernameForm.get('username')?.hasError('valueUnchanged'),
      ).toBeFalsy();
    });
  });

  describe('setupPasswordDifferentValidation', () => {
    it('should validate that new password is different from current password', () => {
      fixture.detectChanges();
      openModal('password');
      fixture.detectChanges();

      component.passwordForm.patchValue({
        currentPassword: 'SamePass123!',
        newPassword: 'SamePass123!',
      });
      component.passwordForm.markAllAsTouched();

      expect(
        component.passwordForm
          .get('newPassword')
          ?.hasError('passwordMustBeDifferent'),
      ).toBeTrue();

      const errors = component['getErrorMessages'](
        component.passwordForm,
        'newPassword',
      );
      expect(errors).toContain(
        'New password must be different from the current password',
      );
    });

    it('should allow saving when passwords are different', () => {
      fixture.detectChanges();
      openModal('password');
      fixture.detectChanges();

      component.passwordForm.patchValue({
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
      });

      expect(
        component.passwordForm
          .get('newPassword')
          ?.hasError('passwordMustBeDifferent'),
      ).toBeFalsy();
    });
  });

  describe('delete account', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('deleteAccountBegin opens modal and resets confirmation control', () => {
      component.openMenuAction.set(true);
      component.deleteConfirmationControl.setValue('delete');

      component.deleteAccountBegin();

      expect(component.openMenuAction()).toBeFalse();
      expect(component.showDeleteAccountModal()).toBeTrue();
      expect(component.deleteConfirmationControl.value).toBe('');
    });

    it('closeDeleteAccountModal closes modal and resets confirmation control', () => {
      component.showDeleteAccountModal.set(true);
      component.deleteConfirmationControl.setValue('delete');

      component.closeDeleteAccountModal();

      expect(component.showDeleteAccountModal()).toBeFalse();
      expect(component.deleteConfirmationControl.value).toBe('');
    });

    it('confirmDeleteAccount does nothing if confirmation control is invalid', () => {
      component.deleteConfirmationControl.setValue('wrong');

      component.confirmDeleteAccount();

      expect(mockApiService.deleteAccount).not.toHaveBeenCalled();
      expect(component.deleteConfirmationControl.touched).toBeTrue();
    });

    it('confirmDeleteAccount calls deleteAccount, closes modal and sets success alert', () => {
      jasmine.clock().install();
      component.showDeleteAccountModal.set(true);
      component.deleteConfirmationControl.setValue('delete');

      component.confirmDeleteAccount();

      expect(mockApiService.deleteAccount).toHaveBeenCalled();
      expect(component.showDeleteAccountModal()).toBeFalse();
      expect(component.alert()).toEqual({
        type: 'success',
        message: 'Account deleted successfully. You will now be logged out.',
      });

      jasmine.clock().tick(3000);
      expect(mockAuthService.logout).toHaveBeenCalled();
      jasmine.clock().uninstall();
    });

    it('confirmDeleteAccount closes modal and sets error alert on failure', () => {
      mockApiService.deleteAccount.and.returnValue(
        throwError(() => new Error('Server error')),
      );
      component.showDeleteAccountModal.set(true);
      component.deleteConfirmationControl.setValue('delete');

      component.confirmDeleteAccount();

      expect(component.showDeleteAccountModal()).toBeFalse();
      expect(component.alert()).toEqual({
        type: 'error',
        message: 'Failed to delete account',
      });
    });

    it('isDeleteButtonDisabled returns true unless value is exactly "delete"', () => {
      component.deleteConfirmationControl.setValue('');
      expect(component.isDeleteButtonDisabled()).toBeTrue();

      component.deleteConfirmationControl.setValue('delet');
      expect(component.isDeleteButtonDisabled()).toBeTrue();

      component.deleteConfirmationControl.setValue('delete');
      expect(component.isDeleteButtonDisabled()).toBeFalse();
    });
  });
});
