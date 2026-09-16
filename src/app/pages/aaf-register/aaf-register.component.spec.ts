import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, ParamMap } from '@angular/router';
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

  const sessionToken = createUnsignedJwt({
    purpose: 'aaf_registration',
    email: 'ada@example.edu.au',
    given_name: 'Ada',
    family_name: 'Lovelace',
    name: 'Ada Lovelace',
  });

  beforeEach(async () => {
    mockQueryParamMap = jasmine.createSpyObj<ParamMap>('ParamMap', ['get']);
    mockQueryParamMap.get.and.callFake((key: string) =>
      key === 'session_token' ? sessionToken : null,
    );

    await TestBed.configureTestingModule({
      imports: [AafRegisterComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
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
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('prefills email and name from the session token', () => {
    fixture.detectChanges();

    expect(component.aafRegisterForm.get('email')?.value).toBe(
      'ada@example.edu.au',
    );
    expect(component.aafRegisterForm.get('name')?.value).toBe('Ada Lovelace');
    expect(fixture.debugElement.query(By.css('#email'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('#name'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('#username'))).toBeTruthy();
  });

  it('sets an error when session_token is missing', () => {
    mockQueryParamMap.get.and.returnValue(null);

    fixture.detectChanges();

    expect(component.errorAlert()).toContain(
      'Invalid or missing session token',
    );
  });

  it('submits registration with an empty bundle list', () => {
    fixture.detectChanges();
    component.aafRegisterForm.patchValue({ username: 'ada_lovelace' });
    component.resolved('test-recaptcha-token');

    component.submitRegistration();

    const req = httpMock.expectOne(
      `${environment.auth0.backend}/biocommons/register-aaf`,
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      session_token: sessionToken,
      username: 'ada_lovelace',
      bundles: [],
      recaptcha_token: 'test-recaptcha-token',
    });

    req.flush({ success: true });
    expect(component.isRegistrationComplete()).toBe(true);
  });
});
