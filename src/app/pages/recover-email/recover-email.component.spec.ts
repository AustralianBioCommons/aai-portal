import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { RecoverEmailComponent } from './recover-email.component';
import { ValidationService } from '../../core/services/validation.service';
import { environment } from '../../../environments/environment';
import { RecoverLoginEmailResponse } from '../../core/services/api.service';
import { RecaptchaModule } from 'ng-recaptcha-2';

@Component({
  template: '<div>Mock Login Component</div>',
})
class MockLoginComponent {}

describe('RecoverEmailComponent', () => {
  let component: RecoverEmailComponent;
  let fixture: ComponentFixture<RecoverEmailComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecoverEmailComponent, ReactiveFormsModule, RecaptchaModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', component: MockLoginComponent }]),
        ValidationService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecoverEmailComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Validation', () => {
    it('should require username field', () => {
      const username = component.form.get('username');
      expect(username?.hasError('required')).toBe(true);
    });

    it('should require username to be at least 3 characters', () => {
      const username = component.form.get('username');
      username?.setValue('ab');
      expect(username?.hasError('minlength')).toBe(true);

      username?.setValue('abc');
      expect(username?.valid).toBe(true);
    });
  });

  describe('reCAPTCHA', () => {
    it('should require recaptcha before submission', () => {
      component.form.get('username')?.setValue('testuser');
      component.recaptchaToken.set(null);
      component.onSubmit();

      httpMock.expectNone(
        `${environment.auth0.backend}/utils/login/recover-email`,
      );
    });

    it('should set recaptcha token when resolved', () => {
      const token = 'test-recaptcha-token';
      component.resolved(token);
      expect(component.recaptchaToken()).toBe(token);
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      component.form.get('username')?.setValue('testuser');
      component.recaptchaToken.set('test-recaptcha-token');
    });

    it('should handle successful email recovery', () => {
      component.onSubmit();

      const req = httpMock.expectOne(
        `${environment.auth0.backend}/utils/login/recover-email`,
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        username: 'testuser',
        recaptcha_token: 'test-recaptcha-token',
      });

      const response: RecoverLoginEmailResponse = {
        found: true,
        masked_email: 'te**@example.com',
        message: 'Email sent successfully',
      };
      req.flush(response);

      expect(component.maskedEmail()).toBe('te**@example.com');
      expect(component.isSubmitting()).toBe(false);
    });

    it('should handle username not found error', () => {
      component.onSubmit();

      const req = httpMock.expectOne(
        `${environment.auth0.backend}/utils/login/recover-email`,
      );
      const response: RecoverLoginEmailResponse = {
        found: false,
        masked_email: null,
        message: 'No account found for that username.',
      };
      req.flush(response);

      expect(component.usernameNotFound()).toBe(true);
      expect(component.errorMessage()).toBe(
        'No account found for that username.',
      );
      expect(component.isSubmitting()).toBe(false);
    });

    it('should handle network errors', () => {
      component.onSubmit();

      const req = httpMock.expectOne(
        `${environment.auth0.backend}/utils/login/recover-email`,
      );
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(component.errorMessage()).toBe(
        'Something went wrong. Please try again.',
      );
      expect(component.isSubmitting()).toBe(false);
    });
  });

  describe('UI State', () => {
    it('should display form when no masked email is set', () => {
      component.maskedEmail.set(null);
      fixture.detectChanges();

      const form = fixture.debugElement.query(By.css('form'));
      expect(form).toBeTruthy();
    });

    it('should display success message when masked email is set', () => {
      component.maskedEmail.set('te**@example.com');
      fixture.detectChanges();

      const form = fixture.debugElement.query(By.css('form'));
      expect(form).toBeFalsy();

      const maskedEmailText = fixture.nativeElement.textContent;
      expect(maskedEmailText).toContain('te**@example.com');
    });
  });
});
