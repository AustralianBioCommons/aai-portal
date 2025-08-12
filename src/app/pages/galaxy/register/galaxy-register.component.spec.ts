import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { GalaxyRegisterComponent } from './galaxy-register.component';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ValidationService } from '../../../core/services/validation.service';
import { of } from 'rxjs';

describe('GalaxyRegisterComponent', () => {
  let component: GalaxyRegisterComponent;
  let fixture: ComponentFixture<GalaxyRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, GalaxyRegisterComponent],
      providers: [
        provideHttpClient(),
        ValidationService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {} },
            params: of({}),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GalaxyRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the form with default empty values', () => {
    expect(component.registerForm).toBeDefined();
    expect(component.registerForm.get('email')?.value).toBe('');
    expect(component.registerForm.get('password')?.value).toBe('');
    expect(component.registerForm.get('confirmPassword')?.value).toBe('');
    expect(component.registerForm.get('username')?.value).toBe('');
  });

  it('should detect mismatching passwords', () => {
    component.registerForm.controls['password'].setValue('Password123!');
    component.registerForm.controls['confirmPassword'].setValue('notmatching');

    component.registerForm.controls['confirmPassword'].updateValueAndValidity();
    fixture.detectChanges();

    expect(
      component.registerForm.controls['confirmPassword'].hasError(
        'passwordMismatch',
      ),
    ).toBeTrue();
  });

  it('should not show mismatch error when passwords match', () => {
    component.registerForm.controls['password'].setValue('Password123!');
    component.registerForm.controls['confirmPassword'].setValue('Password123!');
    component.registerForm.updateValueAndValidity();

    expect(component.registerForm.hasError('passwordMismatch')).toBeFalse();
  });

  it('should invalidate username with uppercase letters', () => {
    component.registerForm.controls['username'].setValue('InvalidName');
    expect(component.registerForm.controls['username'].valid).toBeFalse();
    expect(
      component.registerForm.controls['username'].errors?.['pattern'],
    ).toBeTruthy();
  });

  it('should invalidate username with special characters', () => {
    component.registerForm.controls['username'].setValue('bad$name!');
    expect(component.registerForm.controls['username'].valid).toBeFalse();
    expect(
      component.registerForm.controls['username'].errors?.['pattern'],
    ).toBeTruthy();
  });

  it('should accept a valid username', () => {
    component.registerForm.controls['username'].setValue('valid_name-123');
    expect(component.registerForm.controls['username'].valid).toBeTrue();
  });
});

describe('GalaxyRegisterComponent submission', () => {
  let component: GalaxyRegisterComponent;
  let fixture: ComponentFixture<GalaxyRegisterComponent>;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    router = jasmine.createSpyObj('Router', ['navigate']);
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, GalaxyRegisterComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
        ValidationService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {} },
            params: of({}),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GalaxyRegisterComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  function fillFormWithValidData() {
    component.registerForm.setValue({
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      username: 'testuser',
    });
    component.recaptchaToken = 'mock-recaptcha-token';
  }

  it('should redirect to success page on successful registration', fakeAsync(() => {
    fillFormWithValidData();

    component.onSubmit();
    tick();

    const tokenReq = httpMock.expectOne(
      `${environment.auth0.backend}/galaxy/register/get-registration-token`,
    );
    tokenReq.flush({ token: 'mock-token' });

    const registerReq = httpMock.expectOne(
      `${environment.auth0.backend}/galaxy/register`,
    );
    registerReq.flush({ success: true });

    tick();
    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(['success'], {
      relativeTo: component.route,
    });
    expect(component.errorMessage).toBeNull();
  }));

  it('should display error message on failed registration token request', fakeAsync(() => {
    fillFormWithValidData();

    component.onSubmit();
    tick();

    const tokenReq = httpMock.expectOne(
      `${environment.auth0.backend}/galaxy/register/get-registration-token`,
    );
    tokenReq.flush('', { status: 500, statusText: 'Token request failed' });

    tick();
    fixture.detectChanges();

    const errorEl = fixture.debugElement.query(
      By.css('#register_error_message'),
    );
    expect(errorEl).toBeTruthy();
    expect(errorEl.nativeElement.textContent).toContain('Registration failed');
  }));

  it('should display error message on failed registration POST', fakeAsync(() => {
    fillFormWithValidData();

    component.onSubmit();
    tick();

    const tokenReq = httpMock.expectOne(
      `${environment.auth0.backend}/galaxy/register/get-registration-token`,
    );
    tokenReq.flush({ token: 'mock-token' });

    const registerReq = httpMock.expectOne(
      `${environment.auth0.backend}/galaxy/register`,
    );
    registerReq.flush('', { status: 500, statusText: 'Server error' });

    tick();
    fixture.detectChanges();

    const errorEl = fixture.debugElement.query(
      By.css('#register_error_message'),
    );
    expect(errorEl).toBeTruthy();
    expect(errorEl.nativeElement.textContent).toContain('Registration failed:');
  }));

  it('should not submit if form is invalid', () => {
    component.registerForm.setValue({
      email: '',
      password: '',
      confirmPassword: '',
      username: '',
    });

    component.onSubmit();
    fixture.detectChanges();

    expect(component.registerForm.invalid).toBeTrue();
    expect(component.errorMessage).toBeNull();
    httpMock.expectNone(
      `${environment.auth0.backend}/galaxy/register/get-registration-token`,
    );
  });

  it('should not submit if recaptcha is not completed', () => {
    fillFormWithValidData();
    component.recaptchaToken = null;
    component.recaptchaAttempted = false;

    component.onSubmit();

    expect(component.recaptchaAttempted).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should show recaptcha error message when attempted but not completed', () => {
    component.recaptchaAttempted = true;
    component.recaptchaToken = null;
    fixture.detectChanges();

    const errorElement =
      fixture.debugElement.nativeElement.querySelector('.text-red-500');
    expect(errorElement?.textContent.trim()).toBe(
      'Please complete the reCAPTCHA verification',
    );
  });
});
