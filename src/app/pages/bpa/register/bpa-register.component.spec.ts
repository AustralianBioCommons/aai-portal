import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {
  BpaRegisterComponent,
  RegistrationRequest,
} from './bpa-register.component';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ValidationService } from '../../../core/services/validation.service';
import { of } from 'rxjs';

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
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({}),
            queryParams: of({}),
            snapshot: { params: {}, queryParams: {} },
          },
        },
        ValidationService,
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
      expect(component.registrationForm.get('username')?.value).toBe('');
      expect(component.registrationForm.get('fullname')?.value).toBe('');
      expect(component.registrationForm.get('email')?.value).toBe('');
      expect(component.registrationForm.get('reason')?.value).toBe('');
      expect(component.registrationForm.get('password')?.value).toBe('');
      expect(component.registrationForm.get('confirmPassword')?.value).toBe('');
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', () => {
      const requiredControls: (
        | keyof RegistrationRequest
        | 'confirmPassword'
      )[] = [
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
        expect([
          errors?.['lowercaseRequired'],
          errors?.['uppercaseRequired'],
          errors?.['numberRequired'],
          errors?.['specialCharacterRequired'],
          errors?.['minlength'],
        ]).toBeTruthy();
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

      component.recaptchaToken.set('mock-recaptcha-token');
    });

    it('should submit form successfully', fakeAsync(() => {
      component.onSubmit();

      const req = httpTestingController.expectOne(
        `${environment.auth0.backend}/bpa/register`,
      );
      expect(req.request.method).toBe('POST');
      req.flush({});

      tick();
      expect(router.navigate).toHaveBeenCalledWith(['success'], {
        relativeTo: jasmine.any(Object),
      });
    }));

    it('should handle form submission error', fakeAsync(() => {
      component.onSubmit();

      const req = httpTestingController.expectOne(
        `${environment.auth0.backend}/bpa/register`,
      );
      expect(req.request.method).toBe('POST');

      req.flush(
        { message: 'Registration failed' },
        { status: 400, statusText: 'Bad Request' },
      );

      tick();
      expect(component.errorAlert()).toBe('Registration failed');
    }));

    it('should scroll to first invalid field on invalid submit', () => {
      component.registrationForm.reset();
      component.recaptchaToken.set(null);
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

  describe('reCAPTCHA Integration', () => {
    it('should not submit form without recaptcha token', () => {
      component.registrationForm.patchValue({
        username: 'testuser',
        fullname: 'Test User',
        email: 'test@example.com',
        reason: 'Testing purpose',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass123!',
      });
      component.recaptchaToken.set(null);

      component.onSubmit();

      httpTestingController.expectNone(
        `${environment.auth0.backend}/bpa/register`,
      );
      expect(component.recaptchaAttempted()).toBe(true);
    });

    it('should handle recaptcha resolved callback', () => {
      const mockToken = 'mock-recaptcha-token';
      component.resolved(mockToken);
      expect(component.recaptchaToken()).toBe(mockToken);
    });
  });
});
