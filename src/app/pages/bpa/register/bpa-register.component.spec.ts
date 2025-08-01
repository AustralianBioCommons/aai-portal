import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { BpaRegisterComponent, RegistrationRequest } from './bpa-register.component';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

describe('BpaRegisterComponent', () => {
  let component: BpaRegisterComponent;
  let fixture: ComponentFixture<BpaRegisterComponent>;
  let httpTestingController: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BpaRegisterComponent, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: Router,
          useValue: { navigate: jasmine.createSpy('navigate') },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BpaRegisterComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('Form Initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty form fields', () => {
      const organizationsGroup =
        component.registrationForm.get('organizations');
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
  });

  describe('Form Validation', () => {
    it('should validate required fields', () => {
      const requiredControls: (keyof RegistrationRequest | "confirmPassword")[] = [
        'username',
        'fullname',
        'email',
        'reason',
        'password',
        'confirmPassword',
      ];

      requiredControls.forEach((controlName) => {
        const control = component.registrationForm.get(controlName);
        control?.markAsTouched();
        expect(control?.errors?.['required']).toBeTruthy();
        expect(component.getErrorMessages(controlName)).toContain(
          'This field is required',
        );
      });
    });

    it('should validate password format', () => {
      const passwordControl = component.registrationForm.get('password');

      const invalidPasswords = ['weak', 'onlylower', 'ONLYUPPER', '12345678'];
      invalidPasswords.forEach((password) => {
        passwordControl?.setValue(password);
        const errors = passwordControl?.errors;
        expect([errors?.['lowercaseRequired'], errors?.['uppercaseRequired'], errors?.['numberRequired'], errors?.['specialCharacterRequired'], errors?.['minlength']]).toBeTruthy();
      });

      passwordControl?.setValue('StrongPass123!');
      expect(passwordControl?.errors).toBeNull();
    });

    it('should validate password confirmation match', () => {
      const form = component.registrationForm;
      form.patchValue({
        password: 'StrongPass123',
        confirmPassword: 'DifferentPass123',
      });

      expect(
        form.get('confirmPassword')?.errors?.['passwordMismatch'],
      ).toBeTruthy();
      expect(component.getErrorMessages('confirmPassword')).toContain(
        'Passwords do not match',
      );

      form.patchValue({ confirmPassword: 'StrongPass123' });
      expect(form.get('confirmPassword')?.errors).toBeNull();
    });

    it('should validate email format', () => {
      const emailControl = component.registrationForm.get('email');
      emailControl?.setValue('invalid-email');
      expect(emailControl?.errors?.['email']).toBeTruthy();
      expect(component.getErrorMessages('email')).toContain(
        'Please enter a valid email address',
      );

      emailControl?.setValue('valid@email.com');
      expect(emailControl?.errors).toBeNull();
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      component.registrationForm.patchValue({
        username: 'testuser',
        fullname: 'Test User',
        email: 'test@example.com',
        reason: 'Testing purpose',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass123!',
      });

      const organizationsGroup =
        component.registrationForm.get('organizations');
      component.organizations.forEach((org) => {
        organizationsGroup?.get(org.id)?.setValue(false);
      });
    });

    it('should submit form successfully', fakeAsync(() => {
      component.onSubmit();

      const req = httpTestingController.expectOne(
        `${environment.auth0.backend}/bpa/register`,
      );
      expect(req.request.method).toBe('POST');
      req.flush({});

      tick();
      expect(router.navigate).toHaveBeenCalledWith([
        '/bpa/registration-success',
      ]);
    }));

    it('should handle form submission error', fakeAsync(() => {
      component.onSubmit();

      const req = httpTestingController.expectOne(
        `${environment.auth0.backend}/bpa/register`,
      );
      expect(req.request.method).toBe('POST');

      req.flush(
        { detail: 'Registration failed' },
        { status: 400, statusText: 'Bad Request' },
      );

      tick();
      expect(component.errorNotification()).toBe('Registration failed');
    }));

    it('should scroll to first invalid field on invalid submit', () => {
      component.registrationForm.reset();
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

  describe('UI Interactions', () => {
    it('should show and hide error notification', fakeAsync(() => {
      const errorMessage = 'Test error';
      component.showErrorNotification(errorMessage);
      expect(component.errorNotification()).toBe(errorMessage);

      tick(5000);
      expect(component.errorNotification()).toBeNull();
    }));

    it('should reset form', () => {
      component.registrationForm.patchValue({
        username: 'testuser',
        email: 'test@example.com',
      });

      component.resetForm();

      expect(component.registrationForm.pristine).toBeTrue();
      expect(component.registrationForm.untouched).toBeTrue();
      expect(component.registrationForm.get('username')?.value).toBe('');
      expect(component.registrationForm.get('email')?.value).toBe('');
    });
  });

  it('should revalidate confirmPassword when password changes', () => {
    component.registrationForm.patchValue({
      password: 'StrongPass123!',
      confirmPassword: 'StrongPass123!',
    });
    component.registrationForm.get('confirmPassword')?.markAsTouched();

    expect(component.isFieldInvalid('confirmPassword')).toBe(false);

    component.registrationForm.get('password')?.setValue('DifferentPass123!');

    expect(component.isFieldInvalid('confirmPassword')).toBe(true);
    expect(component.getErrorMessages('confirmPassword')).toContain(
      'Passwords do not match',
    );
  });
});
