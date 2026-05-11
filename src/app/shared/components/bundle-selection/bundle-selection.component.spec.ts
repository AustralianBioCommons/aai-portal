import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BundleSelectionComponent } from './bundle-selection.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BIOCOMMONS_BUNDLES } from '../../../core/constants/constants';

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
      bundle: '',
      reason: [
        { value: '', disabled: true },
        [Validators.required, Validators.maxLength(255)],
      ],
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
    expect(component.showReasonModal()).toBe(true);
    expect(component.modalBundleId()).toBe('tsi');

    component.reasonControl.setValue('Need access for research');
    component.saveReason();

    expect(component.form().get('bundle')?.value).toBe('tsi');
    expect(component.showReasonModal()).toBe(false);
  });

  it('should toggle bundle selection off when clicking same bundle', () => {
    component.toggleBundle('tsi');
    component.reasonControl.setValue('Need access for research');
    component.saveReason();
    expect(component.form().get('bundle')?.value).toBe('tsi');

    component.toggleBundle('tsi');
    expect(component.form().get('bundle')?.value).toBe('');
  });

  it('should return selected bundle object', () => {
    component.toggleBundle('tsi');
    component.reasonControl.setValue('Need access for research');
    component.saveReason();

    const selectedBundle = component.getSelectedBundle();
    expect(selectedBundle?.id).toBe('tsi');
    expect(selectedBundle?.name).toBe('Threatened Species Initiative (TSI)');
  });

  it('should not toggle disabled bundle', () => {
    component.toggleBundle('fungi');
    expect(component.form().get('bundle')?.value).toBe('');
  });

  it('should select SBP bundle without requiring a reason and show institutional email modal', () => {
    component.toggleBundle('sbp_bundle');

    expect(component.form().get('bundle')?.value).toBe('sbp_bundle');
    expect(component.form().get('reason')?.value).toBe('');
    expect(component.reasonControl.disabled).toBe(true);
    expect(component.showInstitutionalEmailModal()).toBe(true);
    expect(component.showReasonModal()).toBe(false);
  });

  it('should toggle SBP bundle selection off without requiring a reason', () => {
    component.toggleBundle('sbp_bundle');
    component.toggleBundle('sbp_bundle');

    expect(component.form().get('bundle')?.value).toBe('');
    expect(component.form().get('reason')?.value).toBe('');
    expect(component.reasonControl.disabled).toBe(true);
  });

  it('should unselect SBP bundle when institutional email modal is canceled', () => {
    component.toggleBundle('sbp_bundle');

    component.cancelInstitutionalEmailModal();

    expect(component.form().get('bundle')?.value).toBe('');
    expect(component.form().get('reason')?.value).toBe('');
    expect(component.reasonControl.disabled).toBe(true);
    expect(component.showInstitutionalEmailModal()).toBe(false);
  });

  it('should not save reason if validation fails', () => {
    component.toggleBundle('tsi');
    expect(component.showReasonModal()).toBe(true);

    component.saveReason();

    expect(component.showReasonModal()).toBe(true);
    expect(component.form().get('bundle')?.value).toBe('');
  });

  it('should cancel new bundle selection when canceling modal', () => {
    component.toggleBundle('tsi');
    expect(component.showReasonModal()).toBe(true);

    component.cancelReason();

    expect(component.showReasonModal()).toBe(false);
    expect(component.form().get('bundle')?.value).toBe('');
  });

  it('should allow editing reason for already selected bundle', () => {
    component.toggleBundle('tsi');
    component.reasonControl.setValue('Initial reason');
    component.saveReason();
    expect(component.form().get('bundle')?.value).toBe('tsi');
    expect(component.form().get('reason')?.value).toBe('Initial reason');

    const mockEvent = new MouseEvent('click');
    spyOn(mockEvent, 'stopPropagation');
    component.openReasonModal(mockEvent);

    expect(component.showReasonModal()).toBe(true);
    expect(mockEvent.stopPropagation).toHaveBeenCalled();

    component.reasonControl.setValue('Updated reason');
    component.saveReason();

    expect(component.form().get('bundle')?.value).toBe('tsi');
    expect(component.form().get('reason')?.value).toBe('Updated reason');
  });

  it('should restore original reason when canceling edit modal', () => {
    component.toggleBundle('tsi');
    component.reasonControl.setValue('Initial reason');
    component.saveReason();
    expect(component.form().get('reason')?.value).toBe('Initial reason');

    const mockEvent = new MouseEvent('click');
    component.openReasonModal(mockEvent);

    component.reasonControl.setValue('Changed in modal');
    component.cancelReason();

    expect(component.form().get('bundle')?.value).toBe('tsi');
    expect(component.form().get('reason')?.value).toBe('Initial reason');
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
