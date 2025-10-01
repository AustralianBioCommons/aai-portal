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

export type RuntimeEnvironmentConfig = Partial<EnvironmentConfig> & {
  auth0?: Partial<Auth0Config>;
  recaptcha?: Partial<RecaptchaConfig>;
};

interface RuntimeWindow extends Window {
  __APP_CONFIG__?: RuntimeEnvironmentConfig;
}

function applyRedirectFallback(config: EnvironmentConfig): EnvironmentConfig {
  return {
    ...config,
    auth0: {
      ...config.auth0,
      redirectUri:
        config.auth0.redirectUri && config.auth0.redirectUri.length > 0
          ? config.auth0.redirectUri
          : window.location.origin,
    },
  };
}

export function withRuntimeConfig(
  defaults: EnvironmentConfig,
): EnvironmentConfig {
  const runtime = (window as RuntimeWindow).__APP_CONFIG__;

  if (!runtime) {
    return applyRedirectFallback(defaults);
  }

  const merged: EnvironmentConfig = {
    ...defaults,
    ...runtime,
    auth0: {
      ...defaults.auth0,
      ...runtime.auth0,
    },
    recaptcha: {
      ...defaults.recaptcha,
      ...runtime.recaptcha,
    },
  };

  return applyRedirectFallback(merged);
}

declare global {
  interface Window {
    __APP_CONFIG__?: RuntimeEnvironmentConfig;
  }
}

export {};
