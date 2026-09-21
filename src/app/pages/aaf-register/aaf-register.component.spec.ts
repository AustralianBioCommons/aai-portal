import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { AafRegisterComponent } from './aaf-register.component';
import { environment } from '../../../environments/environment';

function createUnsignedJwt(payload: Record<string, unknown>): string {
  const encodePart = (value: Record<string, unknown>) =>
    btoa(JSON.stringify(value))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

  return `${encodePart({ alg: 'none' })}.${encodePart(payload)}.`;
}

describe('AafRegisterComponent', () => {
  let fixture: ComponentFixture<AafRegisterComponent>;
  let component: AafRegisterComponent;
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
    mockQueryParamMap.get.and.callFake((key: string) => {
      if (key === 'session_token') return sessionToken;
      if (key === 'state') return state;
      return null;
    });
    await TestBed.configureTestingModule({
      imports: [AafRegisterComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: mockQueryParamMap,
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AafRegisterComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);

    // Capture navigation instead of performing it: override the component's
    // injected document after creation (TestBed's renderer keeps the real one).
    mockLocation = { href: '' };
    (component as unknown as { document: { location: { href: string } } })[
      'document'
    ] = { location: mockLocation };
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('prefills email and first/last name from the session token', () => {
    fixture.detectChanges();

    expect(component.aafRegisterForm.get('email')?.value).toBe(
      'ada@example.edu.au',
    );
    expect(component.aafRegisterForm.get('firstName')?.value).toBe('Ada');
    expect(component.aafRegisterForm.get('lastName')?.value).toBe('Lovelace');
    expect(fixture.debugElement.query(By.css('#email'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('#firstName'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('#lastName'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('#username'))).toBeTruthy();
  });

  it('sets an error when session_token or state is missing', () => {
    mockQueryParamMap.get.and.returnValue(null);

    fixture.detectChanges();

    expect(component.errorAlert()).toContain(
      'Invalid or missing registration link',
    );
  });

  it('submits registration with session_token, state, username and bundles, then follows redirect_url', () => {
    fixture.detectChanges();
    component.aafRegisterForm.patchValue({
      username: 'ada_lovelace',
      terms: true,
    });
    component.resolved('test-recaptcha-token');

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
      recaptcha_token: 'test-recaptcha-token',
    });

    req.flush({
      message: 'User registered successfully',
      redirect_url: 'https://biocloud-dev-aaf.au.auth0.com/continue?state=abc',
    });

    expect(mockLocation.href).toBe(
      'https://biocloud-dev-aaf.au.auth0.com/continue?state=abc',
    );
  });

  it('does not submit without a reCAPTCHA token', () => {
    fixture.detectChanges();
    component.aafRegisterForm.patchValue({
      username: 'ada_lovelace',
      terms: true,
    });

    component.submitRegistration();

    httpMock.expectNone(
      `${environment.auth0.backend}/biocommons/register-aaf`,
    );
  });
});
