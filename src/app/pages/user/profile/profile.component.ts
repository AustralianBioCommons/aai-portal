import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ApiService,
  UserProfileData,
} from '../../../core/services/api.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import {
  PLATFORMS,
  PlatformId,
  biocommonsBundles,
} from '../../../core/constants/constants';
import { environment } from '../../../../environments/environment';
import { usernameRequirements } from '../../../shared/validators/usernames';
import {
  passwordRequirements,
  ALLOWED_SPECIAL_CHARACTERS,
} from '../../../shared/validators/passwords';
import { AuthService } from '../../../core/services/auth.service';
import { RouterLink } from '@angular/router';
import {
  emailLengthValidator,
  internationalEmailValidator,
  toAsciiEmail,
} from '../../../shared/validators/emails';
import { ValidationService } from '../../../core/services/validation.service';

type ProfileModal = 'name' | 'username' | 'email' | 'password';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    AlertComponent,
    ModalComponent,
    ButtonComponent,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  private apiService = inject(ApiService);
  private document = inject(DOCUMENT);
  private authService = inject(AuthService);
  private validationService = inject(ValidationService);

  protected readonly PLATFORMS = PLATFORMS;
  protected readonly biocommonsBundles = biocommonsBundles;
  protected readonly platformLaunchUrls: Partial<Record<PlatformId, string>> = {
    bpa_data_portal: environment.platformUrls.bpaPlatform,
    galaxy: environment.platformUrls.galaxyPlatform,
    sbp: environment.platformUrls.sbpPlatform,
  };

  user = signal<UserProfileData | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  alert = signal<{ type: 'success' | 'error'; message: string } | null>(null);
  savingField = signal<string | null>(null);

  emailControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [
      Validators.required,
      internationalEmailValidator,
      emailLengthValidator,
    ],
  });
  emailForm = new FormGroup({
    email: this.emailControl,
  });
  emailFlowState = signal<'idle' | 'otp-sent'>('idle');
  emailOtp = signal('');
  emailLoading = signal(false);
  otpLoading = signal(false);
  emailError = signal<string | null>(null);
  otpError = signal<string | null>(null);
  emailModalNotice = signal<string | null>(null);
  emailOtpLocked = signal(false);
  currentPasswordControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  passwordError = signal<string | null>(null);
  passwordAttempted = signal(false);
  activeModal = signal<ProfileModal | null>(null);
  nameControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(255)],
  });
  usernameControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [usernameRequirements],
  });
  usernameError = signal<string | null>(null);
  newPasswordControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [passwordRequirements],
  });
  protected readonly passwordSpecialCharacters = ALLOWED_SPECIAL_CHARACTERS;

  isGeneralAdmin = this.authService.isGeneralAdmin;

  ngOnInit(): void {
    this.loadUserProfile();
    this.showMessageFromStorage();
    this.usernameControl.valueChanges.subscribe(() => {
      this.usernameError.set(null);
    });
  }

  protected showMessageFromStorage(): void {
    const flashMessage = sessionStorage.getItem('profile_flash_message');
    if (flashMessage) {
      const { type, message } = JSON.parse(flashMessage);
      this.alert.set({ type, message });
      sessionStorage.removeItem('profile_flash_message');
    }
  }

  protected openModal(type: ProfileModal): void {
    if (!this.user()) {
      return;
    }
    this.alert.set(null);
    if (type === 'name') {
      this.nameControl.setValue(this.user()!.name);
    } else if (type === 'username') {
      this.usernameControl.setValue(this.user()!.username);
      this.usernameError.set(null);
    } else if (type === 'email') {
      this.emailControl.setValue(this.user()!.email);
      this.emailControl.markAsUntouched();
      this.emailControl.markAsPristine();
      this.emailFlowState.set('idle');
      this.emailOtp.set('');
      this.emailError.set(null);
      this.otpError.set(null);
      this.emailLoading.set(false);
      this.otpLoading.set(false);
      this.emailModalNotice.set(null);
      this.emailOtpLocked.set(false);
    } else if (type === 'password') {
      this.currentPasswordControl.reset('');
      this.newPasswordControl.setValue('');
      this.passwordError.set(null);
      this.passwordAttempted.set(false);
    }
    this.activeModal.set(type);
  }

  protected closeModal(): void {
    const current = this.activeModal();
    this.activeModal.set(null);
    if (current === 'email') {
      this.emailFlowState.set('idle');
      this.emailOtp.set('');
      this.emailError.set(null);
      this.otpError.set(null);
      this.emailLoading.set(false);
      this.otpLoading.set(false);
      this.emailModalNotice.set(null);
      this.emailOtpLocked.set(false);
    }
  }

  protected handleModalPrimary(): void {
    const type = this.activeModal();
    if (type === 'name') {
      this.updateName();
    } else if (type === 'username') {
      this.updateUsername();
    } else if (type === 'email') {
      if (this.emailFlowState() === 'otp-sent') {
        this.confirmEmailChange();
      } else {
        this.sendEmailOtp();
      }
    } else if (type === 'password') {
      this.submitPasswordChange();
    }
  }

  protected modalTitle(): string {
    switch (this.activeModal()) {
      case 'name':
        return 'Edit full name';
      case 'username':
        return 'Update username';
      case 'email':
        return 'Change email address';
      case 'password':
        return 'Change password';
      default:
        return '';
    }
  }

  protected modalPrimaryText(): string {
    const type = this.activeModal();
    if (type === 'email') {
      if (this.emailLoading()) {
        return 'Sending...';
      }
      if (this.otpLoading()) {
        return 'Verifying...';
      }
      return this.emailFlowState() === 'otp-sent' ? 'Confirm OTP' : 'Send OTP';
    }
    return this.savingField() === type ? 'Saving...' : 'Save';
  }

  protected modalDescription(): string {
    switch (this.activeModal()) {
      case 'name':
        return 'Update the name that shows across AAI.';
      case 'username':
        return 'Usernames are unique and may include letters, numbers, dashes, and underscores.';
      case 'email':
        return 'Enter a new email and verify it with the OTP sent to that inbox.';
      case 'password':
        return 'Choose a strong password that you can remember.';
      default:
        return '';
    }
  }

  protected updateName(): void {
    const next = this.nameControl.value.trim();
    if (!next) {
      this.alert.set({ type: 'error', message: 'Name cannot be empty.' });
      return;
    }
    this.savingField.set('name');
    this.apiService.updateFullName(next).subscribe({
      next: () => {
        this.savingField.set(null);
        this.alert.set({
          type: 'success',
          message: 'Name updated successfully.',
        });
        this.closeModal();
        this.loadUserProfile();
      },
      error: (err) => {
        console.error('Failed to update name:', err);
        const detail = err.error?.detail || 'Failed to update name.';
        this.savingField.set(null);
        this.closeModal();
        this.alert.set({ type: 'error', message: detail });
      },
    });
  }

  protected updateUsername(): void {
    this.usernameControl.markAsTouched();
    if (this.usernameControl.invalid) {
      this.usernameError.set('Please enter a valid username before saving.');
      return;
    }
    const username = this.usernameControl.value.trim();
    if (!username) {
      this.usernameError.set('Username cannot be empty.');
      return;
    }
    this.savingField.set('username');
    this.apiService.updateUserUsername(username).subscribe({
      next: () => {
        this.savingField.set(null);
        this.alert.set({
          type: 'success',
          message: 'Username updated successfully.',
        });
        this.closeModal();
        this.loadUserProfile();
      },
      error: (err) => {
        console.error('Failed to update username:', err);
        const detail = err.error?.detail || 'Failed to update username.';
        this.savingField.set(null);
        this.closeModal();
        this.usernameError.set(detail);
        this.alert.set({ type: 'error', message: detail });
      },
    });
  }

  protected submitPasswordChange(): void {
    this.currentPasswordControl.markAsTouched();
    const current = this.currentPasswordControl.value.trim();
    this.newPasswordControl.markAsTouched();
    const next = this.newPasswordControl.value.trim();
    this.passwordAttempted.set(true);
    if (!current || !next) {
      this.passwordError.set('Both current and new passwords are required.');
      return;
    }
    if (this.newPasswordControl.invalid) {
      this.passwordError.set('New password does not meet the requirements.');
      return;
    }
    if (current === next) {
      this.passwordError.set(
        'New password must be different from current password.',
      );
      return;
    }
    this.passwordError.set(null);
    this.savingField.set('password');
    this.apiService.updatePassword(current, next).subscribe({
      next: () => {
        this.savingField.set(null);
        const flashMessage = {
          type: 'success',
          message: 'Password changed successfully.',
        };
        sessionStorage.setItem(
          'profile_flash_message',
          JSON.stringify(flashMessage),
        );
        this.closeModal();
        this.reloadPage();
      },
      error: (err) => {
        console.error('Failed to update password:', err);
        this.savingField.set(null);
        this.passwordError.set(
          'Failed to update password. Please check your current password and try again.',
        );
        this.closeModal();
        this.alert.set({
          type: 'error',
          message:
            'Failed to update password. Please check your current password and try again.',
        });
      },
    });
  }

  protected sendEmailOtp(): void {
    this.emailControl.markAsTouched();
    if (this.emailControl.invalid) {
      this.emailError.set('Please correct the highlighted email errors.');
      return;
    }
    const email = toAsciiEmail(this.emailControl.value.trim());
    this.emailLoading.set(true);
    this.emailError.set(null);
    this.alert.set(null);
    this.emailOtpLocked.set(false);
    this.apiService.requestEmailChange(email).subscribe({
      next: ({ message }) => {
        this.emailLoading.set(false);
        this.emailFlowState.set('otp-sent');
        this.emailModalNotice.set(
          message || 'OTP sent to the requested email address.',
        );
      },
      error: (err) => {
        this.emailLoading.set(false);
        const detail = err.error?.detail;
        this.emailError.set(
          detail ??
            'Failed to send OTP. If this issue persists contact the administrators.',
        );
      },
    });
  }

  protected confirmEmailChange(): void {
    const otp = this.emailOtp().trim();
    if (!otp) {
      this.otpError.set('Please enter the verification code.');
      return;
    }
    this.otpLoading.set(true);
    this.otpError.set(null);
    this.alert.set(null);
    this.apiService.continueEmailChange(otp).subscribe({
      next: () => {
        this.otpLoading.set(false);
        this.closeModal();
        this.loadUserProfile();
      },
      error: (err) => {
        this.otpLoading.set(false);
        const status = err.status;
        const detail = err.error?.detail;
        const message =
          status === 409
            ? 'That email is already used by another account.'
            : (detail ?? 'Invalid code. Please try again.');
        this.otpError.set(message);
        if (status === 429) {
          this.emailOtpLocked.set(true);
        }
      },
    });
  }

  protected getEmailValidationMessages(): string[] {
    return this.validationService.getErrorMessages(this.emailForm, 'email');
  }

  protected shouldShowEmailValidationMessages(): boolean {
    return (
      this.emailControl.invalid &&
      (this.emailControl.dirty || this.emailControl.touched)
    );
  }

  protected shouldShowPasswordFeedback(): boolean {
    return (
      this.newPasswordControl.invalid &&
      (this.newPasswordControl.dirty ||
        this.newPasswordControl.touched ||
        this.passwordAttempted())
    );
  }

  protected hasPasswordRequirementError(condition: string): boolean {
    return (
      this.shouldShowPasswordFeedback() &&
      this.newPasswordControl.hasError(condition)
    );
  }

  protected shouldDisableModalPrimary(): boolean {
    const modal = this.activeModal();
    if (modal === 'email') {
      return this.emailControl.invalid || this.emailOtpLocked();
    }
    if (modal === 'password') {
      return (
        this.newPasswordControl.invalid || this.currentPasswordControl.invalid
      );
    }
    return false;
  }

  private loadUserProfile(): void {
    this.loading.set(true);
    this.error.set(null);
    this.apiService.getUserProfile().subscribe({
      next: (user) => {
        this.user.set(user);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load user profile:', err);
        this.error.set('Failed to load user profile');
        this.loading.set(false);
      },
    });
  }

  protected getBundleLogoUrls(groupId: string): string[] {
    const bundleId = groupId.split('/').pop() || '';
    const bundle = this.biocommonsBundles.find((b) => b.id === bundleId);
    return bundle?.logoUrls || [];
  }

  public reloadPage(): void {
    this.document.location.reload();
  }
}
