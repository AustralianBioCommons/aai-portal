import { TestBed } from '@angular/core/testing';

import { AafDomainsResponse, LoginProxyService } from './login-proxy.service';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

describe('LoginProxyService', () => {
  let service: LoginProxyService;
  let httpMock: HttpTestingController;

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
    const baseUrl = environment.auth0.loginProxyUrl.replace(/\/$/, '');
    const req = httpMock.expectOne(`${baseUrl}/aaf/domains`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
