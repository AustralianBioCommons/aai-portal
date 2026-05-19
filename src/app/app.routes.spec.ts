import { createRoutes } from './app.routes';
import { EnvironmentConfig } from '../environments/runtime-config';

describe('createRoutes', () => {
  const baseEnv: EnvironmentConfig = {
    production: false,
    auth0: {
      domain: 'dev.login.aai.test.biocommons.org.au',
      clientId: 'test-client-id',
      redirectUri: 'https://example.test/portal',
      backend: 'http://localhost:8000',
    },
    recaptcha: {
      siteKeyV2: 'test-site-key',
    },
    platformUrls: {
      bpaPlatform: 'https://example.test/bpa',
      bpaPlatformLogin: 'https://example.test/bpa/login',
      galaxyPlatform: 'https://example.test/galaxy',
      sbpPlatform: 'https://example.test/sbp',
    },
  };

  it('expect key routes to be defined', () => {
    const routes = createRoutes(baseEnv);
    const keyRoutes = ['login', 'register', 'profile', 'email-verification'];
    expect(
      routes.some((route) => keyRoutes.includes(route.path as string)),
    ).toBeTrue();
  });
});
