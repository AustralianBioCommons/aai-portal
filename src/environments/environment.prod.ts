// Production build but uses test infrastructure for now
export const environment = {
  production: true,
  auth0: {
    domain: 'login.test.biocommons.org.au',
    clientId: 'oXjPRRuMIVrzpJY7Ku2ojs0gZNmPVKmS',
    redirectUri: window.location.origin,
    audience: 'https://dev-bc.au.auth0.com/api/v2/',
    scope: 'read:current_user update:current_user_metadata',
    backend: 'https://aaibackend.test.biocommons.org.au',
  },
  recaptcha: {
    siteKeyV2: '6LdR15krAAAAACZ5Lfx8yj2yBJ-whWNBTICNfwaG',
  },
};
