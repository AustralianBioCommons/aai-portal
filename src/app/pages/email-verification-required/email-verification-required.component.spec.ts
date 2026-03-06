import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { EmailVerificationRequiredComponent } from './email-verification-required.component';

const JWT_WITH_EMAIL =
  'header.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifQ.signature';

describe('EmailVerificationRequiredComponent', () => {
  let component: EmailVerificationRequiredComponent;
  let fixture: ComponentFixture<EmailVerificationRequiredComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockQueryParamMap: jasmine.SpyObj<ParamMap>;

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj<ApiService>('ApiService', [
      'resendOwnVerificationEmail',
    ]);

    mockQueryParamMap = jasmine.createSpyObj<ParamMap>('ParamMap', ['get']);
    mockQueryParamMap.get.and.returnValue(null);
    const mockActivatedRoute = {
      snapshot: {
        queryParamMap: mockQueryParamMap,
      },
    };

    await TestBed.configureTestingModule({
      imports: [EmailVerificationRequiredComponent],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmailVerificationRequiredComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('sets error state when session_token is missing', () => {
    mockQueryParamMap.get.and.returnValue(null);

    fixture.detectChanges();

    expect(component.state()).toBe('error');
    expect(component.errorMessage()).toContain(
      'Invalid or missing session token',
    );
  });

  it('extracts userEmail from JWT payload when token exists', () => {
    mockQueryParamMap.get.and.callFake((key: string) =>
      key === 'session_token' ? JWT_WITH_EMAIL : null,
    );

    fixture.detectChanges();

    expect(component.userEmail()).toBe('test@example.com');
    expect(component.maskedEmail()).toBe('t***@example.com');
  });

  it('does not call API when recaptcha token is missing', () => {
    mockQueryParamMap.get.and.callFake((key: string) =>
      key === 'session_token' ? 'session-123' : null,
    );

    fixture.detectChanges();
    component.resendVerificationEmail();

    expect(component.recaptchaAttempted()).toBeTrue();
    expect(mockApiService.resendOwnVerificationEmail).not.toHaveBeenCalled();
  });

  it('calls resendOwnVerificationEmail and sets success state', () => {
    mockQueryParamMap.get.and.callFake((key: string) =>
      key === 'session_token' ? 'session-123' : null,
    );
    mockApiService.resendOwnVerificationEmail.and.returnValue(
      of({ message: 'Verification email sent successfully' }),
    );

    fixture.detectChanges();
    component.resolved('captcha-123');
    component.resendVerificationEmail();

    expect(mockApiService.resendOwnVerificationEmail).toHaveBeenCalledWith(
      'session-123',
      'captcha-123',
    );
    expect(component.state()).toBe('success');
  });

  it('shows backend error detail when resend fails', () => {
    mockQueryParamMap.get.and.callFake((key: string) =>
      key === 'session_token' ? 'session-123' : null,
    );
    mockApiService.resendOwnVerificationEmail.and.returnValue(
      throwError(() => ({ error: { detail: 'Invalid recaptcha token' } })),
    );

    fixture.detectChanges();
    component.resolved('captcha-123');
    component.resendVerificationEmail();

    expect(component.state()).toBe('error');
    expect(component.errorMessage()).toBe('Invalid recaptcha token');
  });
});
