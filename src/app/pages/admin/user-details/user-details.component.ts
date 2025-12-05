import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ApiService,
  BiocommonsUserDetails,
} from '../../../core/services/api.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { TooltipComponent } from '../../../shared/components/tooltip/tooltip.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import {
  PLATFORMS,
  PlatformId,
  BIOCOMMONS_BUNDLES,
} from '../../../core/constants/constants';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { AuthService } from '../../../core/services/auth.service';
import { DropdownMenuComponent } from '../../../shared/components/dropdown-menu/dropdown-menu.component';

type ActionModalData = {
  action: 'revoke' | 'reject';
  type: 'platform' | 'group';
  id: string;
  name: string;
  email: string;
} | null;

@Component({
  selector: 'app-user-details',
  imports: [
    DatePipe,
    LoadingSpinnerComponent,
    TooltipComponent,
    RouterLink,
    AlertComponent,
    ButtonComponent,
    ReactiveFormsModule,
    ModalComponent,
    DropdownMenuComponent,
  ],
  providers: [DatePipe],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.css',
})
export class UserDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly datePipe = inject(DatePipe);

  protected readonly platforms = PLATFORMS;
  protected readonly bundles = BIOCOMMONS_BUNDLES;

  // State signals
  user = signal<BiocommonsUserDetails | null>(null);
  loading = signal(true);
  pageError = signal<string | null>(null);
  alert = signal<{ type: 'success' | 'error'; message: string } | null>(null);
  returnUrl = signal<string>('/all-users');

  openMenuAction = signal(false);
  openMenuGroupId = signal<string | null>(null);
  openMenuPlatformId = signal<string | null>(null);

  adminType = this.authService.adminType;
  adminPlatforms = this.authService.adminPlatforms;
  adminGroups = this.authService.adminGroups;

  actionModalData = signal<ActionModalData>(null);

  // Form control
  reasonControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(255)],
  });

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    const stateReturnUrl =
      navigation?.extras?.state?.['returnUrl'] || history.state?.returnUrl;
    if (stateReturnUrl) {
      this.returnUrl.set(stateReturnUrl);
    }

    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      this.apiService.getUserDetails(userId).subscribe({
        next: (user) => {
          this.user.set(user);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load user details:', err);
          this.pageError.set('Failed to load user details');
          this.loading.set(false);
        },
      });
    } else {
      this.pageError.set('No user ID provided');
      this.loading.set(false);
    }
  }

  resendVerificationEmail() {
    const userId = this.user()!.user_id;
    this.alert.set(null);
    this.apiService.resendVerificationEmail(userId).subscribe({
      next: () => {
        this.alert.set({
          type: 'success',
          message: 'Verification email sent successfully',
        });
      },
      error: (error) => {
        console.error('Failed to resend verification email:', error);
        this.alert.set({
          type: 'error',
          message: 'Failed to resend verification email',
        });
      },
    });
    this.openMenuAction.set(false);
  }

  getPlatformName(platformId: string): string {
    return this.platforms[platformId as PlatformId]?.name || platformId;
  }

  getBundleLogoUrls(groupId: string): string[] {
    const bundleId = groupId.split('/').pop() || '';
    const bundle = this.bundles.find((b) => b.id === bundleId);
    return bundle?.logoUrls || [];
  }

  getTooltipMessage(
    reason: string | undefined,
    updatedBy: string,
    updatedAt: string,
    action = 'Revoked',
  ): string {
    const formattedDate = this.datePipe.transform(updatedAt, 'MMM d y, h:mm a');
    return `${reason || action}\n\n(${action} by ${updatedBy} on ${formattedDate})`;
  }

  canManagePlatform(platformId: string): boolean {
    if (this.adminType() === 'biocommons') {
      return true;
    }
    return this.adminPlatforms().some((p) => p.id === platformId);
  }

  canManageGroup(groupId: string): boolean {
    if (this.adminType() === 'biocommons') {
      return true;
    }
    if (this.adminType() !== 'bundle') {
      return false;
    }
    return this.adminGroups().some((g) => g.id === groupId);
  }

  private refreshUserDetails(userId: string) {
    this.apiService.getUserDetails(userId).subscribe({
      next: (user) => {
        this.user.set(user);
      },
      error: (err) => {
        console.error('Failed to refresh user details:', err);
      },
    });
  }

  isPlatformMenuOpen(platformId: string): boolean {
    return this.openMenuPlatformId() === platformId;
  }

  isGroupMenuOpen(groupId: string): boolean {
    return this.openMenuGroupId() === groupId;
  }

  approvePlatform(platformId: PlatformId): void {
    const userId = this.user()!.user_id;
    this.openMenuPlatformId.set(null);
    this.alert.set(null);
    this.apiService.approvePlatformAccess(userId, platformId).subscribe({
      next: () => {
        this.refreshUserDetails(userId);
        this.alert.set({
          type: 'success',
          message: 'Service access approved successfully',
        });
      },
      error: (error) => {
        console.error('Failed to approve service access:', error);
        this.alert.set({
          type: 'error',
          message: 'Failed to approve service access',
        });
      },
    });
  }

  approveGroup(groupId: string): void {
    const userId = this.user()!.user_id;
    this.openMenuGroupId.set(null);
    this.alert.set(null);
    this.apiService.approveGroupAccess(userId, groupId).subscribe({
      next: () => {
        this.refreshUserDetails(userId);
        this.alert.set({
          type: 'success',
          message: 'Bundle access approved successfully',
        });
      },
      error: (error) => {
        console.error('Failed to approve bundle access:', error);
        this.alert.set({
          type: 'error',
          message: 'Failed to approve bundle access',
        });
      },
    });
  }

  revokePlatform(platformId: PlatformId): void {
    this.openActionModal(
      'revoke',
      'platform',
      platformId,
      this.getPlatformName(platformId),
    );
  }

  revokeGroup(groupId: string, groupName: string): void {
    this.openActionModal('revoke', 'group', groupId, groupName);
  }

  rejectGroup(groupId: string, groupName: string): void {
    this.openActionModal('reject', 'group', groupId, groupName);
  }

  private openActionModal(
    action: 'revoke' | 'reject',
    type: 'platform' | 'group',
    id: string,
    name: string,
  ): void {
    this.openMenuGroupId.set(null);
    this.openMenuPlatformId.set(null);
    this.openMenuAction.set(false);
    this.actionModalData.set({
      action,
      type,
      id,
      name,
      email: this.user()!.email,
    });
    this.reasonControl.reset();
  }

  getActionModalTitle(): string {
    const modalData = this.actionModalData();
    if (!modalData) return '';
    if (modalData.action === 'reject')
      return 'Do you want to reject this user?';
    if (modalData.type === 'platform')
      return 'Do you want to revoke this user?';
    return `Do you want to revoke this user from ${modalData.name}?`;
  }

  closeActionModal(): void {
    this.actionModalData.set(null);
    this.reasonControl.reset();
  }

  confirmActionModal(): void {
    const modalData = this.actionModalData();
    this.reasonControl.markAsTouched();

    if (!modalData || this.reasonControl.invalid) {
      return;
    }

    const userId = this.user()!.user_id;
    const reason = this.reasonControl.value.trim();
    this.alert.set(null);

    if (modalData.action === 'reject') {
      this.apiService
        .rejectGroupAccess(userId, modalData.id, reason)
        .subscribe({
          next: () => {
            this.refreshUserDetails(userId);
            this.closeActionModal();
            this.alert.set({
              type: 'success',
              message: 'Bundle access rejected successfully',
            });
          },
          error: (error) => {
            this.closeActionModal();
            console.error('Failed to reject bundle access:', error);
            this.alert.set({
              type: 'error',
              message: 'Failed to reject bundle access',
            });
          },
        });
    } else if (modalData.type === 'platform') {
      this.apiService
        .revokePlatformAccess(userId, modalData.id as PlatformId, reason)
        .subscribe({
          next: () => {
            this.refreshUserDetails(userId);
            this.closeActionModal();
            this.alert.set({
              type: 'success',
              message: 'Service access revoked successfully',
            });
          },
          error: (error) => {
            this.closeActionModal();
            console.error('Failed to revoke service access:', error);
            this.alert.set({
              type: 'error',
              message: 'Failed to revoke service access',
            });
          },
        });
    } else {
      this.apiService
        .revokeGroupAccess(userId, modalData.id, reason)
        .subscribe({
          next: () => {
            this.refreshUserDetails(userId);
            this.closeActionModal();
            this.alert.set({
              type: 'success',
              message: 'Bundle access revoked successfully',
            });
          },
          error: (error) => {
            this.closeActionModal();
            console.error('Failed to revoke bundle access:', error);
            this.alert.set({
              type: 'error',
              message: 'Failed to revoke bundle access',
            });
          },
        });
    }
  }
}
