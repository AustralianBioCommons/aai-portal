export const environment = {
  production: false,
  auth0: {
    domain: 'qa-placeholder',
    clientId: 'qa-placeholder-client-id',
    redirectUri: window.location.origin,
    audience: 'https://example-qa-audience',
    scope: 'read:current_user update:current_user_metadata',
    backend: 'https://api.qa.example.com',
  },
  siteUrl: 'https://qa.example.com',
};
