import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Bundle } from '../../../core/constants/constants';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroCheck, heroPlus, heroEye } from '@ng-icons/heroicons/outline';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-bundle-selection',
  imports: [CommonModule, ReactiveFormsModule, NgIcon, ModalComponent],
  templateUrl: './bundle-selection.component.html',
  styleUrl: './bundle-selection.component.css',
  viewProviders: [provideIcons({ heroCheck, heroPlus, heroEye })],
})
export class BundleSelectionComponent {
  form = input.required<FormGroup>();
  bundles = input.required<Bundle[]>();

  showReasonModal = signal(false);
  modalBundleId = signal<string | null>(null);

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
        this.reasonControl.disable();
        this.reasonControl.markAsUntouched();
        this.reasonControl.markAsPristine();
      } else {
        // Select bundle - open modal
        this.modalBundleId.set(value);
        this.reasonControl.enable();
        this.showReasonModal.set(true);
      }
    }
  }

  openReasonModal(event: Event) {
    event.stopPropagation();
    const currentBundle = this.form().get('bundle')?.value;
    if (currentBundle) {
      this.modalBundleId.set(currentBundle);
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
      this.form().patchValue({
        bundle: bundleId,
        reason: this.reasonControl.value.trim(),
      });
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
    }

    this.closeReasonModal();
  }

  closeReasonModal() {
    this.showReasonModal.set(false);
    this.modalBundleId.set(null);
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
}
