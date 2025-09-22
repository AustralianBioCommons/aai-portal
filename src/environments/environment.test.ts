export const environment = {
  production: false,
  auth0: {
    domain: 'test-placeholder',
    clientId: 'test-placeholder-client-id',
    redirectUri: window.location.origin,
    audience: 'https://example-test-audience',
    scope: 'read:current_user update:current_user_metadata',
    backend: 'https://api.test.example.com',
  },
  siteUrl: 'https://test.example.com',
};
