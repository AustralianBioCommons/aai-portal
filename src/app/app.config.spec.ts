import { ApplicationInitStatus } from '@angular/core';
import {
  HttpBackend,
  HttpClientModule,
  HttpEvent,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { AuthClientConfig } from '@auth0/auth0-angular';
import { appConfig } from './app.config';

describe('AppConfig Auth0 bootstrap', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('uses runtime-configured Auth0 client id', async () => {
    const runtimeConfig = {
      production: false,
      auth0: {
        domain: 'dev.login.aai.test.biocommons.org.au',
        clientId: 'S2uvyEw6PpXfquC97xQwc38v8WHE4Rq4',
        redirectUri: 'https://example.dev/portal',
        backend: 'https://dev.api.aai.test.biocommons.org.au',
      },
      recaptcha: {
        siteKeyV2: 'runtime-site-key',
      },
    };

    class RuntimeConfigBackend implements HttpBackend {
      handle(req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
        if (req.url.endsWith('assets/config/app-config.json')) {
          return of(new HttpResponse({ status: 200, body: runtimeConfig }));
        }
        return throwError(() => new Error(`Unexpected request: ${req.url}`));
      }
    }

    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [
        ...appConfig.providers,
        { provide: HttpBackend, useClass: RuntimeConfigBackend },
      ],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;

    const authConfig = TestBed.inject(AuthClientConfig);
    const config = authConfig.get();
    expect(config?.clientId).toBe(runtimeConfig.auth0.clientId);
    expect(config?.domain).toBe(runtimeConfig.auth0.domain);
    expect(config?.authorizationParams?.['redirect_uri']).toBe(
      runtimeConfig.auth0.redirectUri,
    );
  });
});
