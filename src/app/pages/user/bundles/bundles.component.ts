import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { BIOCOMMONS_BUNDLES, Bundle } from '../../../core/constants/constants';
import { BundleSelectionComponent } from '../../../shared/components/bundle-selection/bundle-selection.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroArrowLeft } from '@ng-icons/heroicons/outline';
import { AlertComponent } from '../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-bundles',
  imports: [
    RouterLink,
    AlertComponent,
    BundleSelectionComponent,
    ButtonComponent,
    NgIcon,
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
    selectedBundle: [''],
  });

  errorAlert = signal<string | null>(null);
  bundles = signal<Bundle[]>(BIOCOMMONS_BUNDLES);
  isSubmitting = signal<boolean>(false);

  ngOnInit() {
    this.loadCurrentBundles();
  }

  getSelectedBundle(): Bundle | undefined {
    const selectedId = this.bundleForm.get('selectedBundle')?.value;
    return this.bundles().find((bundle) => bundle.id === selectedId);
  }

  submit() {
    this.isSubmitting.set(true);
    const selectedBundle = this.bundleForm.get('selectedBundle')?.value;
    const groupId = `biocommons/group/${selectedBundle}`;

    this.apiService.requestGroupAccess(groupId).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/profile']);
      },
      error: (error) => {
        console.error(error);
        this.isSubmitting.set(false);
      },
    });
  }

  /**
   * Get the user's groups, disable any bundles that are already approved
   */
  loadCurrentBundles() {
    this.apiService.getUserGroups().subscribe({
      next: (groups) => {
        const groupsWithIds = groups.map((g) => {
          const shortId = g.group_id.replace('biocommons/group/', '');
          return { ...g, id: shortId };
        });
        console.log(groupsWithIds);
        const updatedBundles = BIOCOMMONS_BUNDLES.map((bundle) => {
          const groupStatus = groupsWithIds.find((g) => g.id === bundle.id);
          if (groupStatus?.approval_status === 'approved') {
            return { ...bundle, disabled: true };
          }
          return bundle;
        });
        this.bundles.set(updatedBundles);
      },
    });
  }
}
