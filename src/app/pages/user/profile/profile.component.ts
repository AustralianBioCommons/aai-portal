import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormBuilder,
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
  PlatformId,
  PLATFORMS,
  BIOCOMMONS_BUNDLES,
} from '../../../core/constants/constants';
import { environment } from '../../../../environments/environment';
import { usernameRequirements } from '../../../shared/validators/usernames';
import { passwordRequirements } from '../../../shared/validators/passwords';
import { AuthService } from '../../../core/services/auth.service';
import { RouterLink } from '@angular/router';
import {
  emailLengthValidator,
  internationalEmailValidator,
  toAsciiEmail,
} from '../../../shared/validators/emails';
import { ValidationService } from '../../../core/services/validation.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroArrowLeft, heroPlusCircle } from '@ng-icons/heroicons/outline';

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
    NgIcon,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  viewProviders: [provideIcons({ heroArrowLeft, heroPlusCircle })],
})
export class ProfileComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private validationService = inject(ValidationService);
  private formBuilder = inject(FormBuilder);

  protected readonly platforms = PLATFORMS;
  protected readonly bundles = BIOCOMMONS_BUNDLES;
  protected readonly platformLaunchUrls: Partial<Record<PlatformId, string>> = {
    bpa_data_portal:
      environment.platformUrls.bpaPlatformLogin ??
      environment.platformUrls.bpaPlatform,
    galaxy: environment.platformUrls.galaxyPlatform,
    sbp: environment.platformUrls.sbpPlatform,
  };

  user = signal<UserProfileData | null>(null);
  pageLoading = signal(true);
  pageError = signal<string | null>(null);
  alert = signal<{ type: 'success' | 'error'; message: string } | null>(null);

  isGeneralAdmin = this.authService.isGeneralAdmin;

  nameForm = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(300)]],
  });

  usernameForm = this.formBuilder.nonNullable.group({
    username: ['', usernameRequirements],
  });

  emailForm = this.formBuilder.nonNullable.group({
    email: [
      '',
      [Validators.required, internationalEmailValidator, emailLengthValidator],
    ],
  });
  emailFlowState = signal<'idle' | 'otp-sent'>('idle');
  emailOtp = signal('');
  emailLoading = signal(false);
  otpLoading = signal(false);
  otpError = signal<string | null>(null);
  emailModalNotice = signal<string | null>(null);
  emailOtpLocked = signal(false);

  passwordForm = this.formBuilder.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', passwordRequirements],
  });

  activeModal = signal<ProfileModal | null>(null);
  modalLoading = signal(false);

  ngOnInit(): void {
    this.loadUserProfile();
    this.validationService.setupPasswordDifferentValidation(this.passwordForm);
    this.usernameForm.get('username')?.valueChanges.subscribe(() => {
      if (this.validationService.hasFieldBackendError('username')) {
        this.validationService.clearFieldBackendError('username');
      }
    });
  }

  protected openModal(type: ProfileModal): void {
    const user = this.user();
    if (!user) return;

    this.alert.set(null);

    switch (type) {
      case 'name':
        this.nameForm.reset({ fullName: user.name });
        break;
      case 'username':
        this.usernameForm.reset({ username: user.username });
        this.validationService.clearFieldBackendError('username');
        break;
      case 'email':
        this.emailForm.reset({ email: user.email });
        this.resetEmailFlowState();
        this.validationService.clearFieldBackendError('email');
        break;
      case 'password':
        this.passwordForm.reset({ currentPassword: '', newPassword: '' });
        break;
    }
    this.activeModal.set(type);
  }

  private resetEmailFlowState(): void {
    this.emailFlowState.set('idle');
    this.emailOtp.set('');
    this.otpError.set(null);
    this.emailLoading.set(false);
    this.otpLoading.set(false);
    this.emailModalNotice.set(null);
    this.emailOtpLocked.set(false);
  }

  protected closeModal(): void {
    if (this.activeModal() === 'email') {
      this.resetEmailFlowState();
      this.validationService.clearFieldBackendError('email');
    }
    this.activeModal.set(null);
  }

  protected modalTitle(): string {
    switch (this.activeModal()) {
      case 'name':
        return 'Edit my name';
      case 'username':
        return 'Edit my username';
      case 'email':
        return 'Change my email address';
      case 'password':
        return 'Change my password';
      default:
        return '';
    }
  }

  protected modalDescription(): string {
    return this.activeModal() === 'email'
      ? 'To verify your email, we will send a one-time-password (OTP) to your new email address.'
      : '';
  }

  protected modalPrimaryButtonText(): string {
    return this.activeModal() === 'email'
      ? this.emailFlowState() === 'idle'
        ? 'Send OTP'
        : 'Confirm OTP'
      : 'Save';
  }

  protected onModalPrimaryButtonClick(): void {
    switch (this.activeModal()) {
      case 'name':
        this.updateName();
        break;
      case 'username':
        this.updateUsername();
        break;
      case 'email':
        if (this.emailFlowState() === 'idle') {
          this.sendEmailOtp();
        } else {
          this.confirmEmailChange();
        }
        break;
      case 'password':
        this.updatePassword();
        break;
      default:
        break;
    }
  }

  protected updateName(): void {
    this.nameForm.markAllAsTouched();
    if (this.nameForm.invalid) {
      return;
    }
    const name = this.nameForm.value.fullName!.trim();
    this.modalLoading.set(true);
    this.apiService.updateFullName(name).subscribe({
      next: () => {
        this.modalLoading.set(false);
        this.alert.set({
          type: 'success',
          message: 'Name updated successfully',
        });
        this.closeModal();
        this.loadUserProfile();
      },
      error: (err) => {
        this.modalLoading.set(false);
        console.error('Failed to update name: ', err);
        this.alert.set({
          type: 'error',
          message: err.error?.detail || 'Failed to update name',
        });
        this.closeModal();
      },
    });
  }

  protected updateUsername(): void {
    this.usernameForm.markAllAsTouched();
    if (this.usernameForm.invalid) {
      return;
    }
    const username = this.usernameForm.value.username!.trim();
    this.modalLoading.set(true);
    this.apiService.updateUsername(username).subscribe({
      next: () => {
        this.modalLoading.set(false);
        this.alert.set({
          type: 'success',
          message: 'Username updated successfully',
        });
        this.closeModal();
        this.loadUserProfile();
      },
      error: (err) => {
        this.modalLoading.set(false);
        console.error('Failed to update username: ', err);
        this.validationService.setBackendErrorMessages(err);
        this.usernameForm.markAllAsTouched();

        if (!this.validationService.hasFieldBackendError('username')) {
          this.alert.set({
            type: 'error',
            message: err.error?.detail || 'Failed to update username',
          });
          this.closeModal();
        }
      },
    });
  }

  protected updatePassword(): void {
    this.passwordForm.markAllAsTouched();
    if (this.passwordForm.invalid) {
      return;
    }
    const currentPassword = this.passwordForm.value.currentPassword!.trim();
    const newPassword = this.passwordForm.value.newPassword!.trim();
    this.modalLoading.set(true);
    this.apiService.updatePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.modalLoading.set(false);
        this.alert.set({
          type: 'success',
          message: 'Password changed successfully',
        });
        this.closeModal();
      },
      error: (err) => {
        this.modalLoading.set(false);
        console.error('Failed to update password: ', err);
        this.validationService.setBackendErrorMessages(err);
        this.passwordForm.markAllAsTouched();

        if (!this.validationService.hasFieldBackendError('currentPassword')) {
          this.alert.set({
            type: 'error',
            message:
              'Failed to update password. Please check your current password and try again.',
          });
          this.closeModal();
        }
      },
    });
  }

  protected sendEmailOtp(): void {
    this.emailForm.markAllAsTouched();
    if (this.emailForm.invalid) {
      return;
    }
    const email = toAsciiEmail(this.emailForm.value.email?.trim() || '');
    this.emailLoading.set(true);
    this.validationService.clearFieldBackendError('email');
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
        this.alert.set({
          type: 'error',
          message:
            err.error?.detail ??
            'Failed to send OTP. If this issue persists contact the administrators.',
        });
        this.closeModal();
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

  protected isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    return this.validationService.isFieldInvalid(form, fieldName);
  }

  protected getErrorMessages(form: FormGroup, fieldName: string): string[] {
    return this.validationService.getErrorMessages(form, fieldName);
  }

  protected shouldDisableModalPrimary(): boolean {
    if (this.activeModal() === 'email') {
      return this.emailForm.invalid || this.emailOtpLocked();
    }
    return false;
  }

  protected isModalLoading(): boolean {
    return this.modalLoading() || this.emailLoading() || this.otpLoading();
  }

  private loadUserProfile(): void {
    this.pageLoading.set(true);
    this.pageError.set(null);
    this.apiService.getUserProfile().subscribe({
      next: (user) => {
        this.user.set(user);
        this.pageLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load user profile: ', err);
        this.pageError.set('Failed to load user profile');
        this.pageLoading.set(false);
      },
    });
  }

  protected getBundleLogoUrls(groupId: string): string[] {
    const bundleId = groupId.split('/').pop() || '';
    const bundle = this.bundles.find((b) => b.id === bundleId);
    return bundle?.logoUrls || [];
  }
}
