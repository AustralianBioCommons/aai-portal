import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Bundle } from '../../../core/constants/constants';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroCheck,
  heroPlus,
  heroEye,
  heroMinus,
  heroClock,
} from '@ng-icons/heroicons/outline';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-bundle-selection',
  imports: [CommonModule, ReactiveFormsModule, NgIcon, ModalComponent],
  templateUrl: './bundle-selection.component.html',
  styleUrl: './bundle-selection.component.css',
  viewProviders: [
    provideIcons({
      heroCheck,
      heroPlus,
      heroEye,
      heroMinus,
      heroClock,
    }),
  ],
})
export class BundleSelectionComponent {
  form = input.required<FormGroup>();
  bundles = input.required<Bundle[]>();

  originalReason = signal<string>('');
  savedReason = signal<string>('');

  showReasonModal = signal(false);
  modalBundleId = signal<string | null>(null);
  showInstitutionalEmailModal = signal(false);

  get reasonControl(): FormControl<string> {
    return this.form().get('reason') as FormControl<string>;
  }

  toggleBundle(value: string) {
    const bundle = this.bundles().find((bundle) => bundle.id === value);
    if (!bundle?.disabled) {
      const currentValue = this.form().get('bundle')?.value;
      if (currentValue === value) {
        // Unselect bundle
        this.form().patchValue({ bundle: '', reason: '' });
        this.savedReason.set('');
        this.reasonControl.disable();
        this.reasonControl.markAsUntouched();
        this.reasonControl.markAsPristine();
      } else {
        this.selectBundle(value);
      }
    }
  }

  selectBundle(value: string) {
    if (value === 'sbp_bundle') {
      this.selectBundleWithoutReason(value);
      this.showInstitutionalEmailModal.set(true);
      return;
    }

    this.openReasonModalForBundle(value);
  }

  selectBundleWithoutReason(value: string) {
    this.form().patchValue({ bundle: value, reason: '' });
    this.savedReason.set('');
    this.reasonControl.disable();
    this.reasonControl.markAsUntouched();
    this.reasonControl.markAsPristine();
  }

  openReasonModalForBundle(value: string) {
    this.modalBundleId.set(value);
    this.originalReason.set(this.reasonControl.value || '');
    this.reasonControl.enable();
    this.showReasonModal.set(true);
  }

  closeInstitutionalEmailModal() {
    this.showInstitutionalEmailModal.set(false);
  }

  cancelInstitutionalEmailModal() {
    if (this.form().get('bundle')?.value === 'sbp_bundle') {
      this.form().patchValue({ bundle: '', reason: '' });
      this.savedReason.set('');
      this.reasonControl.disable();
      this.reasonControl.markAsUntouched();
      this.reasonControl.markAsPristine();
    }

    this.closeInstitutionalEmailModal();
  }

  openReasonModal(event: Event) {
    event.stopPropagation();
    const currentBundle = this.form().get('bundle')?.value;
    if (currentBundle) {
      this.modalBundleId.set(currentBundle);
      this.originalReason.set(this.reasonControl.value || '');
      this.reasonControl.enable();
      this.showReasonModal.set(true);
    }
  }

  saveReason() {
    this.reasonControl.markAsTouched();
    if (this.reasonControl.invalid) {
      return;
    }

    const bundleId = this.modalBundleId();
    if (bundleId) {
      const trimmedReason = this.reasonControl.value.trim();
      this.form().patchValue({
        bundle: bundleId,
        reason: trimmedReason,
      });
      this.savedReason.set(trimmedReason);
    }
    this.closeReasonModal();
  }

  cancelReason() {
    const currentBundle = this.form().get('bundle')?.value;
    const selectedBundle = this.modalBundleId();

    // If canceling while selecting a new bundle (not editing), unselect it
    if (selectedBundle && currentBundle !== selectedBundle) {
      this.form().patchValue({ bundle: '', reason: '' });
      this.reasonControl.disable();
      this.reasonControl.markAsUntouched();
      this.reasonControl.markAsPristine();
    } else {
      // Restore the original reason value
      this.reasonControl.setValue(this.originalReason());
    }

    this.closeReasonModal();
  }

  closeReasonModal() {
    this.showReasonModal.set(false);
    this.modalBundleId.set(null);
    this.originalReason.set('');
    this.reasonControl.markAsUntouched();
    this.reasonControl.markAsPristine();
  }

  onBundleItemClick(event: Event) {
    if (event.target instanceof HTMLAnchorElement) {
      event.stopPropagation();
    }
  }

  getSelectedBundle(): Bundle | undefined {
    const selectedId = this.form().get('bundle')?.value;
    return this.bundles().find((bundle) => bundle.id === selectedId);
  }

  isBundleSelected(bundle: Bundle) {
    return bundle.id === this.form().get('bundle')?.value;
  }

  requiresReason(bundle: Bundle) {
    return bundle.id !== 'sbp_bundle';
  }
}
