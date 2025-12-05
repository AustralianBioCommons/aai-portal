import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Bundle } from '../../../core/constants/constants';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroCheck, heroPlus } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-bundle-selection',
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  templateUrl: './bundle-selection.component.html',
  styleUrl: './bundle-selection.component.css',
  viewProviders: [provideIcons({ heroCheck, heroPlus })],
})
export class BundleSelectionComponent {
  bundleForm = input.required<FormGroup>();
  bundles = input.required<Bundle[]>();

  toggleBundle(value: string) {
    const bundle = this.bundles().find((bundle) => bundle.id === value);
    if (!bundle?.disabled) {
      const currentValue = this.bundleForm().get('selectedBundle')?.value;
      if (currentValue === value) {
        this.bundleForm().patchValue({ selectedBundle: '' });
      } else {
        this.bundleForm().patchValue({ selectedBundle: value });
      }
    }
  }

  onBundleItemClick(event: Event) {
    if (event.target instanceof HTMLAnchorElement) {
      event.stopPropagation();
    }
  }

  getSelectedBundle(): Bundle | undefined {
    const selectedId = this.bundleForm().get('selectedBundle')?.value;
    return this.bundles().find((bundle) => bundle.id === selectedId);
  }

  isSelectedBundle(bundle: Bundle) {
    return bundle.id === this.bundleForm().get('selectedBundle')?.value;
  }
}
