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

  it('disables SBP routes when auth0 domain is production', () => {
    const routes = createRoutes({
      ...baseEnv,
      production: true,
    });

    expect(routes.some((route) => route.path === 'sbp')).toBeFalse();
  });

  it('enables SBP routes when auth0 domain is not production', () => {
    const routes = createRoutes({
      ...baseEnv,
      production: false,
    });

    const sbpRoute = routes.find((route) => route.path === 'sbp');
    expect(sbpRoute).toBeTruthy();
    expect(
      sbpRoute?.children?.some((child) => child.path === 'register'),
    ).toBeTrue();
    expect(
      sbpRoute?.children?.some((child) => child.path === 'register/success'),
    ).toBeTrue();
  });
});
