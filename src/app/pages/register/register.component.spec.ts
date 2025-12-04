import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { RegisterComponent, RegistrationForm } from './register.component';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  template: '<div>Mock Login Component</div>',
})
class MockLoginComponent {}

@Component({
  template: '<div>Mock Home Component</div>',
})
class MockHomeComponent {}

class MockAuthService {}

/**
 * RegisterComponent Test Suite
 *
 * Registration Flow Sections:
 * - introduction: General information page
 * - your-details: Registration form
 * - add-bundle: Bundle selection
 * - terms: Terms & conditions
 * After submission: Success page
 */
describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'login', component: MockLoginComponent },
          { path: '', component: MockHomeComponent },
        ]),
        { provide: AuthService, useClass: MockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);

    // Prevent scroll-based section updates from running during tests
    // This keeps activeSection stable at 'introduction' (its initial value)
    component['updateActiveSection'] = jasmine.createSpy('updateActiveSection');

    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize with introduction section active', () => {
      expect(component.activeSection()).toBe('introduction');
    });

    it('should have 4 sections', () => {
      expect(component.sections.length).toBe(4);
      expect(component.sections[0].id).toBe('introduction');
      expect(component.sections[1].id).toBe('your-details');
      expect(component.sections[2].id).toBe('add-bundle');
      expect(component.sections[3].id).toBe('terms');
    });

    it('should initialize bundle field with empty selection', () => {
      expect(component.registrationForm.get('bundle')?.value).toBe('');
    });

    it('should initialize registration form with empty values', () => {
      expect(component.registrationForm.get('firstName')?.value).toBe('');
      expect(component.registrationForm.get('lastName')?.value).toBe('');
      expect(component.registrationForm.get('email')?.value).toBe('');
      expect(component.registrationForm.get('username')?.value).toBe('');
    });
  });

  describe('Section Navigation', () => {
    it('should mark introduction as visited initially', () => {
      expect(component.isSectionVisited('introduction')).toBe(true);
    });

    it('should determine if section is valid', () => {
      expect(component.isSectionValid('introduction')).toBe(true);
      expect(component.isSectionValid('your-details')).toBe(false);
      expect(component.isSectionValid('add-bundle')).toBe(true);
    });

    it('should determine if section is completed', () => {
      component.visitedSections.set(new Set(['introduction', 'your-details']));
      component.activeSection.set('add-bundle');
      expect(component.isSectionCompleted('introduction')).toBe(true);
      expect(component.isSectionCompleted('your-details')).toBe(true);
      expect(component.isSectionCompleted('add-bundle')).toBe(false);
    });
  });

  describe('Registration Form Validation', () => {
    it('should have a valid form when all fields are filled correctly', () => {
      component.registrationForm.patchValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        terms: true,
      });
      expect(component.registrationForm.valid).toBe(true);
    });

    it('should validate required fields', () => {
      const requiredControls: (keyof RegistrationForm)[] = [
        'firstName',
        'lastName',
        'email',
        'username',
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

    it('should validate email format', () => {
      const email = component.registrationForm.get('email');
      email?.setValue('invalid-email');
      email?.markAsTouched();
      expect(component.isFieldInvalid('email')).toBe(true);
      expect(component.getErrorMessages('email')).toContain(
        'Please enter a valid email address',
      );
    });

    it('should validate password pattern', () => {
      const password = component.registrationForm.get('password');
      password?.setValue('weak');
      password?.markAsTouched();
      expect(component.isFieldInvalid('password')).toBe(true);
      expect(component.getErrorMessages('password')).toContain(
        'Password must be at least 8 characters',
      );
    });

    it('should validate password confirmation match', () => {
      component.registrationForm.patchValue({
        password: 'Password123',
        confirmPassword: 'Different123',
      });
      const confirmPassword = component.registrationForm.get('confirmPassword');
      confirmPassword?.markAsTouched();
      expect(component.isFieldInvalid('confirmPassword')).toBe(true);
      expect(component.getErrorMessages('confirmPassword')).toContain(
        'Passwords do not match',
      );
    });

    it('should return empty array for fields without errors', () => {
      const firstName = component.registrationForm.get('firstName');
      firstName?.setValue('John');
      expect(component.getErrorMessages('firstName')).toEqual([]);
    });

    it('should revalidate confirmPassword when password changes', () => {
      component.registrationForm.patchValue({
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });
      component.registrationForm.get('confirmPassword')?.markAsTouched();

      expect(component.isFieldInvalid('confirmPassword')).toBe(false);

      component.registrationForm
        .get('password')
        ?.setValue('DifferentPassword123!');

      expect(component.isFieldInvalid('confirmPassword')).toBe(true);
      expect(component.getErrorMessages('confirmPassword')).toContain(
        'Passwords do not match',
      );
    });

    it('should validate combined first and last name length not exceeding 255 characters', () => {
      const longName = 'a'.repeat(200);
      component.registrationForm.patchValue({
        firstName: longName,
        lastName: longName,
      });

      expect(
        component.registrationForm.hasError('fullNameTooLong'),
      ).toBeTruthy();
    });

    it('should clear fullNameTooLong error when combined length is valid', () => {
      const longName = 'a'.repeat(200);
      component.registrationForm.patchValue({
        firstName: longName,
        lastName: longName,
      });

      expect(
        component.registrationForm.hasError('fullNameTooLong'),
      ).toBeTruthy();

      component.registrationForm.patchValue({
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(
        component.registrationForm.hasError('fullNameTooLong'),
      ).toBeFalsy();
    });
  });

  describe('Bundle Selection', () => {
    it('should select bundle', () => {
      component.toggleBundle('tsi');
      expect(component.registrationForm.get('bundle')?.value).toBe('tsi');
    });

    it('should toggle bundle selection off when clicking same bundle', () => {
      component.toggleBundle('tsi');
      expect(component.registrationForm.get('bundle')?.value).toBe('tsi');

      component.toggleBundle('tsi');
      expect(component.registrationForm.get('bundle')?.value).toBe('');
    });

    it('should not toggle disabled bundle', () => {
      component.toggleBundle('fungi');
      expect(component.registrationForm.get('bundle')?.value).toBe('');
    });

    describe('Bundle Data', () => {
      it('should have correct bundle data structure', () => {
        expect(component.bundles.length).toBe(2);
        expect(component.bundles[0].id).toBe('tsi');
        expect(component.bundles[1].id).toBe('fungi');
      });

      it('should have logoUrls for each bundle', () => {
        const tsiBundle = component.bundles.find((b) => b.id === 'tsi');
        const fungiBundle = component.bundles.find((b) => b.id === 'fungi');

        expect(tsiBundle?.logoUrls.length).toBe(1);
        expect(fungiBundle?.logoUrls.length).toBe(1);
      });

      it('should have fungi bundle disabled', () => {
        const fungiBundle = component.bundles.find((b) => b.id === 'fungi');
        expect(fungiBundle?.disabled).toBe(true);
      });
    });
  });

  describe('Terms & Conditions', () => {
    it('should initialize terms field with false', () => {
      expect(component.registrationForm.get('terms')?.value).toBe(false);
    });

    it('should toggle terms acceptance', () => {
      expect(component.registrationForm.get('terms')?.value).toBe(false);
      component.toggleTermsAcceptance();
      expect(component.registrationForm.get('terms')?.value).toBe(true);
    });

    it('should toggle terms acceptance back to false', () => {
      component.registrationForm.patchValue({ terms: true });
      component.toggleTermsAcceptance();
      expect(component.registrationForm.get('terms')?.value).toBe(false);
    });

    it('should not submit with invalid terms', () => {
      component.registrationForm.patchValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        terms: false,
      });
      component.recaptchaToken.set('test-token');

      component.submitRegistration();

      expect(component.registrationForm.get('terms')?.touched).toBe(true);
      httpMock.expectNone(`${environment.auth0.backend}/biocommons/register`);
    });
  });

  describe('Registration Submission', () => {
    beforeEach(() => {
      component.registrationForm.patchValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        bundle: 'tsi',
        terms: true,
      });
      component.recaptchaToken.set('test-recaptcha-token');
    });

    it('should mark form as touched when submitted without values', () => {
      component.registrationForm.reset();
      component.submitRegistration();
      expect(component.registrationForm.get('firstName')?.touched).toBe(true);
    });

    it('should set recaptchaAttempted when submitting without reCAPTCHA', () => {
      component.recaptchaToken.set(null);
      component.submitRegistration();

      expect(component.recaptchaAttempted()).toBe(true);
      httpMock.expectNone(`${environment.auth0.backend}/biocommons/register`);
    });

    it('should make HTTP request when submitting registration', () => {
      component.submitRegistration();

      const req = httpMock.expectOne(
        `${environment.auth0.backend}/biocommons/register`,
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'Password123!',
        bundle: 'tsi',
      });

      req.flush({ success: true });
    });

    it('should complete registration successfully', () => {
      component.submitRegistration();

      const req = httpMock.expectOne(
        `${environment.auth0.backend}/biocommons/register`,
      );
      req.flush({ success: true });

      expect(component.isRegistrationComplete()).toBe(true);
      expect(component.registrationEmail()).toBe('john@example.com');
      expect(component.isSubmitting()).toBe(false);
    });

    it('should handle registration error and display error message', () => {
      component.submitRegistration();

      const req = httpMock.expectOne(
        `${environment.auth0.backend}/biocommons/register`,
      );

      req.flush(
        { message: 'Email already exists' },
        { status: 400, statusText: 'Bad Request' },
      );

      expect(component.isRegistrationComplete()).toBe(false);
      expect(component.errorAlert()).toBe('Email already exists');
      expect(component.isSubmitting()).toBe(false);
    });

    it('should surface backend errors without completing registration', () => {
      component.submitRegistration();

      const req = httpMock.expectOne(
        `${environment.auth0.backend}/biocommons/register`,
      );
      req.flush(
        { message: 'Server error' },
        { status: 500, statusText: 'Server Error' },
      );

      expect(component.isRegistrationComplete()).toBe(false);
      expect(component.errorAlert()).toBe('Server error');
      expect(component.isSubmitting()).toBe(false);
    });

    it('should handle registration without bundle', () => {
      component.registrationForm.patchValue({ bundle: '', terms: true });

      component.submitRegistration();

      const req = httpMock.expectOne(
        `${environment.auth0.backend}/biocommons/register`,
      );
      expect(req.request.body.bundle).toBeUndefined();

      req.flush({ success: true });
      expect(component.isRegistrationComplete()).toBe(true);
    });
  });

  describe('Success Page', () => {
    beforeEach(() => {
      component.isRegistrationComplete.set(true);
      component.registrationEmail.set('john@example.com');
    });

    it('should display registration complete state', () => {
      expect(component.isRegistrationComplete()).toBe(true);
      expect(component.registrationEmail()).toBe('john@example.com');
    });

    describe('Final Page Button', () => {
      it('returns BPA redirect when on BPA route', () => {
        const activatedRoute = TestBed.inject(ActivatedRoute);
        spyOn(activatedRoute.snapshot.queryParamMap, 'get').and.returnValue(
          'bpa',
        );

        const result = component.getFinalPageButton();
        expect(result.text).toContain('Bioplatforms Australia Data Portal');
      });

      it('returns Galaxy redirect when on Galaxy route', () => {
        const activatedRoute = TestBed.inject(ActivatedRoute);
        spyOn(activatedRoute.snapshot.queryParamMap, 'get').and.returnValue(
          'galaxy',
        );

        const result = component.getFinalPageButton();
        expect(result.text).toContain('Galaxy Australia');
      });

      it('defaults to login for other routes', () => {
        const activatedRoute = TestBed.inject(ActivatedRoute);
        spyOn(activatedRoute.snapshot.queryParamMap, 'get').and.returnValue(
          null,
        );

        const result = component.getFinalPageButton();
        expect(result.text).toBe('Login');
      });
    });
  });

  describe('reCAPTCHA', () => {
    it('should handle reCAPTCHA resolution', () => {
      component.resolved('test-token');
      expect(component.recaptchaToken()).toBe('test-token');
    });

    it('should handle reCAPTCHA null response', () => {
      component.resolved(null);
      expect(component.recaptchaToken()).toBeNull();
    });
  });

  describe('Bundle Item Click Handler', () => {
    it('should stop propagation when clicking anchor element', () => {
      const mockAnchor = document.createElement('a');
      const mockEvent = new MouseEvent('click');
      Object.defineProperty(mockEvent, 'target', {
        value: mockAnchor,
        enumerable: true,
      });
      spyOn(mockEvent, 'stopPropagation');

      component.onBundleItemClick(mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should not stop propagation for non-anchor elements', () => {
      const mockDiv = document.createElement('div');
      const mockEvent = new MouseEvent('click');
      Object.defineProperty(mockEvent, 'target', {
        value: mockDiv,
        enumerable: true,
      });
      spyOn(mockEvent, 'stopPropagation');

      component.onBundleItemClick(mockEvent);

      expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
    });
  });
});
