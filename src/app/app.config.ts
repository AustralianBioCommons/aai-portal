import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAuth0 } from '@auth0/auth0-angular';
import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { RecaptchaSettings, RECAPTCHA_SETTINGS } from 'ng-recaptcha-2';
import { RuntimeConfigLoaderService } from './core/config/runtime-config-loader.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAppInitializer(() => inject(RuntimeConfigLoaderService).load()),
    provideAuth0({
      domain: environment.auth0.domain,
      clientId: environment.auth0.clientId,
      authorizationParams: {
        redirect_uri: environment.auth0.redirectUri,
      },
      cacheLocation: 'localstorage',
    }),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    {
      provide: RECAPTCHA_SETTINGS,
      useFactory: () =>
        ({
          siteKey: environment.recaptcha.siteKeyV2,
        }) as RecaptchaSettings,
    },
  ],
};
