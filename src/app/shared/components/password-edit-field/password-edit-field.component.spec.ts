import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasswordEditFieldComponent } from './password-edit-field.component';

describe('PasswordEditFieldComponent', () => {
  let component: PasswordEditFieldComponent;
  let fixture: ComponentFixture<PasswordEditFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasswordEditFieldComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PasswordEditFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
