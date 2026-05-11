import { Component, computed, input, signal } from '@angular/core';
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

interface BundleModalText {
  title: string;
  description: string;
  primaryButtonText: string;
  notice?: string;
}

const DEFAULT_REASON_MODAL_TEXT: BundleModalText = {
  title: 'Reason for request',
  description:
    'To proceed, please provide a brief reason for your request. The bundle manager will review it shortly.',
  primaryButtonText: 'Save',
};

const BUNDLE_MODAL_TEXT_BY_BUNDLE_ID: Record<string, BundleModalText> = {
  tsi: {
    title: 'Reason for request',
    description:
      'To proceed, please provide a brief reason for your request. The bundle manager will review it shortly.',
    primaryButtonText: 'Save',
    notice:
      'Please note: Only <a href="https://bioplatforms.com/project/threatened-species/" target="_blank" rel="noopener noreferrer" class="font-semibold text-yellow-800 underline hover:text-yellow-700">TSI Consortium</a> members are eligible to apply for this bundle.',
  },
  sbp_bundle: {
    title: 'Institutional email required',
    description:
      'Only those with an Australian institutional email address are eligible for this bundle. Please use your institutional email before proceeding.',
    primaryButtonText: 'Add',
  },
};

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

  modalBundleId = signal<string | null>(null);

  modalBundle = computed(() => {
    const bundleId = this.modalBundleId();
    return this.bundles().find((bundle) => bundle.id === bundleId);
  });
  modalRequiresReason = computed(() => {
    const bundle = this.modalBundle();
    return bundle ? this.requiresReason(bundle) : false;
  });
  modalText = computed(() => {
    const bundleId = this.modalBundleId();
    return (
      (bundleId && BUNDLE_MODAL_TEXT_BY_BUNDLE_ID[bundleId]) ||
      DEFAULT_REASON_MODAL_TEXT
    );
  });
  modalTitle = computed(() => this.modalText().title);
  modalDescription = computed(() => this.modalText().description);
  modalPrimaryButtonText = computed(() => this.modalText().primaryButtonText);
  modalNotice = computed(() => this.modalText().notice);

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
    const bundle = this.bundles().find((candidate) => candidate.id === value);
    if (!bundle) {
      return;
    }

    if (this.hasBundleModal(bundle) || this.requiresReason(bundle)) {
      this.openBundleModal(bundle);
      return;
    }

    this.selectBundleWithoutReason(bundle.id);
  }

  selectBundleWithoutReason(value: string) {
    this.form().patchValue({ bundle: value, reason: '' });
    this.savedReason.set('');
    this.reasonControl.disable();
    this.reasonControl.markAsUntouched();
    this.reasonControl.markAsPristine();
  }

  openBundleModal(bundle: Bundle) {
    this.modalBundleId.set(bundle.id);
    this.originalReason.set(this.reasonControl.value || '');

    if (this.requiresReason(bundle)) {
      this.reasonControl.enable();
    } else {
      this.selectBundleWithoutReason(bundle.id);
    }
  }

  confirmModal() {
    if (this.modalRequiresReason()) {
      this.saveReason();
      return;
    }

    this.closeModal();
  }

  cancelModal() {
    if (!this.modalRequiresReason()) {
      const bundleId = this.modalBundleId();
      if (bundleId && this.form().get('bundle')?.value === bundleId) {
        this.form().patchValue({ bundle: '', reason: '' });
        this.savedReason.set('');
        this.reasonControl.disable();
        this.reasonControl.markAsUntouched();
        this.reasonControl.markAsPristine();
      }

      this.closeModal();
      return;
    }

    this.cancelReason();
  }

  openReasonModal(event: Event) {
    event.stopPropagation();
    const currentBundle = this.form().get('bundle')?.value;
    const bundle = this.bundles().find(
      (candidate) => candidate.id === currentBundle,
    );
    if (bundle && this.requiresReason(bundle)) {
      this.openBundleModal(bundle);
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
    this.closeModal();
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

    this.closeModal();
  }

  closeModal() {
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
    return !!bundle.requireReason;
  }

  hasBundleModal(bundle: Bundle) {
    return !!BUNDLE_MODAL_TEXT_BY_BUNDLE_ID[bundle.id];
  }
}
