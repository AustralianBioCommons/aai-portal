export const environment = {
  production: false,
  auth0: {
    domain: 'localhost',
    clientId: 'local-client-id',
    redirectUri: window.location.origin,
    audience: '',
    scope: 'read:current_user update:current_user_metadata',
    backend: 'http://localhost:8000',
  },
  siteUrl: 'http://localhost:4200',
};
