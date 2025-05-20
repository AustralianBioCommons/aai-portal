import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BpaRegistrationSuccessComponent } from './bpa-registration-success.component';

describe('RegistrationCompleteComponent', () => {
  let component: BpaRegistrationSuccessComponent;
  let fixture: ComponentFixture<BpaRegistrationSuccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BpaRegistrationSuccessComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BpaRegistrationSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
