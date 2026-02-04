import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import {
  FormControl,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { usernameRequirements } from '../../../shared/validators/usernames';
import { ValidationService } from '../../../core/services/validation.service';
import {
  ApiService,
  BiocommonsUserDetails,
  Status,
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
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroArrowLeft,
  heroCheckCircle,
  heroChevronDown,
  heroEllipsisHorizontal,
  heroEnvelope,
  heroTrash,
  heroArrowUturnLeft as heroUturnLeft,
  heroXCircle,
  heroUser,
} from '@ng-icons/heroicons/outline';

// Define the structure for an action
interface StatusAction {
  label: string;
  icon: string;
  onClick: (id: string, name?: string) => void;
  class?: string;
}

interface ActionModalData {
  action: 'revoke' | 'reject' | 'delete';
  type: 'platform' | 'group' | 'user';
  id: string;
  name: string;
  email: string;
}

type UserModal = 'username';

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
    NgIcon,
  ],
  providers: [DatePipe],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.css',
  viewProviders: [
    provideIcons({
      heroArrowLeft,
      heroCheckCircle,
      heroChevronDown,
      heroEnvelope,
      heroEllipsisHorizontal,
      heroXCircle,
      heroTrash,
      heroUturnLeft,
      heroUser,
    }),
  ],
})
export class UserDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly datePipe = inject(DatePipe);
  private readonly formBuilder = inject(FormBuilder);
  private readonly validationService = inject(ValidationService);

  protected readonly platforms = PLATFORMS;
  protected readonly bundles = BIOCOMMONS_BUNDLES;
  // Map from current approval state to the actions admins can take
  protected readonly GROUP_ACTIONS: Readonly<Record<Status, StatusAction[]>> = {
    pending: [
      {
        label: 'Approve',
        icon: 'heroCheckCircle',
        onClick: (id) => this.approveGroup(id),
      },
      {
        label: 'Reject',
        icon: 'heroXCircle',
        onClick: (id, name) => this.rejectGroup(id, name!),
      },
    ],
    approved: [
      {
        label: 'Revoke',
        icon: 'heroXCircle',
        onClick: (id, name) => this.revokeGroup(id, name!),
      },
    ],
    revoked: [
      {
        label: 'Approve',
        icon: 'heroCheckCircle',
        onClick: (id) => this.approveGroup(id),
      },
    ],
    rejected: [
      {
        label: 'Unreject',
        icon: 'heroUturnLeft',
        onClick: (id) => this.unrejectGroup(id),
      },
    ],
  };

  protected readonly PLATFORM_ACTIONS: Readonly<
    Record<Status, StatusAction[]>
  > = {
    pending: [
      {
        label: 'Approve',
        icon: 'heroCheckCircle',
        onClick: (id) => this.approvePlatform(id as PlatformId),
      },
      {
        label: 'Reject',
        icon: 'heroXCircle',
        // TODO: not implemented yet
        onClick: () => null,
      },
    ],
    approved: [
      {
        label: 'Revoke',
        icon: 'heroXCircle',
        onClick: (id) => this.revokePlatform(id as PlatformId),
      },
    ],
    revoked: [
      {
        label: 'Approve',
        icon: 'heroCheckCircle',
        onClick: (id) => this.approvePlatform(id as PlatformId),
      },
    ],
    rejected: [
      {
        label: 'Approve',
        icon: 'heroCheckCircle',
        onClick: (id) => this.approvePlatform(id as PlatformId),
      },
    ],
  };

  // State signals
  user = signal<BiocommonsUserDetails | null>(null);
  pageLoading = signal(true);
  pageError = signal<string | null>(null);
  alert = signal<{ type: 'success' | 'error'; message: string } | null>(null);
  returnUrl = signal<string>('/all-users');
  profileImageLoaded = signal(false);

  openMenuAction = signal(false);
  openMenuGroupId = signal<string | null>(null);
  openMenuPlatformId = signal<string | null>(null);

  adminType = this.authService.adminType;
  adminPlatforms = this.authService.adminPlatforms;
  adminGroups = this.authService.adminGroups;

  actionModalData = signal<ActionModalData | null>(null);

  // Form control
  reasonControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(255)],
  });

  // Username update form and modal
  usernameForm = this.formBuilder.nonNullable.group({
    username: ['', usernameRequirements],
  });
  activeModal = signal<UserModal | null>(null);
  modalLoading = signal(false);

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    const stateReturnUrl =
      navigation?.extras?.state?.['returnUrl'] || history.state?.returnUrl;
    if (stateReturnUrl) {
      this.returnUrl.set(stateReturnUrl);
    }

    this.usernameForm.get('username')?.valueChanges.subscribe(() => {
      if (this.validationService.hasFieldBackendError('username')) {
        this.validationService.clearFieldBackendError('username');
      }
    });

    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      this.apiService.getUserDetails(userId).subscribe({
        next: (user) => {
          this.user.set(user);
          this.pageLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load user details:', err);
          this.pageError.set('Failed to load user details');
          this.pageLoading.set(false);
        },
      });
    } else {
      this.pageError.set('No user ID provided');
      this.pageLoading.set(false);
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
    const formattedDate =
      this.datePipe.transform(updatedAt, 'MMM d y, h:mm a') || 'Unknown date';
    return `${reason || action}\n\n(${action} by ${updatedBy} on ${formattedDate})`;
  }

  canManagePlatform(platformId: string): boolean {
    if (this.adminType() === 'bundle') return false;
    return this.adminPlatforms().some((p) => p.id === platformId);
  }

  canManageGroup(groupId: string): boolean {
    if (this.adminType() === 'platform') return false;
    return this.adminGroups().some((g) => g.id === groupId);
  }

  private refreshUserDetails(userId: string) {
    this.pageLoading.set(true);
    this.apiService.getUserDetails(userId).subscribe({
      next: (user) => {
        this.user.set(user);
        this.pageLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to refresh user details:', err);
        this.pageLoading.set(false);
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

  deleteUserBegin(): void {
    this.openActionModal(
      'delete',
      'user',
      this.user()!.user_id,
      this.user()!.email,
    );
  }

  unrejectGroup(groupId: string): void {
    const userId = this.user()!.user_id;
    this.openMenuGroupId.set(null);
    this.alert.set(null);
    this.apiService.unrejectGroupAccess(userId, groupId).subscribe({
      next: () => {
        this.refreshUserDetails(userId);
        this.alert.set({
          type: 'success',
          message: 'Bundle access unrejected successfully',
        });
      },
      error: (error) => {
        console.error('Failed to unreject bundle access:', error);
        this.alert.set({
          type: 'error',
          message: 'Failed to unreject bundle access',
        });
      },
    });
  }

  protected openUsernameModal(): void {
    const user = this.user();
    if (!user) return;

    this.alert.set(null);
    this.usernameForm.reset({ username: user.username });
    this.validationService.clearFieldBackendError('username');
    this.activeModal.set('username');
  }

  protected closeUsernameModal(): void {
    this.validationService.clearFieldBackendError('username');
    this.activeModal.set(null);
  }

  protected updateUsername(): void {
    this.usernameForm.markAllAsTouched();
    if (this.usernameForm.invalid) {
      return;
    }
    const username = this.usernameForm.value.username!.trim();
    const userId = this.user()!.user_id;
    this.modalLoading.set(true);
    this.apiService.updateUserUsername(userId, username).subscribe({
      next: () => {
        this.modalLoading.set(false);
        this.alert.set({
          type: 'success',
          message: "User's username updated successfully",
        });
        this.closeUsernameModal();
        this.refreshUserDetails(userId);
      },
      error: (err) => {
        this.modalLoading.set(false);
        console.error('Failed to update username: ', err);
        this.validationService.setBackendErrorMessages(err);
        this.usernameForm.markAllAsTouched();

        if (!this.validationService.hasFieldBackendError('username')) {
          this.alert.set({
            type: 'error',
            message: err.error?.message || "Failed to update user's username",
          });
          this.closeUsernameModal();
        }
      },
    });
  }

  protected isFieldInvalid(fieldName: string): boolean {
    return this.validationService.isFieldInvalid(this.usernameForm, fieldName);
  }

  protected getErrorMessages(fieldName: string): string[] {
    return this.validationService.getErrorMessages(
      this.usernameForm,
      fieldName,
    );
  }

  private openActionModal(
    action: 'revoke' | 'reject' | 'delete',
    type: 'platform' | 'group' | 'user',
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
    const titleLookup: Record<
      ActionModalData['type'],
      Partial<Record<ActionModalData['action'], string>>
    > = {
      platform: {
        revoke: 'Do you want to revoke this user?',
        reject: 'Do you want to reject this user?',
      },
      group: {
        revoke: `Do you want to revoke this user from ${modalData!.name}?`,
        reject: 'Do you want to reject this user?',
      },
      user: {
        delete: 'Do you want to delete this user?',
      },
    };
    return titleLookup[modalData.type]![modalData.action]!;
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

    switch (modalData.type) {
      case 'platform':
        switch (modalData.action) {
          case 'revoke':
            this.confirmRevokePlatform(
              userId,
              modalData.id as PlatformId,
              reason,
            );
            return;
          default:
            console.error('Invalid action for platform:', modalData.action);
        }
        break;
      case 'group':
        switch (modalData.action) {
          case 'revoke':
            this.confirmRevokeGroup(userId, modalData.id, reason);
            return;
          case 'reject':
            this.confirmRejectGroup(userId, modalData.id, reason);
            return;
          default:
            console.error('Invalid action for group:', modalData.action);
            return;
        }
        break;
      case 'user':
        switch (modalData.action) {
          case 'delete':
            this.confirmDeleteUser(userId, reason);
            break;
          default:
            console.error('Invalid action for user:', modalData.action);
            return;
        }
    }
  }

  private confirmRejectGroup(userId: string, groupId: string, reason: string) {
    this.apiService.rejectGroupAccess(userId, groupId, reason).subscribe({
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
  }

  private confirmDeleteUser(userId: string, reason: string) {
    this.apiService.deleteUser(userId, reason).subscribe({
      next: () => {
        this.closeActionModal();
        this.alert.set({
          type: 'success',
          message: 'User deleted successfully, returning to dashboard',
        });
        setTimeout(() => this.router.navigate(['/all-users']), 2000);
      },
      error: (error) => {
        this.closeActionModal();
        console.error('Failed to delete user:', error);
        this.alert.set({
          type: 'error',
          message: 'Failed to delete user',
        });
      },
    });
  }

  private confirmRevokePlatform(
    userId: string,
    platformId: PlatformId,
    reason: string,
  ) {
    this.apiService.revokePlatformAccess(userId, platformId, reason).subscribe({
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
  }
  private confirmRevokeGroup(userId: string, groupId: string, reason: string) {
    this.apiService.revokeGroupAccess(userId, groupId, reason).subscribe({
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
