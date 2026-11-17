import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

function createUnsignedJwt(payload: Record<string, unknown>): string {
  const enc = (v: Record<string, unknown>) =>
    btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(v))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  return `${enc({ alg: 'none' })}.${enc(payload)}.`;
}

describe('RegisterComponent (AAF mode)', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let httpMock: HttpTestingController;
  let mockQueryParamMap: jasmine.SpyObj<ParamMap>;
  let mockLocation: { href: string };
  let authService: jasmine.SpyObj<AuthService>;

  const sessionToken = createUnsignedJwt({
    purpose: 'aaf_registration',
    email: 'ada@example.edu.au',
    given_name: 'Ada',
    family_name: 'Lovelace',
    name: 'Ada Lovelace',
  });
  const state = 'auth0-state-abc';

  beforeEach(async () => {
    mockQueryParamMap = jasmine.createSpyObj<ParamMap>('ParamMap', ['get']);
    mockQueryParamMap.get.and.callFake((key: string) =>
      key === 'session_token' ? sessionToken : key === 'state' ? state : null,
    );

    const authSpy = jasmine.createSpyObj('AuthService', [
      'refreshUser',
      'login',
      'loginAfterAafRegistration',
    ]);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { aafMode: true },
              queryParamMap: mockQueryParamMap,
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    // Capture navigation instead of performing it.
    mockLocation = { href: '' };
    (component as unknown as { document: { location: { href: string } } })[
      'document'
    ] = { location: mockLocation };
  });

  afterEach(() => httpMock.verify());

  it('enters AAF mode and prefills the identity from the token', () => {
    fixture.detectChanges();

    expect(component.aafMode()).toBe(true);
    expect(component.registrationForm.get('email')?.value).toBe(
      'ada@example.edu.au',
    );
    expect(component.registrationForm.get('firstName')?.value).toBe('Ada');
    expect(component.registrationForm.get('lastName')?.value).toBe('Lovelace');
    // Password is not required in AAF mode.
    expect(component.registrationForm.get('password')?.valid).toBe(true);
    expect(component.registrationForm.get('confirmPassword')?.valid).toBe(true);
  });

  it('preserves UTF-8 institution-provided names', () => {
    const token = createUnsignedJwt({
      email: 'jose@example.edu.au',
      given_name: 'José',
      family_name: 'Gonçalves 李',
    });
    mockQueryParamMap.get.and.callFake((key: string) =>
      key === 'session_token' ? token : key === 'state' ? state : null,
    );
    fixture.destroy();
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();

    expect(component.registrationForm.get('firstName')?.value).toBe('José');
    expect(component.registrationForm.get('lastName')?.value).toBe(
      'Gonçalves 李',
    );
  });

  it('preserves UTF-8 names when falling back to the full name', () => {
    const token = createUnsignedJwt({ name: 'José Gonçalves' });
    mockQueryParamMap.get.and.callFake((key: string) =>
      key === 'session_token' ? token : key === 'state' ? state : null,
    );
    fixture.destroy();
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();

    expect(component.registrationForm.get('firstName')?.value).toBe('José');
    expect(component.registrationForm.get('lastName')?.value).toBe('Gonçalves');
  });

  it('ignores a saved standard-registration email in AAF mode', () => {
    const key = 'aai-portal.registration-email';
    sessionStorage.setItem(key, 'other@example.com');
    try {
      fixture.destroy();
      fixture = TestBed.createComponent(RegisterComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.registrationForm.controls.email.value).toBe(
        'ada@example.edu.au',
      );
      expect(sessionStorage.getItem(key)).toBe('other@example.com');
    } finally {
      sessionStorage.removeItem(key);
    }
  });

  it('disables the prefilled identity fields but not the username', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    for (const id of ['email', 'firstName', 'lastName']) {
      expect(el.querySelector<HTMLInputElement>(`#${id}`)?.disabled)
        .withContext(id)
        .toBe(true);
    }
    expect(el.querySelector<HTMLInputElement>('#username')?.disabled).toBe(
      false,
    );
  });

  it('treats the details section as valid once a username is chosen', () => {
    fixture.detectChanges();
    expect(component.isSectionValid('your-details')).toBe(false);

    component.registrationForm.patchValue({ username: 'ada_lovelace' });

    expect(component.isSectionValid('your-details')).toBe(true);
  });

  it('does not block submit on a long institution-provided name', () => {
    fixture.detectChanges();
    component.registrationForm.patchValue({
      firstName: 'A'.repeat(200),
      lastName: 'L'.repeat(120),
      username: 'ada_lovelace',
      terms: true,
    });

    expect(component.registrationForm.valid).toBe(true);
  });

  it('shows registration success and requests a fresh login only when Continue is clicked', () => {
    fixture.detectChanges();
    component.registrationForm.patchValue({
      username: 'ada_lovelace',
      terms: true,
    });
    component.resolved('recaptcha-token');

    component.submitRegistration();

    const req = httpMock.expectOne(
      `${environment.auth0.backend}/biocommons/register-aaf`,
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      session_token: sessionToken,
      state,
      username: 'ada_lovelace',
      bundles: [],
      recaptcha_token: 'recaptcha-token',
    });

    req.flush({
      message: 'User registered successfully',
      redirect_url: 'https://biocloud-dev-aaf.au.auth0.com/continue?state=abc',
    });

    fixture.detectChanges();

    expect(mockLocation.href).toBe('');
    expect(component.isSubmitting()).toBeFalse();
    expect(component.isRegistrationComplete()).toBeTrue();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('h1')?.textContent).toContain('Thank you');
    expect(
      el.querySelector('main p')?.textContent?.replace(/\s+/g, ' ').trim(),
    ).toBe('Your account has been successfully created. You can now log in.');
    expect(el.textContent).not.toContain('Please verify your email to log in');
    const button = el.querySelector<HTMLButtonElement>(
      'main app-button button',
    );
    expect(button?.textContent).toContain('Continue');
    expect(document.activeElement).toBe(el.querySelector('h1'));
    expect(authService.login).not.toHaveBeenCalled();
    expect(authService.loginAfterAafRegistration).not.toHaveBeenCalled();
    button?.click();

    expect(authService.loginAfterAafRegistration).toHaveBeenCalledOnceWith();
    expect(authService.login).not.toHaveBeenCalled();
    expect(mockLocation.href).toBe('');
  });
});
