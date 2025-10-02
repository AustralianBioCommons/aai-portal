import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthClientConfig } from '@auth0/auth0-angular';
import { firstValueFrom, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import {
  RuntimeEnvironmentConfig,
  mergeEnvironmentConfig,
} from '../../../environments/runtime-config';
import {
  environmentDefaults,
  updateEnvironment,
} from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RuntimeConfigLoaderService {
  private readonly http = inject(HttpClient);
  private readonly authClientConfig = inject(AuthClientConfig);

  load(): Promise<void> {
    return firstValueFrom(
      this.http
        .get<RuntimeEnvironmentConfig>('assets/config/app-config.json')
        .pipe(
          catchError((error) => {
            console.error(
              'Failed to load runtime config. Using defaults.',
              error,
            );
            return of({} as RuntimeEnvironmentConfig);
          }),
          tap((runtime) => {
            updateEnvironment(runtime);
            const merged = mergeEnvironmentConfig(environmentDefaults, runtime);
            this.authClientConfig.set({
              domain: merged.auth0.domain,
              clientId: merged.auth0.clientId,
              authorizationParams: {
                redirect_uri: merged.auth0.redirectUri,
              },
              cacheLocation: 'localstorage',
            });
          }),
        ),
    )
      .then(() => undefined)
      .catch(() => undefined);
  }
}
