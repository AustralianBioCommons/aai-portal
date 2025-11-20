import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  ApiService,
  UserProfileData,
} from '../../../core/services/api.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import {
  PLATFORMS,
  PlatformId,
  biocommonsBundles,
} from '../../../core/constants/constants';
import { environment } from '../../../../environments/environment';
import { usernameRequirements } from '../../../shared/validators/usernames';
import { passwordRequirements } from '../../../shared/validators/passwords';
import { AuthService } from '../../../core/services/auth.service';
import { RouterLink } from '@angular/router';

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

  emailDraft = signal('');
  emailFlowState = signal<'idle' | 'otp-sent'>('idle');
  emailOtp = signal('');
  emailLoading = signal(false);
  otpLoading = signal(false);
  emailError = signal<string | null>(null);
  otpError = signal<string | null>(null);
  emailModalNotice = signal<string | null>(null);
  passwordCurrent = signal('');
  passwordError = signal<string | null>(null);
  activeModal = signal<ProfileModal | null>(null);
  nameControl = new FormControl<string>('', { nonNullable: true });
  usernameControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [usernameRequirements],
  });
  newPasswordControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [passwordRequirements],
  });

  isGeneralAdmin = this.authService.isGeneralAdmin;

  ngOnInit(): void {
    this.loadUserProfile();
    this.showMessageFromStorage();
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
    } else if (type === 'email') {
      this.emailDraft.set(this.user()!.email);
      this.emailFlowState.set('idle');
      this.emailOtp.set('');
      this.emailError.set(null);
      this.otpError.set(null);
      this.emailLoading.set(false);
      this.otpLoading.set(false);
      this.emailModalNotice.set(null);
    } else if (type === 'password') {
      this.passwordCurrent.set('');
      this.newPasswordControl.setValue('');
      this.passwordError.set(null);
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
        this.alert.set({ type: 'error', message: detail });
      },
    });
  }

  protected updateUsername(): void {
    this.usernameControl.markAsTouched();
    if (this.usernameControl.invalid) {
      this.alert.set({
        type: 'error',
        message: 'Please enter a valid username before saving.',
      });
      return;
    }
    const username = this.usernameControl.value.trim();
    if (!username) {
      this.alert.set({ type: 'error', message: 'Username cannot be empty.' });
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
        this.alert.set({ type: 'error', message: detail });
      },
    });
  }

  protected submitPasswordChange(): void {
    const current = this.passwordCurrent().trim();
    this.newPasswordControl.markAsTouched();
    const next = this.newPasswordControl.value.trim();
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
        this.alert.set({
          type: 'success',
          message: 'Password changed successfully.',
        });
        this.closeModal();
        this.reloadPage();
      },
      error: (err) => {
        console.error('Failed to update password:', err);
        this.savingField.set(null);
        this.passwordError.set(
          'Failed to update password. Please check your current password and try again.',
        );
      },
    });
  }

  protected sendEmailOtp(): void {
    const email = this.emailDraft().trim();
    if (!email) {
      this.emailError.set('Please enter an email address.');
      return;
    }
    this.emailLoading.set(true);
    this.emailError.set(null);
    this.alert.set(null);
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
      },
    });
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
