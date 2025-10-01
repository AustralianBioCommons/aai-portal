import {
  EnvironmentConfig,
  RuntimeEnvironmentConfig,
  withRuntimeConfig,
} from './runtime-config';

describe('Runtime configuration Tests', () => {
  const defaults: EnvironmentConfig = {
    production: false,
    auth0: {
      domain: 'default.domain',
      clientId: 'default-client',
      redirectUri: '',
      backend: 'http://localhost:8000',
    },
    recaptcha: {
      siteKeyV2: 'default-key',
    },
  };

  const runtimeWindow = window as Window & {
    __APP_CONFIG__?: RuntimeEnvironmentConfig;
  };

  beforeEach(() => {
    delete runtimeWindow.__APP_CONFIG__;
  });

  it('returns defaults merged with redirect fallback when no runtime config is present', () => {
    const result = withRuntimeConfig(defaults);

    expect(result.production).toBe(false);
    expect(result.auth0.domain).toBe('default.domain');
    expect(result.auth0.backend).toBe('http://localhost:8000');
    expect(result.recaptcha.siteKeyV2).toBe('default-key');
    expect(result.auth0.redirectUri).toBe(window.location.origin);

    // defaults should remain untouched
    expect(defaults.auth0.redirectUri).toBe('');
  });

  it('merges runtime overrides deeply without mutating defaults', () => {
    const runtime: RuntimeEnvironmentConfig = {
      production: true,
      auth0: {
        domain: 'override.domain',
        backend: 'https://api.example.org',
      },
      recaptcha: {
        siteKeyV2: 'override-key',
      },
    };

    runtimeWindow.__APP_CONFIG__ = runtime;

    const result = withRuntimeConfig(defaults);

    expect(result.production).toBe(true);
    expect(result.auth0.domain).toBe('override.domain');
    expect(result.auth0.backend).toBe('https://api.example.org');
    expect(result.recaptcha.siteKeyV2).toBe('override-key');
    expect(result.auth0.clientId).toBe('default-client');
    expect(result.auth0.redirectUri).toBe(window.location.origin);

    // Ensure defaults object was not mutated
    expect(defaults.production).toBe(false);
    expect(defaults.auth0.domain).toBe('default.domain');
    expect(defaults.recaptcha.siteKeyV2).toBe('default-key');
  });

  it('honours runtime redirectUri when provided and falls back when empty', () => {
    runtimeWindow.__APP_CONFIG__ = {
      auth0: {
        redirectUri: 'https://app.example.org/callback',
      },
    } satisfies RuntimeEnvironmentConfig;

    const withRedirect = withRuntimeConfig(defaults);
    expect(withRedirect.auth0.redirectUri).toBe(
      'https://app.example.org/callback',
    );

    runtimeWindow.__APP_CONFIG__ = {
      auth0: {
        redirectUri: '',
      },
    } satisfies RuntimeEnvironmentConfig;

    const fallbackRedirect = withRuntimeConfig(defaults);
    expect(fallbackRedirect.auth0.redirectUri).toBe(window.location.origin);
  });
});
