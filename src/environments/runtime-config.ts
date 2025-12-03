export interface Auth0Config {
  domain: string;
  clientId: string;
  redirectUri: string;
  backend: string;
}

export interface RecaptchaConfig {
  siteKeyV2: string;
}

export interface PlatformUrlsConfig {
  bpaPlatform: string;
  galaxyPlatform: string;
  sbpPlatform?: string;
}

export interface EnvironmentConfig {
  production: boolean;
  auth0: Auth0Config;
  recaptcha: RecaptchaConfig;
  platformUrls: PlatformUrlsConfig;
}

export interface RuntimeEnvironmentConfig {
  production?: boolean;
  auth0?: Partial<Auth0Config>;
  recaptcha?: Partial<RecaptchaConfig>;
  platformUrls?: Partial<PlatformUrlsConfig>;
}

function resolveRedirectUri(value: string | undefined): string {
  return value?.trim() ? value : window.location.origin;
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
    platformUrls: {
      ...defaults.platformUrls,
      ...(runtime?.platformUrls ?? {}),
    },
  };
}
