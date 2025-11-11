import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
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

interface RegisterComponentInternals {
  transitionToStep(step: number, options?: { fromHistory?: boolean }): void;
}

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let httpMock: HttpTestingController;
  let originalPushState: History['pushState'];
  let originalReplaceState: History['replaceState'];
  let originalBack: History['back'];
  let pushStateSpy: jasmine.Spy;
  let replaceStateSpy: jasmine.Spy;
  let backSpy: jasmine.Spy;
  let originalScrollTo: typeof window.scrollTo;

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

    originalPushState = window.history.pushState;
    originalReplaceState = window.history.replaceState;
    originalBack = window.history.back;
    pushStateSpy = spyOn(window.history, 'pushState').and.callFake(
      (): void => undefined,
    );
    replaceStateSpy = spyOn(window.history, 'replaceState').and.callFake(
      (): void => undefined,
    );
    backSpy = spyOn(window.history, 'back').and.callFake((): void => undefined);
    originalScrollTo = window.scrollTo;
    window.scrollTo = jasmine.createSpy('scrollTo') as typeof window.scrollTo;

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    pushStateSpy.calls.reset();
  });

  afterEach(() => {
    httpMock.verify();
    fixture.destroy();
    window.scrollTo = originalScrollTo;
    window.history.pushState = originalPushState;
    window.history.replaceState = originalReplaceState;
    window.history.back = originalBack;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize with step 1', () => {
      expect(component.currentStep()).toBe(1);
    });

    it('should have 6 total steps', () => {
      expect(component.totalSteps).toBe(6);
    });

    it('should initialize bundle form with empty selection', () => {
      expect(component.bundleForm.get('selectedBundle')?.value).toBe('');
    });

    it('should initialize registration form with empty values', () => {
      expect(component.registrationForm.get('firstName')?.value).toBe('');
      expect(component.registrationForm.get('lastName')?.value).toBe('');
      expect(component.registrationForm.get('email')?.value).toBe('');
      expect(component.registrationForm.get('username')?.value).toBe('');
    });
  });

  describe('Bundle Selection', () => {
    beforeEach(() => {
      component.currentStep.set(1);
      component.bundleForm.reset();
    });

    it('should select data portal galaxy bundle', () => {
      component.selectBundle('tsi');
      expect(component.bundleForm.get('selectedBundle')?.value).toBe('tsi');
      expect(component.currentStep()).toBe(2);
    });

    it('should select TSI bundle', () => {
      component.selectBundle('tsi');
      expect(component.bundleForm.get('selectedBundle')?.value).toBe('tsi');
    });

    it('should return selected bundle object', () => {
      component.selectBundle('tsi');
      const selectedBundle = component.getSelectedBundle();
      expect(selectedBundle?.id).toBe('tsi');
      expect(selectedBundle?.name).toBe('Threatened Species Initiative (TSI)');
    });

    it('should return undefined for no selection', () => {
      component.bundleForm.get('selectedBundle')?.setValue('');
      const selectedBundle = component.getSelectedBundle();
      expect(selectedBundle).toBeUndefined();
    });
  });

  describe('Step Navigation', () => {
    beforeEach(() => {
      component.currentStep.set(1);
      component.bundleForm.reset();
      component.registrationForm.reset();
    });

    it('should not proceed from step 1 without bundle selection', () => {
      component.nextStep();
      expect(component.currentStep()).toBe(2);
      expect(component.bundleForm.get('selectedBundle')?.touched).toBe(false);
    });

    it('should proceed from step 1 with valid bundle selection', () => {
      component.selectBundle('tsi');
      expect(component.currentStep()).toBe(2);
    });

    it('should not proceed from step 2 with invalid registration form', () => {
      component.selectBundle('tsi');
      component.registrationForm.reset();

      component.nextStep();
      expect(component.currentStep()).toBe(2);
      expect(component.registrationForm.get('firstName')?.touched).toBe(true);
    });

    it('should proceed from step 2 with valid registration form', () => {
      component.selectBundle('tsi');

      component.registrationForm.patchValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

      component.recaptchaToken.set('test-recaptcha-token');

      component.nextStep();
      expect(component.currentStep()).toBe(3);
    });

    it('should not proceed from step 2 without reCAPTCHA completion', () => {
      component.selectBundle('tsi');

      component.registrationForm.patchValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

      component.recaptchaToken.set(null);

      component.nextStep();
      expect(component.currentStep()).toBe(2);
      expect(component.recaptchaAttempted()).toBe(true);
    });

    it('should go back from step 2 to step 1', () => {
      component.selectBundle('tsi');
      component.prevStep();
      expect(component.currentStep()).toBe(1);
      expect(backSpy).toHaveBeenCalled();
    });

    it('should not proceed from step 3 with invalid terms form', () => {
      component.bundleForm.patchValue({ selectedBundle: 'tsi' });
      component.currentStep.set(4);
      component['initializeTermsForm']();

      component.nextStep();
      expect(component.currentStep()).toBe(4);
      expect(component.termsForm.get('biocommonsAccess')?.touched).toBe(true);
      
      // Verify no HTTP requests were made
      httpMock.expectNone(`${environment.auth0.backend}/biocommons/register`);
    });

    it('should proceed from step 3 with accepted terms', () => {
      component.bundleForm.patchValue({ selectedBundle: 'tsi' });
      component.currentStep.set(4);
      // Setup valid registration form so we can complete all steps
      component.registrationForm.patchValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });
      component['initializeTermsForm']();

      component.termsForm.patchValue({
        biocommonsAccess: true,
        tsi: true,
        fgenesh: true,
      });

      component.nextStep();
      expect(component.currentStep()).toBe(5);
      
      // Verify no HTTP requests were made yet (only when we advance from step 5)
      httpMock.expectNone(`${environment.auth0.backend}/biocommons/register`);
    });

    it('should complete registration and advance to final step', () => {
      // Setup valid forms
      component.bundleForm.patchValue({ selectedBundle: 'tsi' });
      component.registrationForm.patchValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

      component.currentStep.set(5);
      component.nextStep();

      // Expect HTTP request to be made
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

      // Simulate successful response
      req.flush({ success: true });

      expect(component.currentStep()).toBe(6);
      expect(component.isSubmitting()).toBe(false);
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      component.registrationForm.reset();
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
  });

  describe('Terms Form', () => {
    beforeEach(() => {
      component.currentStep.set(1);
      component.bundleForm.reset();
      component.selectBundle('tsi');
      component['initializeTermsForm']();
    });

    it('should initialize terms form based on selected bundle', () => {
      expect(component.termsForm.get('biocommonsAccess')).toBeTruthy();
      expect(component.termsForm.get('tsi')).toBeTruthy();
    });

    it('should toggle terms acceptance', () => {
      expect(component.termsForm.get('biocommonsAccess')?.value).toBe(false);
      component.toggleTermsAcceptance('biocommonsAccess');
      expect(component.termsForm.get('biocommonsAccess')?.value).toBe(true);
    });

    it('should toggle terms acceptance back to false', () => {
      component.termsForm.get('biocommonsAccess')?.setValue(true);
      component.toggleTermsAcceptance('biocommonsAccess');
      expect(component.termsForm.get('biocommonsAccess')?.value).toBe(false);
    });

    it('should initialize TSI terms form correctly', () => {
      component.selectBundle('tsi');
      component['initializeTermsForm']();

      expect(component.termsForm.get('biocommonsAccess')).toBeTruthy();
      expect(component.termsForm.get('tsi')).toBeTruthy();
      expect(component.termsForm.get('fgenesh')).toBeTruthy();
    });
  });

  describe('Bundles configuration', () => {
    it('should include Fgenesh++ terms for the TSI bundle with the expected URL', () => {
      const tsiBundle = component.bundles.find((bundle) => bundle.id === 'tsi');
      const fgeneshService = tsiBundle?.services.find(
        (service) => service.id === 'fgenesh',
      );

      expect(tsiBundle).toBeTruthy();
      expect(fgeneshService).toBeTruthy();
      expect(fgeneshService?.termsTitle).toBe('Fgenesh++ Terms and Conditions');
      expect(fgeneshService?.termsUrl).toBe(
        'https://site.usegalaxy.org.au/fgenesh-terms.html',
      );
    });
  });

  describe('History integration', () => {
    it('should record initial step with replaceState', () => {
      expect(replaceStateSpy).toHaveBeenCalled();
      const [stateArg] = replaceStateSpy.calls.mostRecent().args as [
        Record<string, unknown>,
      ];
      expect(stateArg).toEqual(jasmine.objectContaining({ step: 1 }));
    });

    it('should push history when advancing to step 2', () => {
      component.selectBundle('tsi');
      expect(pushStateSpy).toHaveBeenCalled();
      const [stateArg] = pushStateSpy.calls.mostRecent().args as [
        Record<string, unknown>,
      ];
      expect(stateArg).toEqual(jasmine.objectContaining({ step: 2 }));
    });

    it('should push history when advancing to step 3', () => {
      component.selectBundle('tsi');
      component.registrationForm.patchValue({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        username: 'janedoe',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });
      component.recaptchaToken.set('token');
      pushStateSpy.calls.reset();
      component.nextStep();
      expect(component.currentStep()).toBe(3);
      const [stateArg] = pushStateSpy.calls.mostRecent().args as [
        Record<string, unknown>,
      ];
      expect(stateArg).toEqual(jasmine.objectContaining({ step: 3 }));
    });

    it('should respond to browser popstate events', () => {
      component.selectBundle('tsi');
      expect(component.currentStep()).toBe(2);
      pushStateSpy.calls.reset();
      window.dispatchEvent(
        new PopStateEvent('popstate', { state: { step: 1 } }),
      );
      expect(component.currentStep()).toBe(1);
      expect(pushStateSpy).not.toHaveBeenCalled();
    });

    it('should navigate to parent route when going back from first step', () => {
      const router = TestBed.inject(Router);
      const activatedRoute = TestBed.inject(ActivatedRoute);
      const navigateSpy = spyOn(router, 'navigate').and.stub();
      component.prevStep();
      expect(navigateSpy).toHaveBeenCalledWith(['../'], {
        relativeTo: activatedRoute,
      });
    });
  });

  describe('transitionToStep edge cases', () => {
    const asInternals = (
      instance: RegisterComponent,
    ): RegisterComponentInternals =>
      instance as unknown as RegisterComponentInternals;

    it('should ignore transition when target step matches current step', () => {
      component.selectBundle('bpa_galaxy');
      pushStateSpy.calls.reset();
      asInternals(component).transitionToStep(2);
      expect(component.currentStep()).toBe(2);
      expect(pushStateSpy).not.toHaveBeenCalled();
    });

    it('should clamp transition to the final step when target exceeds total', () => {
      component.currentStep.set(4);
      pushStateSpy.calls.reset();
      asInternals(component).transitionToStep(10);
      expect(component.currentStep()).toBe(component.totalSteps);
      const [stateArg] = pushStateSpy.calls.mostRecent().args as [
        Record<string, unknown>,
      ];
      expect(stateArg).toEqual(
        jasmine.objectContaining({ step: component.totalSteps }),
      );
    });

    it('should skip history updates when sourced from history', () => {
      pushStateSpy.calls.reset();
      asInternals(component).transitionToStep(2, { fromHistory: true });
      expect(component.currentStep()).toBe(2);
      expect(pushStateSpy).not.toHaveBeenCalled();
    });

    it('should navigate to parent route when target step is below one', () => {
      const router = TestBed.inject(Router);
      const activatedRoute = TestBed.inject(ActivatedRoute);
      const navigateSpy = spyOn(router, 'navigate').and.stub();
      pushStateSpy.calls.reset();
      asInternals(component).transitionToStep(0);
      expect(component.currentStep()).toBe(1);
      expect(navigateSpy).toHaveBeenCalledWith(['../'], {
        relativeTo: activatedRoute,
      });
      expect(pushStateSpy).not.toHaveBeenCalled();
    });

    it('should re-initialize terms form when moving into step 3', () => {
      component.selectBundle('tsi');
      const initSpy = spyOn(
        component as unknown as { initializeTermsForm: () => void },
        'initializeTermsForm',
      ).and.callThrough();
      pushStateSpy.calls.reset();
      asInternals(component).transitionToStep(4);
      expect(initSpy).toHaveBeenCalled();
      expect(component.currentStep()).toBe(4);
    });

    it('should ignore popstate events without a numeric step', () => {
      component.selectBundle('bpa_galaxy');
      const savedStep = component.currentStep();
      pushStateSpy.calls.reset();
      window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
      expect(component.currentStep()).toBe(savedStep);
      expect(pushStateSpy).not.toHaveBeenCalled();
    });

    it('should handle transitions when scrollTo is unavailable', () => {
      const savedScroll = window.scrollTo;
      pushStateSpy.calls.reset();
      // @ts-expect-error - intentionally removing scrollTo for coverage
      window.scrollTo = undefined;
      asInternals(component).transitionToStep(2);
      expect(component.currentStep()).toBe(2);
      expect(pushStateSpy).toHaveBeenCalled();
      window.scrollTo = savedScroll;
    });
  });

  describe('Template Rendering', () => {
    it('should display step 1 bundle selection', () => {
      component.currentStep.set(1);
      fixture.detectChanges();
      expect(
        fixture.debugElement
          .query(By.css('h1'))
          .nativeElement.textContent.trim(),
      ).toBe('My BioCommons Access');
    });

    it('should hide next button on step 1', () => {
      component.currentStep.set(1);
      fixture.detectChanges();
      const nextButton = fixture.debugElement.query(
        By.css('[data-testid="registration-next-button"]'),
      );
      expect(nextButton).toBeTruthy();
    });

    it('should display step 2 registration form when on step 2', () => {
      component.currentStep.set(2);
      fixture.detectChanges();
      expect(
        fixture.debugElement
          .query(By.css('h1'))
          .nativeElement.textContent.trim(),
      ).toBe('Your details');
    });

    it('should show next button when beyond step 1', () => {
      component.currentStep.set(2);
      fixture.detectChanges();
      const nextButton = fixture.debugElement.query(
        By.css('[data-testid="registration-next-button"]'),
      );
      expect(nextButton).toBeTruthy();
    });

    it('should display step 3 terms acceptance when on step 3', () => {
      component.currentStep.set(3);
      fixture.detectChanges();
      expect(
        fixture.debugElement
          .query(By.css('h1'))
          .nativeElement.textContent.trim(),
      ).toBe('Select a bundle');
    });

    it('should display step 4 confirmation when on step 4', () => {
      component.currentStep.set(5);
      fixture.detectChanges();
      expect(
        fixture.debugElement
          .query(By.css('h1'))
          .nativeElement.textContent.trim(),
      ).toBe('Details confirmation');
    });

    it('should display thank you message on final step', () => {
      component.currentStep.set(6);
      fixture.detectChanges();

      const thankYouText = fixture.debugElement.query(By.css('.text-4xl'));
      expect(thankYouText.nativeElement.textContent.trim()).toBe('Thank you');

      const verificationMessage = fixture.debugElement.query(
        By.css('.verification-message'),
      );
      const normalizedText = verificationMessage.nativeElement.textContent
        .replace(/\s+/g, ' ')
        .trim();
      expect(normalizedText).toContain(
        `We've sent a verification email to the email address you provided.`,
      );
      expect(normalizedText).toContain(
        'Please open that email and click the link inside to finish setting up your account and log in.',
      );
    });
  });

  describe('Complete Registration', () => {
    it('should make HTTP request when completing registration', () => {
      // Setup valid forms
      component.bundleForm.patchValue({ selectedBundle: 'tsi' });
      component.registrationForm.patchValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

      component.currentStep.set(5);
      component.nextStep();

      // Expect HTTP request
      const req = httpMock.expectOne(
        `${environment.auth0.backend}/biocommons/register`,
      );
      expect(req.request.method).toBe('POST');

      // Simulate successful response
      req.flush({ success: true });

      expect(component.currentStep()).toBe(6);
    });

    it('should handle registration error and display error message', () => {
      // Setup valid forms
      component.bundleForm.patchValue({ selectedBundle: 'tsi' });
      component.registrationForm.patchValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

      component.currentStep.set(5);
      component.nextStep();

      // Expect HTTP request
      const req = httpMock.expectOne(
        `${environment.auth0.backend}/biocommons/register`,
      );

      // Simulate error response
      req.flush(
        { message: 'Email already exists' },
        { status: 400, statusText: 'Bad Request' },
      );

      expect(component.currentStep()).toBe(5); // Should stay on step 5
      expect(component.errorAlert()).toBeDefined();
      expect(component.isSubmitting()).toBe(false);
    });
  });

  describe('Registration failure handling', () => {
    it('should surface backend errors without advancing steps', () => {
      component.selectBundle('tsi');
      component.registrationForm.patchValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });
      component.recaptchaToken.set('token');
      component.nextStep();

      component.currentStep.set(4);
      component['initializeTermsForm']();
      const services = component.getSelectedBundle()?.services ?? [];
      const acceptedTerms = services.reduce<Record<string, boolean>>(
        (result, service) => ({ ...result, [service.id]: true }),
        { biocommonsAccess: true },
      );
      component.termsForm.patchValue(acceptedTerms);

      component.nextStep();
      expect(component.currentStep()).toBe(5);

      pushStateSpy.calls.reset();
      component.nextStep();

      const req = httpMock.expectOne(
        `${environment.auth0.backend}/biocommons/register`,
      );
      req.flush(
        { message: 'Failure' },
        { status: 500, statusText: 'Server Error' },
      );

      expect(component.currentStep()).toBe(5);
      expect(component.errorAlert()).toBe('Failure');
      expect(pushStateSpy).not.toHaveBeenCalled();
    });
  });

  describe('getFinalPageButton', () => {
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
      spyOn(activatedRoute.snapshot.queryParamMap, 'get').and.returnValue(null);

      const result = component.getFinalPageButton();
      expect(result.text).toBe('Login');
    });
  });

  describe('Bundle Data', () => {
    it('should have correct bundle data structure', () => {
      expect(component.bundles.length).toBe(2);
      expect(component.bundles[0].id).toBe('tsi');
      expect(component.bundles[1].id).toBe('fungi');
    });

    it('should have services for each bundle', () => {
      const tsiBundle = component.bundles.find((b) => b.id === 'tsi');
      const fungiBundle = component.bundles.find((b) => b.id === 'fungi');

      expect(tsiBundle?.services.length).toBe(2);
      expect(fungiBundle?.services.length).toBe(0);
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
