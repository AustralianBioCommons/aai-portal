// Production build but uses test infrastructure for now
export const environment = {
  production: true,
  auth0: {
    domain: 'dev.login.aai.test.biocommons.org.au',
    clientId: 'oXjPRRuMIVrzpJY7Ku2ojs0gZNmPVKmS',
    redirectUri: window.location.origin,
    backend: 'https://aaibackend.test.biocommons.org.au',
  },
  recaptcha: {
    siteKeyV2: '6LdR15krAAAAACZ5Lfx8yj2yBJ-whWNBTICNfwaG',
  },
};
