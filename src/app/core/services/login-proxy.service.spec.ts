import { TestBed } from '@angular/core/testing';

import {
  AafDomainsResponse,
  EmailCheckResponse,
  LoginProxyService,
} from './login-proxy.service';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

describe('LoginProxyService', () => {
  let service: LoginProxyService;
  let httpMock: HttpTestingController;
  let baseUrl: string;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LoginProxyService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(LoginProxyService);
    httpMock = TestBed.inject(HttpTestingController);
    baseUrl = environment.auth0.loginProxyUrl.replace(/\/$/, '');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch the list of AAF domains', () => {
    const mockResponse: AafDomainsResponse = {
      domains: ['melbourne.edu.au', 'sydney.edu.au'],
    };

    service.getAafDomains().subscribe((response) => {
      expect(response).toEqual(['melbourne.edu.au', 'sydney.edu.au']);
    });
    const req = httpMock.expectOne(`${baseUrl}/aaf/domains`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should check if email is AAF', () => {
    const email = 'user@sydney.edu.au';
    const mockResponse: EmailCheckResponse = {
      email: email,
      is_aaf: true,
    };

    service.checkAafEmail(email).subscribe((response) => {
      expect(response).toBeTrue();
    });
    const req = httpMock.expectOne(`${baseUrl}/aaf/email-check?email=${email}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
