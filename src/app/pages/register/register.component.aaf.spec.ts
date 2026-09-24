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
    btoa(JSON.stringify(v))
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

    // Capture navigation instead of performing it.
    mockLocation = { href: '' };
    (component as unknown as { document: { location: { href: string } } })[
      'document'
    ] = { location: mockLocation };
  });

  afterEach(() => httpMock.verify());

  it('enters AAF mode and prefills read-only identity from the token', () => {
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

  it('submits to register-aaf with session_token/state and follows redirect_url', () => {
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

    expect(mockLocation.href).toBe(
      'https://biocloud-dev-aaf.au.auth0.com/continue?state=abc',
    );
  });
});
