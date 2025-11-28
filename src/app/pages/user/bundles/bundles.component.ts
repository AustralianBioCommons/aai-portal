import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { biocommonsBundles, Bundle } from '../../../core/constants/constants';
import { BundleSelectionComponent } from '../../../shared/components/bundle-selection/bundle-selection.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-bundles',
  imports: [BundleSelectionComponent, ButtonComponent],
  templateUrl: './bundles.component.html',
  styleUrl: './bundles.component.css',
})
export class BundlesComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private apiService = inject(ApiService);

  bundleForm: FormGroup = this.formBuilder.nonNullable.group({
    selectedBundle: [''],
  });

  bundles = signal<Bundle[]>(biocommonsBundles);
  isSubmitting = signal<boolean>(false);

  ngOnInit() {
    this.loadCurrentBundles();
  }

  getSelectedBundle(): Bundle | undefined {
    const selectedId = this.bundleForm.get('selectedBundle')?.value;
    return this.bundles().find((bundle) => bundle.id === selectedId);
  }

  submit() {
    return true;
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
        const updatedBundles = biocommonsBundles.map((bundle) => {
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
