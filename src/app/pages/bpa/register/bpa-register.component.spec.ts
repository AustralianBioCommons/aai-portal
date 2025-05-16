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
    const organizationsGroup = component.registrationForm.get('organizations');

    expect(component.registrationForm.get('username')?.value).toBe('');
    expect(component.registrationForm.get('fullname')?.value).toBe('');
    expect(component.registrationForm.get('email')?.value).toBe('');
    expect(component.registrationForm.get('reason')?.value).toBe('');
    expect(component.registrationForm.get('password')?.value).toBe('');
    expect(component.registrationForm.get('confirmPassword')?.value).toBe('');

    component.organizations.forEach((org) => {
      expect(organizationsGroup?.get(org.id)?.value).toBeFalse();
    });
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

    passwordControl?.setValue('StrongPass123');
    expect(passwordControl?.errors).toBeNull();
  });

  it('should validate password confirmation', () => {
    const form = component.registrationForm;
    form.get('password')?.setValue('StrongPass123');
    form.get('confirmPassword')?.setValue('DifferentPass123');

    expect(
      form.get('confirmPassword')?.errors?.['passwordMismatch'],
    ).toBeTruthy();

    form.get('confirmPassword')?.setValue('StrongPass123');
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
    const organizations = component.organizations.reduce(
      (acc, org) => ({
        ...acc,
        [org.id]: false,
      }),
      {},
    );

    form.patchValue({
      username: 'testuser',
      fullname: 'Test User',
      email: 'test@example.com',
      reason: 'Testing purpose',
      password: 'StrongPass123',
      confirmPassword: 'StrongPass123',
      organizations,
    });

    expect(form.valid).toBeTruthy();
  });

  it('should display error messages when fields are invalid', () => {
    const usernameControl = component.registrationForm.get('username');
    usernameControl?.markAsTouched();
    fixture.detectChanges();

    expect(component.getErrorMessage('username')).toBe(
      'This field is required',
    );
  });

  it('should console.log form value when submitted with valid data', () => {
    spyOn(console, 'log');
    const form = component.registrationForm;
    const organizations = component.organizations.reduce(
      (acc, org) => ({
        ...acc,
        [org.id]: false,
      }),
      {},
    );

    form.patchValue({
      username: 'testuser',
      fullname: 'Test User',
      email: 'test@example.com',
      reason: 'Testing purpose',
      password: 'StrongPass123',
      confirmPassword: 'StrongPass123',
      organizations,
    });

    component.onSubmit();
    expect(console.log).toHaveBeenCalledWith(form.value);
  });

  it('should scroll to first invalid field on invalid submit', () => {
    const mockElement = document.createElement('div');
    spyOn(mockElement, 'scrollIntoView');
    spyOn(document, 'getElementById').and.returnValue(mockElement);

    component.onSubmit();

    expect(document.getElementById).toHaveBeenCalled();
    expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });
  });
});
