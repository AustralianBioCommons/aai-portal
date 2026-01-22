import { PlatformUrlsConfig } from '../../../environments/runtime-config';

type DeploymentEnvironment = 'dev' | 'staging' | 'prod';

const DEV_PLATFORM_URLS: Partial<PlatformUrlsConfig> = {
  bpaPlatform: 'https://aaidemo.bioplatforms.com',
  bpaPlatformLogin: 'https://aaidemo.bioplatforms.com/user/login',
  galaxyPlatform: 'https://dev.gvl.org.au',
};

const STAGING_PLATFORM_URLS: Partial<PlatformUrlsConfig> = {
  bpaPlatform: 'https://aaiquality.bioplatforms.com',
  bpaPlatformLogin: 'https://aaiquality.bioplatforms.com/user/login',
  galaxyPlatform: 'https://qaai.gvl.org.au',
};

function detectDeploymentEnvironment(hostname: string): DeploymentEnvironment {
  const host = hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host.startsWith('localhost:') ||
    host.includes('.dev.') ||
    host.startsWith('dev.') ||
    host.includes('-dev.') ||
    host.includes('dev-')
  ) {
    return 'dev';
  }
  if (
    host.includes('.test.') ||
    host.includes('.qa.') ||
    host.includes('quality') ||
    host.includes('staging') ||
    host.includes('-test.') ||
    host.includes('qa-')
  ) {
    return 'staging';
  }
  return 'prod';
}

export function resolvePlatformUrls(
  baseConfig: PlatformUrlsConfig,
  hostname: string = window.location.hostname,
): PlatformUrlsConfig {
  const environment = detectDeploymentEnvironment(hostname);

  if (environment === 'staging') {
    return { ...baseConfig, ...STAGING_PLATFORM_URLS };
  }

  if (environment === 'dev') {
    return { ...baseConfig, ...DEV_PLATFORM_URLS };
  }

  return baseConfig;
}
