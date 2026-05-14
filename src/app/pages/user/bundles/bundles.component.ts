import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import {
  BIOCOMMONS_BUNDLES,
  Bundle,
  SBP_ALLOWED_EMAIL_DOMAINS,
} from '../../../core/constants/constants';
import { BundleSelectionComponent } from '../../../shared/components/bundle-selection/bundle-selection.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroArrowLeft } from '@ng-icons/heroicons/outline';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { TooltipComponent } from '../../../shared/components/tooltip/tooltip.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-bundles',
  imports: [
    RouterLink,
    AlertComponent,
    BundleSelectionComponent,
    ButtonComponent,
    NgIcon,
    LoadingSpinnerComponent,
    TooltipComponent,
  ],
  templateUrl: './bundles.component.html',
  styleUrl: './bundles.component.css',
  viewProviders: [provideIcons({ heroArrowLeft })],
})
export class BundlesComponent implements OnInit {
  public router = inject(Router);
  private formBuilder = inject(FormBuilder);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  bundleForm: FormGroup = this.formBuilder.nonNullable.group({
    bundle: [''],
    reason: [
      { value: '', disabled: true },
      [Validators.required, Validators.maxLength(255)],
    ],
  });

  errorAlert = signal<string | null>(null);
  bundles = signal<Bundle[]>(BIOCOMMONS_BUNDLES);
  isSubmitting = signal<boolean>(false);
  isLoading = signal<boolean>(true);
  selected = signal<Bundle | undefined>(undefined);

  ngOnInit() {
    this.loadCurrentBundles();
    // Update selected signal
    this.bundleForm.get('bundle')?.valueChanges.subscribe(() => {
      this.selected.set(this.getSelectedBundle());
      this.errorAlert.set(null);
    });
  }

  getSelectedBundle(): Bundle | undefined {
    const selectedId = this.bundleForm.get('bundle')?.value;
    return this.bundles().find((bundle) => bundle.id === selectedId);
  }

  submit() {
    const { bundle: selectedBundle, reason } = this.bundleForm.getRawValue();
    if (selectedBundle === 'sbp_workflow_execution') {
      const email = (this.authService.user()?.email ?? '').toLowerCase();
      const domain = email.slice(email.lastIndexOf('@') + 1);
      if (!(SBP_ALLOWED_EMAIL_DOMAINS as readonly string[]).includes(domain)) {
        this.errorAlert.set(
          'Your current email address is not from an authorised institutional domain. Please update your email address before requesting this bundle.',
        );
        return;
      }
    }
    this.isSubmitting.set(true);
    const groupId = `biocommons/group/${selectedBundle}`;

    this.apiService.requestGroupAccess(groupId, reason).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/profile']);
      },
      error: (error) => {
        console.log('Requesting bundle failed:', error);
        this.errorAlert.set(error?.error?.detail || 'Failed to request access');
        this.isSubmitting.set(false);
      },
    });
  }

  /**
   * Get the user's groups, disable any bundles that are already approved or pending
   */
  loadCurrentBundles() {
    this.apiService.getUserGroups().subscribe({
      next: (groups) => {
        const groupsWithIds = groups.map((g) => {
          const shortId = g.group_id.replace('biocommons/group/', '');
          return { ...g, id: shortId };
        });
        const updatedBundles = BIOCOMMONS_BUNDLES.map((bundle) => {
          const groupStatus = groupsWithIds.find((g) => g.id === bundle.id);
          if (groupStatus?.approval_status === 'approved') {
            return { ...bundle, disabled: true, approved: true };
          }
          if (groupStatus?.approval_status === 'pending') {
            return { ...bundle, disabled: true, pending: true };
          }
          return bundle;
        });
        this.bundles.set(updatedBundles);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Failed to load bundles: ', error);
      },
    });
  }
}
