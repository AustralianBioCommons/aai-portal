import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BpaRegisterComponent } from './bpa-register.component';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

describe('BpaRegisterComponent', () => {
  let component: BpaRegisterComponent;
  let fixture: ComponentFixture<BpaRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BpaRegisterComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(BpaRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with an empty form', () => {
    expect(component.registrationForm.get('username')?.value).toBe('');
    expect(component.registrationForm.get('fullname')?.value).toBe('');
    expect(component.registrationForm.get('email')?.value).toBe('');
    expect(component.registrationForm.get('reason')?.value).toBe('');
    expect(component.registrationForm.get('password')?.value).toBe('');
    expect(component.registrationForm.get('confirmPassword')?.value).toBe('');
    expect(component.registrationForm.get('organizations')?.value).toEqual(
      new Array(component.checkboxes.length).fill(false),
    );
  });

  it('should validate required fields', () => {
    const form = component.registrationForm;
    expect(form.valid).toBeFalsy();

    const requiredControls = [
      'username',
      'fullname',
      'email',
      'reason',
      'password',
      'confirmPassword',
    ];

    requiredControls.forEach((controlName) => {
      const control = form.get(controlName);
      expect(control?.errors?.['required']).toBeTruthy();
    });
  });

  it('should validate password requirements', () => {
    const passwordControl = component.registrationForm.get('password');

    passwordControl?.setValue('weak');
    expect(passwordControl?.errors?.['pattern']).toBeTruthy();

    passwordControl?.setValue('StrongPass123!');
    expect(passwordControl?.errors).toBeNull();
  });

  it('should validate password confirmation', () => {
    const form = component.registrationForm;

    form.get('password')?.setValue('StrongPass123!');
    form.get('confirmPassword')?.setValue('DifferentPass123!');

    expect(
      form.get('confirmPassword')?.errors?.['passwordMismatch'],
    ).toBeTruthy();

    form.get('confirmPassword')?.setValue('StrongPass123!');
    expect(form.get('confirmPassword')?.errors).toBeNull();
  });

  it('should validate email format', () => {
    const emailControl = component.registrationForm.get('email');

    emailControl?.setValue('invalid-email');
    expect(emailControl?.errors?.['email']).toBeTruthy();

    emailControl?.setValue('valid@email.com');
    expect(emailControl?.errors).toBeNull();
  });

  it('should have valid form when all required fields are filled correctly', () => {
    const form = component.registrationForm;

    form.patchValue({
      username: 'testuser',
      fullname: 'Test User',
      email: 'test@example.com',
      reason: 'Testing purpose with valid reason',
      password: 'StrongPass123',
      confirmPassword: 'StrongPass123',
      organizations: new Array(component.checkboxes.length).fill(false),
    });

    expect(form.valid).toBeTruthy();
  });

  it('should console.log form value when submitted with valid data', () => {
    spyOn(console, 'log');
    const form = component.registrationForm;

    form.patchValue({
      username: 'testuser',
      fullname: 'Test User',
      email: 'test@example.com',
      reason: 'Testing purpose with valid reason',
      password: 'StrongPass123',
      confirmPassword: 'StrongPass123',
      organizations: new Array(component.checkboxes.length).fill(false),
    });

    component.onSubmit();
    expect(console.log).toHaveBeenCalledWith(form.value);
  });
});
