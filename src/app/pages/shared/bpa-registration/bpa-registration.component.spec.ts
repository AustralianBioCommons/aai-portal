import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BpaRegistrationComponent } from './bpa-registration.component';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

describe('BpaRegistrationComponent', () => {
  let component: BpaRegistrationComponent;
  let fixture: ComponentFixture<BpaRegistrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BpaRegistrationComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(BpaRegistrationComponent);
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

  it('should validate organization selection', () => {
    const organizationsControl =
      component.registrationForm.get('organizations');

    expect(organizationsControl?.errors?.['requireCheckbox']).toBeTruthy();

    const formArray = component.registrationForm.get('organizations');
    formArray?.setValue(new Array(component.checkboxes.length).fill(false));
    formArray?.setValue([
      true,
      ...new Array(component.checkboxes.length - 1).fill(false),
    ]);

    expect(organizationsControl?.errors).toBeNull();
  });

  it('should show error messages when form is submitted with invalid data', () => {
    const submitButton = fixture.debugElement.query(
      By.css('button[type="submit"]'),
    );
    submitButton.nativeElement.click();
    fixture.detectChanges();

    const errorMessages = fixture.debugElement.queryAll(
      By.css('.text-red-500'),
    );
    expect(errorMessages.length).toBeGreaterThan(0);
  });

  it('should have valid form when all required fields are filled correctly', () => {
    const form = component.registrationForm;

    form.patchValue({
      username: 'testuser',
      fullname: 'Test User',
      email: 'test@example.com',
      reason: 'Testing purpose with valid reason',
      password: 'StrongPass123!',
      confirmPassword: 'StrongPass123!',
    });

    const organizationsArray = form.get('organizations');
    const newValue = new Array(component.checkboxes.length).fill(false);
    newValue[0] = true;
    organizationsArray?.setValue(newValue);

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
      password: 'StrongPass123!',
      confirmPassword: 'StrongPass123!',
    });

    const organizationsArray = form.get('organizations');
    const newValue = new Array(component.checkboxes.length).fill(false);
    newValue[0] = true;
    organizationsArray?.setValue(newValue);

    component.onSubmit();

    expect(console.log).toHaveBeenCalledWith(form.value);
  });
});
