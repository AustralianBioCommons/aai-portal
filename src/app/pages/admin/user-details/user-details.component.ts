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
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import {
  PLATFORMS,
  PlatformId,
  biocommonsBundles,
} from '../../../core/constants/constants';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-details',
  imports: [
    DatePipe,
    LoadingSpinnerComponent,
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
  user = signal<BiocommonsUserDetails | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  actionMenuOpen = signal(false);
  showRevokeModal = signal(false);
  alert = signal<{ type: 'success' | 'error'; message: string } | null>(null);
  returnUrl = signal<string>('/all-users');
  selectedPlatformForRevoke = signal<PlatformId | null>(null);
  openMenuMembershipId = signal<string | null>(null);
  adminPlatforms = this.authService.adminPlatforms;

  // Form controls
  revokeReasonControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
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
    return this.adminPlatforms().some((p) => p.id === platformId);
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
    // TODO: Implement API call to approve group membership
    console.log('Approve group membership:', membershipId);
  }

  rejectGroupMembership(membershipId: string): void {
    this.openMenuMembershipId.set(null);
    // TODO: Implement API call to reject group membership
    console.log('Reject group membership:', membershipId);
  }

  revokeGroupMembership(membershipId: string): void {
    this.openMenuMembershipId.set(null);
    // TODO: Implement API call to revoke group membership
    console.log('Revoke group membership:', membershipId);
  }

  togglePlatformApproval(platformId: PlatformId, currentStatus: string) {
    if (currentStatus === 'approved') {
      this.openRevokeModal(platformId);
    } else {
      this.approvePlatform(platformId);
    }
  }

  openRevokeModal(platformId: PlatformId): void {
    this.selectedPlatformForRevoke.set(platformId);
    this.revokeReasonControl.reset();
    this.showRevokeModal.set(true);
  }

  closeRevokeModal(): void {
    this.showRevokeModal.set(false);
    this.revokeReasonControl.reset();
    this.selectedPlatformForRevoke.set(null);
  }

  confirmRevokePlatformAccess(): void {
    const platformId = this.selectedPlatformForRevoke();
    this.revokeReasonControl.markAsTouched();

    if (!platformId || this.revokeReasonControl.invalid) {
      return;
    }

    const userId = this.user()!.user_id;
    const reason = this.revokeReasonControl.value.trim();
    this.alert.set(null);

    this.apiService.revokePlatformAccess(userId, platformId, reason).subscribe({
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
        this.user.set(user);
      },
      error: (err) => {
        console.error('Failed to refresh user details:', err);
      },
    });
  }
}
