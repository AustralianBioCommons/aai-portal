import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BundleSelectionComponent } from './bundle-selection.component';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BIOCOMMONS_BUNDLES, Bundle } from '../../../core/constants/constants';

describe('BundleSelectionComponent', () => {
  let component: BundleSelectionComponent;
  let fixture: ComponentFixture<BundleSelectionComponent>;
  let bundleForm: FormGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BundleSelectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BundleSelectionComponent);
    component = fixture.componentInstance;
    const fb = new FormBuilder();
    bundleForm = fb.group({
      bundles: [{} as Record<string, string>],
    });
    fixture.componentRef.setInput('form', bundleForm);
    fixture.componentRef.setInput('bundles', BIOCOMMONS_BUNDLES);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should select bundle', () => {
    component.toggleBundle('tsi');
    expect(component.modalBundleId()).toBe('tsi');

    component.reasonControl.setValue('Need access for research');
    component.saveReason();

    expect(component.selectedBundles()).toEqual({
      tsi: 'Need access for research',
    });
    expect(component.form().get('bundles')?.value).toEqual({
      tsi: 'Need access for research',
    });
    expect(component.modalBundleId()).toBeNull();
  });

  it('should use bundle-specific reason modal text', () => {
    component.toggleBundle('tsi');

    expect(component.modalTitle()).toBe('Reason for request');
    expect(component.modalDescription()).toBe(
      'To proceed, please provide a brief reason for your request. The bundle manager will review it shortly.',
    );
    expect(component.modalPrimaryButtonText()).toBe('Save');
    expect(component.modalNotice()).toBe(
      'Please note: Only <a href="https://bioplatforms.com/project/threatened-species/" target="_blank" rel="noopener noreferrer" class="font-semibold text-yellow-800 underline hover:text-yellow-700">TSI Consortium</a> members are eligible to apply for this bundle.',
    );
  });

  it('should toggle bundle selection off when clicking same bundle', () => {
    component.toggleBundle('tsi');
    component.reasonControl.setValue('Need access for research');
    component.saveReason();
    expect(component.selectedBundles()).toEqual({
      tsi: 'Need access for research',
    });

    component.toggleBundle('tsi');
    expect(component.selectedBundles()).toEqual({});
  });

  it('should not toggle disabled bundle', () => {
    component.toggleBundle('fungi');
    expect(component.selectedBundles()).toEqual({});
  });

  it('should select SBP bundle without requiring a reason and show institutional email modal', () => {
    component.toggleBundle('sbp_bundle');

    expect(component.selectedBundles()).toEqual({});
    expect(component.reasonControl.disabled).toBe(true);
    expect(component.modalBundleId()).toBe('sbp_bundle');
    expect(component.modalRequiresReason()).toBe(false);
    expect(component.modalTitle()).toBe('Institutional email required');
    expect(component.modalDescription()).toBe(
      'Only those with an Australian institutional email address are eligible for this bundle. Please use your institutional email before proceeding.',
    );
    expect(component.modalPrimaryButtonText()).toBe('Add');

    component.confirmModal();

    expect(component.selectedBundles()).toEqual({ sbp_bundle: '' });
  });

  it('should select a bundle without opening a modal when requireReason is false', () => {
    const noReasonBundle: Bundle = {
      id: 'no_reason',
      name: 'No Reason Bundle',
      logoUrls: [],
      requireReason: false,
      listItems: [],
    };
    fixture.componentRef.setInput('bundles', [
      ...BIOCOMMONS_BUNDLES,
      noReasonBundle,
    ]);

    component.toggleBundle('no_reason');

    expect(component.selectedBundles()).toEqual({ no_reason: '' });
    expect(component.form().get('bundles')?.value).toEqual({ no_reason: '' });
    expect(component.reasonControl.disabled).toBe(true);
    expect(component.modalBundleId()).toBeNull();
  });

  it('should allow multiple selected bundles with independent reasons', () => {
    const noReasonBundle: Bundle = {
      id: 'no_reason',
      name: 'No Reason Bundle',
      logoUrls: [],
      requireReason: false,
      listItems: [],
    };
    fixture.componentRef.setInput('bundles', [
      ...BIOCOMMONS_BUNDLES,
      noReasonBundle,
    ]);

    component.toggleBundle('no_reason');
    component.toggleBundle('tsi');
    component.reasonControl.setValue('Need access for research');
    component.saveReason();

    expect(component.selectedBundles()).toEqual({
      no_reason: '',
      tsi: 'Need access for research',
    });
  });

  it('should toggle SBP bundle selection off without requiring a reason', () => {
    component.toggleBundle('sbp_bundle');
    component.confirmModal();
    component.toggleBundle('sbp_bundle');

    expect(component.selectedBundles()).toEqual({});
    expect(component.reasonControl.disabled).toBe(true);
  });

  it('should unselect SBP bundle when institutional email modal is canceled', () => {
    component.toggleBundle('sbp_bundle');

    component.cancelModal();

    expect(component.selectedBundles()).toEqual({});
    expect(component.reasonControl.disabled).toBe(true);
    expect(component.modalBundleId()).toBeNull();
  });

  it('should not save reason if validation fails', () => {
    component.toggleBundle('tsi');
    expect(component.modalBundleId()).toBe('tsi');

    component.saveReason();

    expect(component.modalBundleId()).toBe('tsi');
    expect(component.selectedBundles()).toEqual({});
  });

  it('should cancel new bundle selection when canceling modal', () => {
    component.toggleBundle('tsi');
    expect(component.modalBundleId()).toBe('tsi');

    component.cancelReason();

    expect(component.modalBundleId()).toBeNull();
    expect(component.selectedBundles()).toEqual({});
  });

  it('should allow editing reason for already selected bundle', () => {
    component.toggleBundle('tsi');
    component.reasonControl.setValue('Initial reason');
    component.saveReason();
    expect(component.selectedBundles()).toEqual({ tsi: 'Initial reason' });

    component.openBundleModal(BIOCOMMONS_BUNDLES[0]);

    expect(component.modalBundleId()).toBe('tsi');

    component.reasonControl.setValue('Updated reason');
    component.saveReason();

    expect(component.selectedBundles()).toEqual({ tsi: 'Updated reason' });
  });

  it('should restore original reason when canceling edit modal', () => {
    component.toggleBundle('tsi');
    component.reasonControl.setValue('Initial reason');
    component.saveReason();
    expect(component.selectedBundles()).toEqual({ tsi: 'Initial reason' });

    component.openBundleModal(BIOCOMMONS_BUNDLES[0]);

    component.reasonControl.setValue('Changed in modal');
    component.cancelReason();

    expect(component.selectedBundles()).toEqual({ tsi: 'Initial reason' });
  });

  describe('Bundle Item Click Handler', () => {
    it('should stop propagation when clicking anchor element', () => {
      const mockAnchor = document.createElement('a');
      const mockEvent = new MouseEvent('click');
      Object.defineProperty(mockEvent, 'target', {
        value: mockAnchor,
        enumerable: true,
      });
      spyOn(mockEvent, 'stopPropagation');

      component.onBundleItemClick(mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should not stop propagation for non-anchor elements', () => {
      const mockDiv = document.createElement('div');
      const mockEvent = new MouseEvent('click');
      Object.defineProperty(mockEvent, 'target', {
        value: mockDiv,
        enumerable: true,
      });
      spyOn(mockEvent, 'stopPropagation');

      component.onBundleItemClick(mockEvent);

      expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
    });
  });
});
