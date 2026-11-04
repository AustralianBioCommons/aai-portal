import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AdminPlatformResponse, ApiService } from './api.service';
import { environment } from '../../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('creates an Auth0 to AAF migration with the new email', () => {
    const response = {
      migration_id: 'migration-123',
      expires_at: '2026-10-29T03:10:00Z',
    };
    service.migrateAuth0ToAaf('new@sydney.edu.au').subscribe((result) => {
      expect(result).toEqual(response);
    });

    const req = httpMock.expectOne(
      `${environment.auth0.backend}/aaf/migrate/auth0-to-aaf`,
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ new_email: 'new@sydney.edu.au' });
    req.flush(response);
  });

  it('starts AAF to Auth0 migration with the new email and untrimmed password', () => {
    const response = {
      migration_id: 'migration-123',
      expires_at: '2026-11-04T03:10:00Z',
      new_email: 'new@example.com',
    };
    service
      .migrateAafToAuth0('new@example.com', ' Valid123! ')
      .subscribe((result) => {
        expect(result).toEqual(response);
      });
    const req = httpMock.expectOne(
      `${environment.auth0.backend}/aaf/migrate/aaf-to-auth0`,
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      new_email: 'new@example.com',
      password: ' Valid123! ',
    });
    req.flush(response);
  });

  it('completes AAF to Auth0 migration with only the migration ID and OTP', () => {
    const response = {
      migration_id: 'migration-123',
      user_id: 'oidc|AAF|123',
      new_email: 'new@example.com',
    };
    service
      .completeAafToAuth0('migration-123', '123456')
      .subscribe((result) => {
        expect(result).toEqual(response);
      });
    const req = httpMock.expectOne(
      `${environment.auth0.backend}/aaf/migrate/aaf-to-auth0/complete`,
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      otp: '123456',
      migration_id: 'migration-123',
    });
    req.flush(response);
  });

  it('keeps the normal email confirmation payload unchanged', () => {
    service.continueEmailChange('123456').subscribe();
    const req = httpMock.expectOne(
      `${environment.auth0.backend}/me/profile/email/continue`,
    );
    expect(req.request.body).toEqual({ otp: '123456' });
    req.flush(null);
  });

  it('should fetch platforms the user has admin rights to', () => {
    const mockResponse: AdminPlatformResponse[] = [
      { id: 'galaxy', name: 'Galaxy' },
    ];

    service.getAdminPlatforms().subscribe((response) => {
      expect(response).toEqual(mockResponse);
      expect(response.length).toBe(1);
    });
    const req = httpMock.expectOne(
      `${environment.auth0.backend}/me/platforms/admin-roles`,
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should call approve platform endpoint', () => {
    const userId = 'auth0|123';
    const platformId = 'galaxy';

    service.approvePlatformAccess(userId, platformId).subscribe((response) => {
      expect(response).toEqual({ updated: true });
    });

    const req = httpMock.expectOne(
      `${environment.auth0.backend}/admin/users/${userId}/platforms/${platformId}/approve`,
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ updated: true });
  });

  it('should call revoke platform endpoint with reason', () => {
    const userId = 'auth0|123';
    const platformId = 'galaxy';
    const reason = 'No longer required';

    service
      .revokePlatformAccess(userId, platformId, reason)
      .subscribe((response) => {
        expect(response).toEqual({ updated: true });
      });

    const req = httpMock.expectOne(
      `${environment.auth0.backend}/admin/users/${userId}/platforms/${platformId}/revoke`,
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reason });
    req.flush({ updated: true });
  });

  it('should call approve group endpoint', () => {
    const userId = 'auth0|123';
    const groupId = 'tsi';

    service.approveGroupAccess(userId, groupId).subscribe((response) => {
      expect(response).toEqual({ updated: true });
    });

    const req = httpMock.expectOne(
      `${environment.auth0.backend}/admin/users/${userId}/groups/${groupId}/approve`,
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ updated: true });
  });

  it('should call revoke group endpoint with reason', () => {
    const userId = 'auth0|123';
    const groupId = 'tsi';
    const reason = 'Membership expired';

    service.revokeGroupAccess(userId, groupId, reason).subscribe((response) => {
      expect(response).toEqual({ updated: true });
    });

    const req = httpMock.expectOne(
      `${environment.auth0.backend}/admin/users/${userId}/groups/${groupId}/revoke`,
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reason });
    req.flush({ updated: true });
  });

  it('should call reject group endpoint with reason', () => {
    const userId = 'auth0|123';
    const groupId = 'tsi';
    const reason = 'Not suitable';

    service.rejectGroupAccess(userId, groupId, reason).subscribe((response) => {
      expect(response).toEqual({ updated: true });
    });

    const req = httpMock.expectOne(
      `${environment.auth0.backend}/admin/users/${userId}/groups/${groupId}/reject`,
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reason });
    req.flush({ updated: true });
  });

  it('should call unreject group endpoint', () => {
    const userId = 'auth0|123';
    const groupId = 'tsi';
    service.unrejectGroupAccess(userId, groupId).subscribe((response) => {
      expect(response).toEqual({ updated: true });
    });

    const req = httpMock.expectOne(
      `${environment.auth0.backend}/admin/users/${userId}/groups/${groupId}/unreject`,
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ updated: true });
  });

  it('should call delete user endpoint with reason', () => {
    const userId = 'auth0|123';
    const reason = 'Removing user';

    service.deleteUser(userId, reason).subscribe((response) => {
      expect(response).toEqual('User deleted successfully');
    });
    const req = httpMock.expectOne(
      `${environment.auth0.backend}/admin/users/${userId}/delete`,
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reason });
    req.flush('User deleted successfully');
  });

  it('should call resend verification email endpoint', () => {
    const sessionToken = 'session-123';
    const recaptchaToken = 'captcha-123';

    service
      .resendOwnVerificationEmail(sessionToken, recaptchaToken)
      .subscribe((response) => {
        expect(response).toEqual({ message: 'Verification email sent' });
      });

    const req = httpMock.expectOne(
      `${environment.auth0.backend}/me/email-verification/resend`,
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      session_token: sessionToken,
      recaptcha_token: recaptchaToken,
    });
    req.flush({ message: 'Verification email sent' });
  });

  it('should call research institution check endpoint', () => {
    const email = 'example@university.edu.au';

    service.checkAustralianResearchInstitution(email).subscribe((response) => {
      expect(response).toBe(true);
    });

    const req = httpMock.expectOne(
      `${environment.auth0.backend}/utils/register/check-australian-research-institution?email=${email}`,
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('email')).toBe(email);
    req.flush({ is_australian_research_institution: true });
  });
});
