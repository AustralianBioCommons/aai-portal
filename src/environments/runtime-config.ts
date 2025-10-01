export interface Auth0Config {
  domain: string;
  clientId: string;
  redirectUri: string;
  backend: string;
}

export interface RecaptchaConfig {
  siteKeyV2: string;
}

export interface EnvironmentConfig {
  production: boolean;
  auth0: Auth0Config;
  recaptcha: RecaptchaConfig;
}

export interface RuntimeEnvironmentConfig {
  production?: boolean;
  auth0?: Partial<Auth0Config>;
  recaptcha?: Partial<RecaptchaConfig>;
}

function resolveRedirectUri(value: string | undefined): string {
  return value && value.length > 0 ? value : window.location.origin;
}

export function mergeEnvironmentConfig(
  defaults: EnvironmentConfig,
  runtime?: RuntimeEnvironmentConfig,
): EnvironmentConfig {
  const mergedAuth0 = {
    ...defaults.auth0,
    ...(runtime?.auth0 ?? {}),
  };

  return {
    production: runtime?.production ?? defaults.production,
    auth0: {
      ...mergedAuth0,
      redirectUri: resolveRedirectUri(mergedAuth0.redirectUri),
    },
    recaptcha: {
      ...defaults.recaptcha,
      ...(runtime?.recaptcha ?? {}),
    },
  };
}
