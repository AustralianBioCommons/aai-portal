export const environment = {
  production: false,
  auth0: {
    domain: 'dev.login.aai.test.biocommons.org.au',
    clientId: 'oXjPRRuMIVrzpJY7Ku2ojs0gZNmPVKmS',
    redirectUri: window.location.origin,
    backend: 'http://localhost:8000',
  },
  recaptcha: {
    siteKeyV2: '6LdR15krAAAAACZ5Lfx8yj2yBJ-whWNBTICNfwaG',
  },
};
