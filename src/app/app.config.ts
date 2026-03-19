import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { provideAuth0 } from '@auth0/auth0-angular';
import { createRoutes } from './app.routes';
import { environment, environmentDefaults } from '../environments/environment';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { RecaptchaSettings, RECAPTCHA_SETTINGS } from 'ng-recaptcha-2';
import { RuntimeConfigLoaderService } from './core/config/runtime-config-loader.service';
import { mergeEnvironmentConfig } from '../environments/runtime-config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter([]),
    provideAppInitializer(async () => {
      const loader = inject(RuntimeConfigLoaderService);
      const router = inject(Router);

      const runtime = await loader.load();
      const merged = mergeEnvironmentConfig(environmentDefaults, runtime);

      router.resetConfig(createRoutes(merged));
    }),
    provideAuth0({
      domain: '',
      clientId: '',
      authorizationParams: {
        redirect_uri: window.location.origin,
      },
      cacheLocation: 'localstorage',
    }),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideZoneChangeDetection({ eventCoalescing: true }),
    {
      provide: RECAPTCHA_SETTINGS,
      useFactory: () =>
        ({
          siteKey: environment.recaptcha.siteKeyV2,
        }) as RecaptchaSettings,
    },
  ],
};
