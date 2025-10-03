import { TestBed } from '@angular/core/testing';
import {
  HttpBackend,
  HttpClientModule,
  HttpResponse,
  HttpEvent,
} from '@angular/common/http';
import { Observable, of } from 'rxjs';

import { RuntimeConfigLoaderService } from './runtime-config-loader.service';
import { AuthClientConfig } from '@auth0/auth0-angular';
import { RuntimeEnvironmentConfig } from '../../../environments/runtime-config';
import { updateEnvironment } from '../../../environments/environment';

class MockBackend implements HttpBackend {
  constructor(private readonly response: RuntimeEnvironmentConfig) {}

  handle(): Observable<HttpEvent<unknown>> {
    return of(new HttpResponse({ status: 200, body: this.response }));
  }
}

describe('RuntimeConfigLoaderService', () => {
  afterEach(() => {
    updateEnvironment();
    TestBed.resetTestingModule();
  });

  it('loads runtime config and updates AuthClientConfig', async () => {
    const runtimeConfig: RuntimeEnvironmentConfig = {
      auth0: {
        domain: 'example.auth0.com',
        clientId: 'runtime-client',
        redirectUri: 'https://runtime.example.com',
        backend: 'https://runtime.example.com/api',
      },
    };

    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [
        RuntimeConfigLoaderService,
        AuthClientConfig,
        { provide: HttpBackend, useValue: new MockBackend(runtimeConfig) },
      ],
    });

    const authConfig = TestBed.inject(AuthClientConfig);
    const service = TestBed.inject(RuntimeConfigLoaderService);
    await service.load();

    const config = authConfig.get();
    expect(config?.clientId).toEqual('runtime-client');
    expect(config?.domain).toEqual('example.auth0.com');
    expect(config?.authorizationParams?.redirect_uri).toEqual(
      'https://runtime.example.com',
    );
  });
});
