import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BpaRegisterSelectionComponent } from './bpa-register-selection.component';

describe('BpaRegisterSelectionComponent', () => {
  let component: BpaRegisterSelectionComponent;
  let fixture: ComponentFixture<BpaRegisterSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BpaRegisterSelectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BpaRegisterSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
