import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { BIOCOMMONS_BUNDLES, Bundle } from '../../../core/constants/constants';
import {
  BundleSelectionComponent,
  BundleSelections,
} from '../../../shared/components/bundle-selection/bundle-selection.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroArrowLeft } from '@ng-icons/heroicons/outline';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { TooltipComponent } from '../../../shared/components/tooltip/tooltip.component';

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

  bundleForm: FormGroup = this.formBuilder.nonNullable.group({
    bundles: new FormControl<BundleSelections>({} as BundleSelections, {
      nonNullable: true,
    }),
  });

  errorAlert = signal<string | null>(null);
  bundles = signal<Bundle[]>(BIOCOMMONS_BUNDLES);
  isSubmitting = signal<boolean>(false);
  isLoading = signal<boolean>(true);
  selected = signal<BundleSelections>({});

  ngOnInit() {
    this.loadCurrentBundles();
    this.bundleForm.get('bundles')?.valueChanges.subscribe((selected) => {
      this.selected.set(selected || {});
    });
  }

  getSelectedBundles(): Bundle[] {
    const selections = this.selected();
    return this.bundles().filter((bundle) => bundle.id in selections);
  }

  submit() {
    const selections =
      (this.bundleForm.getRawValue().bundles as BundleSelections) || {};
    if (!Object.keys(selections).length) {
      return;
    }

    this.isSubmitting.set(true);
    const groups = Object.entries(selections).map(([bundleId, reason]) => ({
      group_id: `biocommons/group/${bundleId}`,
      request_reason: reason || '',
    }));

    this.apiService.requestGroupAccess(groups).subscribe({
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
