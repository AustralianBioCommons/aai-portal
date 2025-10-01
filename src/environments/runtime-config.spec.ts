import {
  EnvironmentConfig,
  RuntimeEnvironmentConfig,
  mergeEnvironmentConfig,
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

  it('returns defaults merged with redirect fallback when runtime config is absent', () => {
    const result = mergeEnvironmentConfig(defaults);

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

    const result = mergeEnvironmentConfig(defaults, runtime);

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
    const withRedirect = mergeEnvironmentConfig(defaults, {
      auth0: {
        redirectUri: 'https://app.example.org/callback',
      },
    });
    expect(withRedirect.auth0.redirectUri).toBe(
      'https://app.example.org/callback',
    );

    const fallbackRedirect = mergeEnvironmentConfig(defaults, {
      auth0: {
        redirectUri: '',
      },
    });
    expect(fallbackRedirect.auth0.redirectUri).toBe(window.location.origin);
  });
});
