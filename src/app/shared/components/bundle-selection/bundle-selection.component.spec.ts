import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BundleSelectionComponent } from './bundle-selection.component';
import { FormBuilder, FormGroup } from '@angular/forms';
import { biocommonsBundles } from '../../../core/constants/constants';

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
    bundleForm = fb.group({ selectedBundle: '' });
    fixture.componentRef.setInput('bundleForm', bundleForm);
    fixture.componentRef.setInput('bundles', biocommonsBundles);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should select bundle', () => {
    component.toggleBundle('tsi');
    expect(component.bundleForm().get('selectedBundle')?.value).toBe('tsi');
  });

  it('should toggle bundle selection off when clicking same bundle', () => {
    component.toggleBundle('tsi');
    expect(component.bundleForm().get('selectedBundle')?.value).toBe('tsi');

    component.toggleBundle('tsi');
    expect(component.bundleForm().get('selectedBundle')?.value).toBe('');
  });

  it('should return selected bundle object', () => {
    component.toggleBundle('tsi');
    const selectedBundle = component.getSelectedBundle();
    expect(selectedBundle?.id).toBe('tsi');
    expect(selectedBundle?.name).toBe('Threatened Species Initiative (TSI)');
  });

  it('should not toggle disabled bundle', () => {
    component.toggleBundle('fungi');
    expect(component.bundleForm().get('selectedBundle')?.value).toBe('');
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
