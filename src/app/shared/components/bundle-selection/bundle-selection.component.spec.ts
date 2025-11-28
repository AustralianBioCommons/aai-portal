import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BundleSelectionComponent } from './bundle-selection.component';

describe('BundleSelectionComponent', () => {
  let component: BundleSelectionComponent;
  let fixture: ComponentFixture<BundleSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BundleSelectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BundleSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
