import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmailVerifiedComponent } from './email-verified.component';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

describe('EmailVerifiedComponent', () => {
  let fixture: ComponentFixture<EmailVerifiedComponent>;
  let component: EmailVerifiedComponent;
  let httpClientSpy: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['get']);
  });

  const createComponent = async (
    queryParams: Record<string, string | null>,
    detectChanges = true,
  ) => {
    const activatedRouteStub = {
      queryParamMap: of({
        get: (key: string) => queryParams[key] ?? null,
      }),
    };

    await TestBed.configureTestingModule({
      imports: [EmailVerifiedComponent],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        { provide: HttpClient, useValue: httpClientSpy },
        Title,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmailVerifiedComponent);
    component = fixture.componentInstance;
    if (detectChanges) {
      fixture.detectChanges();
    }
  };

  afterEach(() => {
    httpClientSpy.get.calls.reset();
  });

  it('should mark email as verified if success=true', async () => {
    httpClientSpy.get.and.returnValue(of({ app: 'galaxy' }));
    await createComponent({
      success: 'true',
      email: 'test@example.com',
      message: '',
    });

    expect(component.emailVerified()).toBeTrue();
  });

  it('should use galaxy URL if app response is galaxy', async () => {
    httpClientSpy.get.and.returnValue(of({ app: 'galaxy' }));
    await createComponent({
      success: 'true',
      email: 'galaxy@example.com',
      message: '',
    });

    expect(httpClientSpy.get).toHaveBeenCalledWith(
      `${environment.auth0.backend}/utils/registration_info?user_email=galaxy%40example.com`,
    );
    expect(component.appId()).toBe('galaxy');
    expect(component.appUrl()).toContain('galaxy.test.biocommons.org.au');
  });

  it('should use bpa URL if app response is bpa', async () => {
    httpClientSpy.get.and.returnValue(of({ app: 'bpa' }));
    await createComponent({
      success: 'true',
      email: 'bpa@example.com',
      message: '',
    });

    expect(component.appId()).toBe('bpa');
    expect(component.appUrl()).toContain('aaidemo.bioplatforms.com');
  });

  it('should use biocommons URL if app response is biocommons', async () => {
    httpClientSpy.get.and.returnValue(of({ app: 'biocommons' }));
    await createComponent({
      success: 'true',
      email: 'bio@example.com',
      message: '',
    });

    expect(component.appId()).toBe('biocommons');
    expect(component.appUrl()).toContain('login.test.biocommons.org.au');
  });

  it('should not fail if app lookup throws', async () => {
    httpClientSpy.get.and.returnValue(throwError(() => new Error('API down')));
    await createComponent({
      success: 'true',
      email: 'fail@example.com',
      message: '',
    });

    expect(httpClientSpy.get).toHaveBeenCalled();
    expect(component.appId()).toBe('biocommons'); // fallback
  });

  it('should set error message if present in query params', async () => {
    httpClientSpy.get.and.returnValue(of({ app: 'biocommons' }));
    await createComponent({
      success: 'false',
      email: 'test@example.com',
      message: 'Verification failed',
    });

    expect(component.errorMessage()).toBe('Verification failed');
    expect(component.emailVerified()).toBeFalse();
  });

  it('should display success message and link on email verification success', async () => {
    await createComponent({ success: 'true', email: null, message: null });

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain(
      'Email Verified',
    );
    expect(compiled.querySelector('p')?.textContent).toContain(
      'Your email has been successfully verified',
    );

    const link = compiled.querySelector('app-button');
    expect(link?.textContent).toContain('Continue');
  });

  it('should render error message and error detail if verification failed', async () => {
    await createComponent({
      success: 'false',
      email: null,
      message: 'Verification token expired',
    });

    const compiled = fixture.nativeElement as HTMLElement;

    const heading = compiled.querySelector('h1');
    const errorDiv = compiled.querySelector('.text-gray-500');

    expect(heading?.textContent).toContain('Email verification error');
    expect(errorDiv?.textContent).toContain('Your email could not be verified');
    expect(errorDiv?.textContent).toContain('Verification token expired');
  });

  it('should not call getAppInfo if email is missing in query params', async () => {
    httpClientSpy.get.and.returnValue(of({ app: 'galaxy' }));
    await createComponent({ success: 'true', email: null, message: '' }, false);

    const spy = spyOn(component, 'getAppInfo');
    fixture.detectChanges();

    expect(spy).not.toHaveBeenCalled();
    expect(httpClientSpy.get).not.toHaveBeenCalled();
  });
});
