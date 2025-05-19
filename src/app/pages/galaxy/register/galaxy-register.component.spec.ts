import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { GalaxyRegisterComponent } from './galaxy-register.component';
import { provideHttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';

describe('GalaxyRegisterComponent', () => {
  let component: GalaxyRegisterComponent;
  let fixture: ComponentFixture<GalaxyRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, GalaxyRegisterComponent],
      providers: [provideHttpClient()]
    }).compileComponents();

    fixture = TestBed.createComponent(GalaxyRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function markAllAsTouched() {
    Object.values(component.registerForm.controls).forEach(control => {
      control.markAsTouched();
    });
    fixture.detectChanges();
  }

  it('should create the form with default empty values', () => {
    expect(component.registerForm).toBeDefined();
    expect(component.registerForm.get('email')?.value).toBe('');
    expect(component.registerForm.get('password')?.value).toBe('');
    expect(component.registerForm.get('password_confirmation')?.value).toBe('');
    expect(component.registerForm.get('public_name')?.value).toBe('');
  });

  it('should detect mismatching passwords', () => {
    component.registerForm.controls['password'].setValue('password123');
    component.registerForm.controls['password_confirmation'].setValue('notmatching');
    component.registerForm.updateValueAndValidity();

    expect(component.registerForm.hasError('passwordMismatch')).toBeTrue();
  });

  it('should not show mismatch error when passwords match', () => {
    component.registerForm.controls['password'].setValue('password123');
    component.registerForm.controls['password_confirmation'].setValue('password123');
    component.registerForm.updateValueAndValidity();

    expect(component.registerForm.hasError('passwordMismatch')).toBeFalse();
  });

  it('should invalidate public_name with uppercase letters', () => {
    component.registerForm.controls['public_name'].setValue('InvalidName');
    expect(component.registerForm.controls['public_name'].valid).toBeFalse();
    expect(component.registerForm.controls['public_name'].errors?.['pattern']).toBeTruthy();
  });

  it('should invalidate public_name with special characters', () => {
    component.registerForm.controls['public_name'].setValue('bad$name!');
    expect(component.registerForm.controls['public_name'].valid).toBeFalse();
    expect(component.registerForm.controls['public_name'].errors?.['pattern']).toBeTruthy();
  });

  it('should accept a valid public_name', () => {
    component.registerForm.controls['public_name'].setValue('valid_name-123');
    expect(component.registerForm.controls['public_name'].valid).toBeTrue();
  });

  it('should show "Your public name should contain only..." when public_name is invalid', () => {
    component.registerForm.controls['public_name'].setValue('Invalid@Name');
    markAllAsTouched();

    const errorElements: NodeListOf<HTMLElement> = fixture.debugElement.nativeElement.querySelectorAll('small');
    const patternError = Array.from(errorElements).find((e) => {
      return e.textContent?.includes('Your public name should contain only');
    });
    expect(patternError).toBeTruthy();
  });
});

describe('GalaxyRegisterComponent submission', () => {
  let component: GalaxyRegisterComponent;
  let fixture: ComponentFixture<GalaxyRegisterComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, GalaxyRegisterComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
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
      password: 'password123',
      password_confirmation: 'password123',
      public_name: 'testuser'
    });
  }

  it('should display success message on successful registration', fakeAsync(() => {
    fillFormWithValidData();

    component.onSubmit();
    const tokenReq = httpMock.expectOne("https://aaibackend.test.biocommons.org.au/galaxy/get-registration-token");
    expect(tokenReq.request.method).toBe('GET');
    tokenReq.flush({ token: 'mock-token' });

    const registerReq = httpMock.expectOne("https://aaibackend.test.biocommons.org.au/galaxy/register");
    expect(registerReq.request.method).toBe('POST');
    registerReq.flush({ success: true });

    tick();
    fixture.detectChanges();

    const successEl = fixture.debugElement.query(By.css('#register_success_message'));
    expect(successEl).toBeTruthy();
    expect(component.registerSuccess).toBeTrue();
    expect(component.errorMessage).toBeNull();
  }));

  it('should display error message on failed registration token request', fakeAsync(() => {
    fillFormWithValidData();

    component.onSubmit();
    const tokenReq = httpMock.expectOne("https://aaibackend.test.biocommons.org.au/galaxy/get-registration-token");
    tokenReq.flush("", {status: 500, statusText: "Token request failed"});

    tick();
    fixture.detectChanges();

    const errorEl = fixture.debugElement.query(By.css('#register_error_message'));
    expect(errorEl).toBeTruthy();
    expect(component.registerSuccess).toBeFalse();
    expect(errorEl.nativeElement.textContent).toContain('Registration failed');
  }));

  it('should display error message on failed registration POST', fakeAsync(() => {
    fillFormWithValidData();

    component.onSubmit();
    const tokenReq = httpMock.expectOne("https://aaibackend.test.biocommons.org.au/galaxy/get-registration-token");
    tokenReq.flush({ token: 'mock-token' });

    const registerReq = httpMock.expectOne("https://aaibackend.test.biocommons.org.au/galaxy/register");
    registerReq.flush("", { status: 500, statusText: "Server error" });

    tick();
    fixture.detectChanges();

    const errorEl = fixture.debugElement.query(By.css('#register_error_message'));
    expect(errorEl).toBeTruthy();
    expect(component.registerSuccess).toBeFalse();
    expect(errorEl.nativeElement.textContent).toContain('Registration failed:');
  }));

  it('should not submit if form is invalid', () => {
    component.registerForm.setValue({
      email: '',
      password: '',
      password_confirmation: '',
      public_name: ''
    });

    component.onSubmit();
    fixture.detectChanges();

    expect(component.registerForm.invalid).toBeTrue();
    expect(component.registerSuccess).toBeFalse(); // Initial state, not set to false
    expect(component.errorMessage).toBeNull();
  });
});
