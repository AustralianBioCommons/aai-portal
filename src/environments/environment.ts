export const environment = {
  production: false,
  auth0: {
    domain: 'login.test.biocommons.org.au',
    clientId: 'oXjPRRuMIVrzpJY7Ku2ojs0gZNmPVKmS',
    redirectUri: window.location.origin,
    audience: 'https://dev-bc.au.auth0.com/api/v2/',
    scope: 'read:current_user update:current_user_metadata',
    // backend: 'https://aaibackend.test.biocommons.org.au',
    backend: 'http://localhost:8000',
  },
  recaptcha: {
    siteKeyV2: '6LdR15krAAAAACZ5Lfx8yj2yBJ-whWNBTICNfwaG',
  },
};
