import { Component, signal, OnInit, inject } from '@angular/core';
import {
  ApiService,
  UserProfileData,
} from '../../../core/services/api.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import {
  PLATFORMS,
  PlatformId,
  biocommonsBundles,
} from '../../../core/constants/constants';
import { EditButtonComponent } from './edit-button/edit-button.component';
import { environment } from '../../../../environments/environment';
import { InlineEditFieldComponent } from '../../../shared/components/inline-edit-field/inline-edit-field.component';
import { PasswordEditFieldComponent } from '../../../shared/components/password-edit-field/password-edit-field.component';
import { usernameRequirements } from '../../../shared/validators/usernames';

@Component({
  selector: 'app-profile',
  imports: [
    LoadingSpinnerComponent,
    AlertComponent,
    ButtonComponent,
    EditButtonComponent,
    InlineEditFieldComponent,
    PasswordEditFieldComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  private apiService = inject(ApiService);
  protected readonly PLATFORMS = PLATFORMS;
  protected readonly biocommonsBundles = biocommonsBundles;
  protected readonly platformLaunchUrls: Partial<Record<PlatformId, string>> = {
    bpa_data_portal: environment.platformUrls.bpaPlatform,
    galaxy: environment.platformUrls.galaxyPlatform,
    sbp: environment.platformUrls.sbpPlatform,
  };

  // State signals
  user = signal<UserProfileData | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  alert = signal<{ type: 'success' | 'error'; message: string } | null>(null);
  savingField = signal<string | null>(null);

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

  protected saveUsername(
    username: string,
    field: InlineEditFieldComponent,
  ): void {
    this.savingField.set('username');
    this.alert.set(null);

    this.apiService.updateUserUsername(username).subscribe({
      next: (updatedUser) => {
        this.user.set(updatedUser);
        this.savingField.set(null);
        // Stop editing mode
        field.cancel();
        this.alert.set({
          type: 'success',
          message: 'Username updated successfully.',
        });
      },
      error: (err) => {
        console.error('Failed to update usernname:', err);
        this.savingField.set(null);
        this.alert.set({
          type: 'error',
          message: 'Failed to update username.',
        });
      },
    });
  }

  protected changePassword(
    payload: { currentPassword: string; newPassword: string },
    field: PasswordEditFieldComponent,
  ): void {
    this.savingField.set('password');
    this.alert.set(null);

    this.apiService
      .updatePassword(payload.currentPassword, payload.newPassword)
      .subscribe({
        next: () => {
          this.savingField.set(null);
          // Stop editing mode
          field.cancel();
          // We need to reload the page to fetch the updated user profile
          // with a new token, set a message we can show after reloading
          sessionStorage.setItem(
            'profile_flash_message',
            JSON.stringify({
              type: 'success',
              message: 'Password changed successfully.',
            }),
          );

          window.location.reload();
        },
        error: (err) => {
          console.error('Failed to update password:', err);
          this.savingField.set(null);
          this.alert.set({
            type: 'error',
            message:
              'Failed to update password. Please check your current password and try again.',
          });
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

  getBundleLogoUrls(groupId: string): string[] {
    const bundleId = groupId.split('/').pop() || '';
    const bundle = this.biocommonsBundles.find((b) => b.id === bundleId);
    return bundle?.logoUrls || [];
  }

  protected readonly usernameRequirements = usernameRequirements;
}
