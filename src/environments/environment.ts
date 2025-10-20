import {
  EnvironmentConfig,
  RuntimeEnvironmentConfig,
  mergeEnvironmentConfig,
} from './runtime-config';

const defaults: EnvironmentConfig = {
  production: false,
  auth0: {
    domain: 'dev.login.aai.test.biocommons.org.au',
    clientId: 'oXjPRRuMIVrzpJY7Ku2ojs0gZNmPVKmS',
    redirectUri: '',
    backend: 'http://localhost:8000',
  },
  recaptcha: {
    siteKeyV2: '6LdR15krAAAAACZ5Lfx8yj2yBJ-whWNBTICNfwaG',
  },
  portals: {
    bpaPortal: 'https://aaidemo.bioplatforms.com',
  },
};

export const environment: EnvironmentConfig = mergeEnvironmentConfig(defaults);

export function updateEnvironment(runtime?: RuntimeEnvironmentConfig): void {
  const merged = mergeEnvironmentConfig(defaults, runtime);
  environment.production = merged.production;
  environment.auth0 = merged.auth0;
  environment.recaptcha = merged.recaptcha;
  environment.portals = merged.portals;
}

export const environmentDefaults = defaults;
