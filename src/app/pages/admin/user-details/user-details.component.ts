import { Component, inject, signal, OnInit, computed } from '@angular/core';
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

type RevokeModalData = {
  type: 'platform' | 'group';
  id: string;
  name: string;
  email: string;
} | null;

type RejectModalData = {
  membershipId: string;
  groupId: string;
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
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.css',
})
export class UserDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  protected readonly PLATFORMS = PLATFORMS;
  protected readonly BIOCOMMONS_BUNDLES = BIOCOMMONS_BUNDLES;

  // State signals
  user = signal<BiocommonsUserDetails | null>(null);
  loading = signal(true);
  pageError = signal<string | null>(null);
  alert = signal<{ type: 'success' | 'error'; message: string } | null>(null);
  returnUrl = signal<string>('/all-users');

  openMenuAction = signal(false);
  openMenuGroupId = signal<string | null>(null);
  openMenuPlatformId = signal<string | null>(null);

  revokeModalData = signal<RevokeModalData>(null);
  rejectModalData = signal<RejectModalData>(null);

  adminType = this.authService.adminType;
  adminPlatforms = this.authService.adminPlatforms;
  adminGroups = this.authService.adminGroups;

  readonly isSbpAdmin = computed(
    () =>
      this.adminType() === 'platform' &&
      this.adminPlatforms().some((p) => p?.id === 'sbp'),
  );

  // Form controls
  revokeReasonControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  rejectReasonControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(255)],
  });

  ngOnInit() {
    const userId = this.route.snapshot.paramMap.get('id');

    // Get returnUrl from navigation state
    const navigation = this.router.getCurrentNavigation();
    const stateReturnUrl =
      navigation?.extras?.state?.['returnUrl'] || history.state?.returnUrl;

    if (stateReturnUrl) {
      this.returnUrl.set(stateReturnUrl);
    }

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
    return this.PLATFORMS[platformId as PlatformId]?.name || platformId;
  }

  getBundleLogoUrls(groupId: string): string[] {
    const bundleId = groupId.split('/').pop() || '';
    const bundle = this.BIOCOMMONS_BUNDLES.find((b) => b.id === bundleId);
    return bundle?.logoUrls || [];
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

  approvePlatform(platformId: PlatformId) {
    const userId = this.user()!.user_id;
    this.alert.set(null);

    this.apiService.approvePlatformAccess(userId, platformId).subscribe({
      next: () => {
        this.refreshUserDetails(userId);
        this.alert.set({
          type: 'success',
          message: 'Platform access approved successfully',
        });
      },
      error: (error) => {
        console.error('Failed to approve platform access:', error);
        this.alert.set({
          type: 'error',
          message: 'Failed to approve platform access',
        });
      },
    });
  }

  approveGroup(membershipId: string): void {
    this.openMenuGroupId.set(null);
    const userId = this.user()!.user_id;
    const membership = this.user()!.group_memberships.find(
      (m) => m.id === membershipId,
    );
    if (!membership) {
      return;
    }

    this.alert.set(null);
    this.apiService.approveGroupAccess(userId, membership.group_id).subscribe({
      next: () => {
        this.refreshUserDetails(userId);
        this.alert.set({
          type: 'success',
          message: 'Group access approved successfully',
        });
      },
      error: (error) => {
        console.error('Failed to approve group access:', error);
        this.alert.set({
          type: 'error',
          message: 'Failed to approve group access',
        });
      },
    });
  }

  rejectGroup(membershipId: string): void {
    this.openMenuGroupId.set(null);
    const membership = this.user()?.group_memberships.find(
      (m) => m.id === membershipId,
    );
    if (!membership || !this.user()) {
      return;
    }

    this.rejectModalData.set({
      membershipId,
      groupId: membership.group_id,
      name: membership.group_name,
      email: this.user()!.email,
    });
    this.rejectReasonControl.reset();
  }

  revokeGroup(membershipId: string): void {
    this.openMenuGroupId.set(null);
    const membership = this.user()!.group_memberships.find(
      (m) => m.id === membershipId,
    );
    if (!membership) {
      return;
    }
    this.revokeModalData.set({
      type: 'group',
      id: membership.group_id,
      name: membership.group_name,
      email: this.user()!.email,
    });
    this.revokeReasonControl.reset();
  }

  getRevokeModalTitle(): string {
    const modalData = this.revokeModalData();
    if (!modalData) return '';
    if (modalData.type === 'platform') {
      return `Do you want to revoke this user?`;
    } else {
      return `Do you want to revoke this user from ${modalData.name}?`;
    }
  }

  openRevokeModal(platformId: PlatformId): void {
    this.revokeModalData.set({
      type: 'platform',
      id: platformId,
      name: this.getPlatformName(platformId),
      email: this.user()!.email,
    });
    this.revokeReasonControl.reset();
  }

  closeRevokeModal(): void {
    this.revokeModalData.set(null);
    this.revokeReasonControl.reset();
  }

  closeRejectModal(): void {
    this.rejectModalData.set(null);
    this.rejectReasonControl.reset();
  }

  confirmRevoke(): void {
    const modalData = this.revokeModalData();
    this.revokeReasonControl.markAsTouched();

    if (!modalData || this.revokeReasonControl.invalid) {
      return;
    }

    const userId = this.user()!.user_id;
    const reason = this.revokeReasonControl.value.trim();
    this.alert.set(null);

    if (modalData.type === 'platform') {
      this.apiService
        .revokePlatformAccess(userId, modalData.id as PlatformId, reason)
        .subscribe({
          next: () => {
            this.refreshUserDetails(userId);
            this.closeRevokeModal();
            this.alert.set({
              type: 'success',
              message: 'Platform access revoked successfully',
            });
          },
          error: (error) => {
            this.closeRevokeModal();
            console.error('Failed to revoke platform access:', error);
            this.alert.set({
              type: 'error',
              message: 'Failed to revoke platform access',
            });
          },
        });
    } else {
      this.apiService
        .revokeGroupAccess(userId, modalData.id, reason)
        .subscribe({
          next: () => {
            this.refreshUserDetails(userId);
            this.closeRevokeModal();
            this.alert.set({
              type: 'success',
              message: 'Group access revoked successfully',
            });
          },
          error: (error) => {
            this.closeRevokeModal();
            console.error('Failed to revoke group access:', error);
            this.alert.set({
              type: 'error',
              message: 'Failed to revoke group access',
            });
          },
        });
    }
  }

  confirmReject(): void {
    const modalData = this.rejectModalData();
    this.rejectReasonControl.markAsTouched();

    if (!modalData || this.rejectReasonControl.invalid) {
      return;
    }

    const reason = this.rejectReasonControl.value.trim();
    if (!reason) {
      this.rejectReasonControl.setErrors({ required: true });
      return;
    }

    const userId = this.user()!.user_id;
    this.alert.set(null);
    this.apiService
      .rejectGroupAccess(userId, modalData.groupId, reason)
      .subscribe({
        next: () => {
          this.alert.set({
            type: 'success',
            message: 'Group access rejected successfully',
          });
          this.closeRejectModal();
          this.refreshUserDetails(userId);
        },
        error: (error) => {
          console.error('Failed to reject group access:', error);
          this.alert.set({
            type: 'error',
            message: 'Failed to reject group access',
          });
          this.closeRejectModal();
        },
      });
  }
}
