import {
  Component,
  inject,
  signal,
  OnInit,
  ViewChild,
  ElementRef,
  Renderer2,
} from '@angular/core';
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
  biocommonsBundles,
} from '../../../core/constants/constants';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { AuthService } from '../../../core/services/auth.service';
import {
  parseReasonFields,
  ReasonFields,
} from '../../../shared/utils/reason-format';

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

type PlatformMembershipWithReason = PlatformMembership & ReasonFields;
type GroupMembershipWithReason = GroupMembership & ReasonFields;
type UserDetailsWithReasons = Omit<
  BiocommonsUserDetails,
  'platform_memberships' | 'group_memberships'
> & {
  platform_memberships: PlatformMembershipWithReason[];
  group_memberships: GroupMembershipWithReason[];
};

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
  ],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.css',
})
export class UserDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);
  private renderer = inject(Renderer2);
  private authService = inject(AuthService);

  protected readonly PLATFORMS = PLATFORMS;
  protected readonly biocommonsBundles = biocommonsBundles;

  @ViewChild('actionMenu', { read: ElementRef }) actionMenu!: ElementRef;
  @ViewChild('actionMenuButton', { read: ElementRef })
  actionMenuButton!: ElementRef;

  // State signals
  user = signal<UserDetailsWithReasons | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  actionMenuOpen = signal(false);
  revokeModalData = signal<RevokeModalData>(null);
  rejectModalData = signal<RejectModalData>(null);
  alert = signal<{ type: 'success' | 'error'; message: string } | null>(null);
  returnUrl = signal<string>('/all-users');
  openMenuMembershipId = signal<string | null>(null);
  adminType = this.authService.adminType;
  adminPlatforms = this.authService.adminPlatforms;
  adminGroups = this.authService.adminGroups;

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
          this.error.set('Failed to load user details');
          this.loading.set(false);
        },
      });
    } else {
      this.error.set('No user ID provided');
      this.loading.set(false);
    }

    this.setupClickOutsideMenuHandler();
  }

  private setupClickOutsideMenuHandler() {
    this.renderer.listen('window', 'click', (e: Event) => {
      const target = e.target as Element;
      if (
        !this.actionMenuButton?.nativeElement.contains(target) &&
        !this.actionMenu?.nativeElement.contains(target)
      ) {
        this.actionMenuOpen.set(false);
      }

      // Close group membership menu
      if (
        !target.closest('.membership-menu-button') &&
        !target.closest('.membership-menu-dropdown')
      ) {
        this.openMenuMembershipId.set(null);
      }
    });
  }

  toggleActionMenu() {
    this.actionMenuOpen.set(!this.actionMenuOpen());
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
    this.actionMenuOpen.set(false);
  }

  getPlatformName(platformId: string): string {
    return this.PLATFORMS[platformId as PlatformId]?.name || platformId;
  }

  getBundleLogoUrls(groupId: string): string[] {
    const bundleId = groupId.split('/').pop() || '';
    const bundle = this.biocommonsBundles.find((b) => b.id === bundleId);
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

  toggleMembershipMenu(membershipId: string): void {
    if (this.openMenuMembershipId() === membershipId) {
      this.openMenuMembershipId.set(null);
    } else {
      this.openMenuMembershipId.set(membershipId);
    }
  }

  isMembershipMenuOpen(membershipId: string): boolean {
    return this.openMenuMembershipId() === membershipId;
  }

  approveGroupMembership(membershipId: string): void {
    this.openMenuMembershipId.set(null);
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
        this.alert.set({
          type: 'success',
          message: 'Group access approved successfully',
        });
        this.refreshUserDetails(userId);
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

  rejectGroupMembership(membershipId: string): void {
    this.openMenuMembershipId.set(null);
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

  revokeGroupMembership(membershipId: string): void {
    this.openMenuMembershipId.set(null);
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

  togglePlatformApproval(platformId: PlatformId, currentStatus: string) {
    if (currentStatus === 'approved') {
      this.openRevokeModal(platformId);
    } else {
      this.approvePlatform(platformId);
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
            this.alert.set({
              type: 'success',
              message: 'Platform access revoked successfully',
            });
            this.closeRevokeModal();
            this.refreshUserDetails(userId);
          },
          error: (error) => {
            console.error('Failed to revoke platform access:', error);
            this.alert.set({
              type: 'error',
              message: 'Failed to revoke platform access',
            });
            this.closeRevokeModal();
          },
        });
    } else {
      this.apiService
        .revokeGroupAccess(userId, modalData.id, reason)
        .subscribe({
          next: () => {
            this.alert.set({
              type: 'success',
              message: 'Group access revoked successfully',
            });
            this.closeRevokeModal();
            this.refreshUserDetails(userId);
          },
          error: (error) => {
            console.error('Failed to revoke group access:', error);
            this.alert.set({
              type: 'error',
              message: 'Failed to revoke group access',
            });
            this.closeRevokeModal();
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

  private approvePlatform(platformId: PlatformId) {
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

  private refreshUserDetails(userId: string) {
    this.apiService.getUserDetails(userId).subscribe({
      next: (user) => {
        this.user.set(this.withReasonFields(user));
      },
      error: (err) => {
        console.error('Failed to refresh user details:', err);
      },
    });
  }

  private withReasonFields(
    user: BiocommonsUserDetails,
  ): UserDetailsWithReasons {
    const platform_memberships = user.platform_memberships.map((pm) => {
      const parsed = parseReasonFields(
        pm.revocation_reason,
        pm.updated_at,
        pm.updated_by,
        pm.approval_status === 'revoked' ? 'revoked' : undefined,
      );
      return { ...pm, ...parsed };
    });

    const group_memberships = user.group_memberships.map((gm) => {
      const parsed = parseReasonFields(
        gm.revocation_reason || gm.rejection_reason,
        gm.updated_at,
        gm.updated_by,
        gm.approval_status === 'revoked'
          ? 'revoked'
          : gm.approval_status === 'rejected'
            ? 'rejected'
            : undefined,
      );
      return { ...gm, ...parsed };
    });

    return { ...user, platform_memberships, group_memberships };
  }
}
