export const environment = {
  production: false,
  auth0: {
    domain: 'dev-placeholder',
    clientId: 'dev-placeholder-client-id',
    redirectUri: window.location.origin,
    audience: 'https://example-dev-audience',
    scope: 'read:current_user update:current_user_metadata',
    backend: 'https://api.dev.example.com',
  },
  siteUrl: 'https://dev.example.com',
  recaptcha: {
    siteKeyV2: ''
  }
};
