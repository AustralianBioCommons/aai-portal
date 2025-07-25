import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { Component } from '@angular/core';

import { RegisterComponent } from './register.component';

@Component({
  template: '<div>Mock Login Component</div>',
})
class MockLoginComponent {}

@Component({
  template: '<div>Mock Home Component</div>',
})
class MockHomeComponent {}

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, ReactiveFormsModule],
      providers: [
        provideRouter([
          { path: 'login', component: MockLoginComponent },
          { path: '', component: MockHomeComponent },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize with step 1', () => {
      expect(component.currentStep).toBe(1);
    });

    it('should have 5 total steps', () => {
      expect(component.totalSteps).toBe(5);
    });

    it('should initialize bundle form with empty selection', () => {
      expect(component.bundleForm.get('selectedBundle')?.value).toBe('');
    });

    it('should initialize registration form with empty values', () => {
      component.registrationForm.reset();

      expect(component.registrationForm.get('firstName')?.value).toBe(null);
      expect(component.registrationForm.get('lastName')?.value).toBe(null);
      expect(component.registrationForm.get('email')?.value).toBe(null);
      expect(component.registrationForm.get('username')?.value).toBe(null);
    });
  });

  describe('Bundle Selection', () => {
    beforeEach(() => {
      component.currentStep = 1;
      component.bundleForm.reset();
    });

    it('should select data portal galaxy bundle', () => {
      component.selectBundle('data-portal-galaxy');
      expect(component.bundleForm.get('selectedBundle')?.value).toBe(
        'data-portal-galaxy',
      );
    });

    it('should select TSI bundle', () => {
      component.selectBundle('tsi');
      expect(component.bundleForm.get('selectedBundle')?.value).toBe('tsi');
    });

    it('should return selected bundle object', () => {
      component.selectBundle('data-portal-galaxy');
      const selectedBundle = component.getSelectedBundle();
      expect(selectedBundle?.id).toBe('data-portal-galaxy');
      expect(selectedBundle?.name).toBe('Data Portal and Galaxy');
    });

    it('should return undefined for no selection', () => {
      component.bundleForm.get('selectedBundle')?.setValue('');
      const selectedBundle = component.getSelectedBundle();
      expect(selectedBundle).toBeUndefined();
    });
  });

  describe('Step Navigation', () => {
    beforeEach(() => {
      component.currentStep = 1;
      component.bundleForm.reset();
      component.registrationForm.reset();
    });

    it('should not proceed from step 1 without bundle selection', () => {
      component.nextStep();
      expect(component.currentStep).toBe(1);
      expect(component.bundleForm.get('selectedBundle')?.touched).toBe(true);
    });

    it('should proceed from step 1 with valid bundle selection', () => {
      component.selectBundle('data-portal-galaxy');
      component.nextStep();
      expect(component.currentStep).toBe(2);
    });

    it('should not proceed from step 2 with invalid registration form', () => {
      component.currentStep = 2;
      component.registrationForm.reset();

      component.nextStep();
      expect(component.currentStep).toBe(2);
      expect(component.registrationForm.get('firstName')?.touched).toBe(true);
    });

    it('should proceed from step 2 with valid registration form', () => {
      component.currentStep = 2;
      component.selectBundle('data-portal-galaxy');

      component.registrationForm.patchValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'Password123',
        confirmPassword: 'Password123',
      });

      component.nextStep();
      expect(component.currentStep).toBe(3);
    });

    it('should go back from step 2 to step 1', () => {
      component.currentStep = 2;
      component.prevStep();
      expect(component.currentStep).toBe(1);
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      component.registrationForm.reset();
    });

    it('should validate required fields', () => {
      const firstName = component.registrationForm.get('firstName');
      firstName?.markAsTouched();
      expect(component.isFieldInvalid('firstName')).toBe(true);
      expect(component.getErrorMessage('firstName')).toBe(
        'This field is required',
      );
    });

    it('should validate email format', () => {
      const email = component.registrationForm.get('email');
      email?.setValue('invalid-email');
      email?.markAsTouched();
      expect(component.isFieldInvalid('email')).toBe(true);
      expect(component.getErrorMessage('email')).toBe(
        'Please enter a valid email address',
      );
    });

    it('should validate password pattern', () => {
      const password = component.registrationForm.get('password');
      password?.setValue('weak');
      password?.markAsTouched();
      expect(component.isFieldInvalid('password')).toBe(true);
      expect(component.getErrorMessage('password')).toContain(
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
      expect(component.getErrorMessage('confirmPassword')).toBe(
        'Passwords do not match',
      );
    });
  });

  describe('Terms Form', () => {
    beforeEach(() => {
      component.selectBundle('data-portal-galaxy');
      component.initializeTermsForm();
    });

    it('should initialize terms form based on selected bundle', () => {
      expect(component.termsForm.get('bpa')).toBeTruthy();
      expect(component.termsForm.get('galaxy')).toBeTruthy();
    });

    it('should toggle terms acceptance', () => {
      expect(component.termsForm.get('bpa')?.value).toBe(false);
      component.toggleTermsAcceptance('bpa');
      expect(component.termsForm.get('bpa')?.value).toBe(true);
    });
  });

  describe('State Persistence', () => {
    beforeEach(() => {
      localStorage.clear();
      component.currentStep = 1;
      component.bundleForm.reset();
      component.registrationForm.reset();
    });

    it('should save state to localStorage', () => {
      component.selectBundle('data-portal-galaxy');
      component.registrationForm.patchValue({
        firstName: 'John',
        lastName: 'Doe',
      });

      component['saveCurrentState']();

      const savedState = localStorage.getItem('bundle-registration-state');
      expect(savedState).toBeTruthy();

      const state = JSON.parse(savedState!);
      expect(state.currentStep).toBe(1);
      expect(state.bundleFormData.selectedBundle).toBe('data-portal-galaxy');
      expect(state.registrationFormData.firstName).toBe('John');
    });

    it('should load state from localStorage', () => {
      const mockState = {
        currentStep: 2,
        bundleFormData: { selectedBundle: 'tsi' },
        registrationFormData: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          username: 'janesmith',
          password: '',
          confirmPassword: '',
        },
        termsFormData: null,
      };

      localStorage.setItem(
        'bundle-registration-state',
        JSON.stringify(mockState),
      );

      component['loadSavedState']();

      expect(component.currentStep).toBe(2);
      expect(component.bundleForm.get('selectedBundle')?.value).toBe('tsi');
      expect(component.registrationForm.get('firstName')?.value).toBe('Jane');
    });

    it('should clear state from localStorage', () => {
      localStorage.setItem('bundle-registration-state', 'test-data');
      component['clearSavedState']();
      expect(localStorage.getItem('bundle-registration-state')).toBeNull();
    });
  });

  describe('Template Rendering', () => {
    it('should display step 1 bundle selection', () => {
      component.currentStep = 1;
      fixture.detectChanges();
      expect(
        fixture.debugElement
          .query(By.css('h1'))
          .nativeElement.textContent.trim(),
      ).toBe('Access bundles');
    });

    it('should display step 2 registration form when on step 2', () => {
      component.currentStep = 2;
      fixture.detectChanges();
      expect(
        fixture.debugElement
          .query(By.css('h1'))
          .nativeElement.textContent.trim(),
      ).toBe('Your details');
    });

    it('should display navigation buttons', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      expect(buttons.length).toBe(2);
      expect(buttons[0].nativeElement.textContent.trim()).toBe('Back');
      expect(buttons[1].nativeElement.textContent.trim()).toBe('Next');
    });

    it('should show Submit button on step 4', () => {
      component.currentStep = 4;
      fixture.detectChanges();
      const submitButton = fixture.debugElement.queryAll(By.css('button'))[1];
      expect(submitButton.nativeElement.textContent.trim()).toBe('Submit');
    });

    it('should display thank you message on final step', () => {
      component.currentStep = 5;
      fixture.detectChanges();
      expect(
        fixture.debugElement
          .query(By.css('.text-4xl'))
          .nativeElement.textContent.trim(),
      ).toBe('Thank you');
    });
  });

  describe('Complete Registration', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should call completeRegistration and advance to final step', () => {
      spyOn(component, 'completeRegistration').and.callThrough();
      spyOn(localStorage, 'removeItem');

      component.currentStep = 4;
      component.nextStep();

      expect(component.completeRegistration).toHaveBeenCalled();
      expect(localStorage.removeItem).toHaveBeenCalledWith(
        'bundle-registration-state',
      );
      expect(component.currentStep).toBe(5);
    });

    it('should clear localStorage when registration is completed', () => {
      localStorage.setItem('bundle-registration-state', 'test-data');

      component.completeRegistration();

      expect(localStorage.getItem('bundle-registration-state')).toBeNull();
    });
  });
});
