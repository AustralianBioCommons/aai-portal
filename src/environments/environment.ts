export const environment = {
  production: false,
  auth0: {
    domain: 'dev-bc.au.auth0.com',
    clientId: 'oXjPRRuMIVrzpJY7Ku2ojs0gZNmPVKmS',
    redirectUri: window.location.origin,
    audience: 'https://dev-bc.au.auth0.com/api/v2/',
    scope: 'read:current_user update:current_user_metadata',
    backend: 'http://localhost:8000',
  },
};
