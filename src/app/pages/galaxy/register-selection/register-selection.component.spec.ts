import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterSelectionComponent } from './register-selection.component';

describe('RegisterSelectionComponent', () => {
  let component: RegisterSelectionComponent;
  let fixture: ComponentFixture<RegisterSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterSelectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
