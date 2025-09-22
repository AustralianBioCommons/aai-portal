export const environment = {
  production: true,
  auth0: {
    domain: 'prod-placeholder',
    clientId: 'prod-placeholder-client-id',
    redirectUri: window.location.origin,
    audience: 'https://example-prod-audience',
    scope: 'read:current_user update:current_user_metadata',
    backend: 'https://api.example.com',
  },
  siteUrl: 'https://example.com',
};
