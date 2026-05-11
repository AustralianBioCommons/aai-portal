import { Component, OnInit, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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

// Key = bundleId (presence means selected), value = reason (empty string if none)
export type BundleSelections = Record<string, string>;

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
export class BundleSelectionComponent implements OnInit {
  form = input.required<FormGroup>();
  bundles = input.required<Bundle[]>();
  selectedBundles = signal<BundleSelections>({});

  originalReason = signal<string>('');

  modalBundleId = signal<string | null>(null);
  reasonControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(255)],
  });

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

  ngOnInit(): void {
    const initialBundles =
      (this.form().get('bundles')?.value as BundleSelections | null) || {};
    this.selectedBundles.set(initialBundles);
  }

  toggleBundle(value: string) {
    const bundle = this.bundles().find((bundle) => bundle.id === value);
    if (!bundle || bundle.disabled) {
      return;
    }

    if (this.isBundleSelected(bundle)) {
      this.removeSelectedBundle(value);
    } else {
      this.selectBundle(value);
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
    this.selectedBundles.update((current) => ({ ...current, [value]: '' }));
    this.syncSelectedBundlesToForm();
    this.reasonControl.disable();
    this.reasonControl.markAsUntouched();
    this.reasonControl.markAsPristine();
  }

  openBundleModal(bundle: Bundle) {
    this.modalBundleId.set(bundle.id);
    const currentReason = this.getBundleReason(bundle);
    this.originalReason.set(currentReason);
    this.reasonControl.setValue(currentReason);
    this.reasonControl.markAsUntouched();
    this.reasonControl.markAsPristine();

    if (this.requiresReason(bundle)) {
      this.reasonControl.enable();
    } else {
      this.reasonControl.disable();
    }
  }

  confirmModal() {
    const bundleId = this.modalBundleId();
    if (!bundleId) {
      return;
    }

    if (this.modalRequiresReason()) {
      this.saveReason();
      return;
    }

    this.selectedBundles.update((current) => ({ ...current, [bundleId]: '' }));
    this.syncSelectedBundlesToForm();
    this.closeModal();
  }

  cancelModal() {
    if (!this.modalRequiresReason()) {
      this.closeModal();
      return;
    }

    this.cancelReason();
  }

  saveReason() {
    this.reasonControl.markAsTouched();
    if (this.reasonControl.invalid) {
      return;
    }

    const bundleId = this.modalBundleId();
    if (bundleId) {
      const trimmedReason = this.reasonControl.value.trim();
      this.selectedBundles.update((current) => ({
        ...current,
        [bundleId]: trimmedReason,
      }));
      this.syncSelectedBundlesToForm();
    }
    this.closeModal();
  }

  cancelReason() {
    this.reasonControl.setValue(this.originalReason());
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

  isBundleSelected(bundle: Bundle): boolean {
    return bundle.id in this.selectedBundles();
  }

  getBundleReason(bundle: Bundle): string {
    return this.selectedBundles()[bundle.id] ?? '';
  }

  requiresReason(bundle: Bundle) {
    return !!bundle.requireReason;
  }

  hasBundleModal(bundle: Bundle) {
    return !!BUNDLE_MODAL_TEXT_BY_BUNDLE_ID[bundle.id];
  }

  private removeSelectedBundle(bundleId: string): void {
    this.selectedBundles.update((current) => {
      const { [bundleId]: _, ...rest } = current;
      return rest;
    });
    if (this.modalBundleId() === bundleId) {
      this.closeModal();
    }
    this.syncSelectedBundlesToForm();
  }

  private syncSelectedBundlesToForm(): void {
    const bundlesControl = this.form().get('bundles');
    bundlesControl?.setValue(this.selectedBundles());
    bundlesControl?.markAsDirty();
  }
}
