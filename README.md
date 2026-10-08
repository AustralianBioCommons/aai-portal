# AAI Portal

![Tests](https://github.com/AustralianBiocommons/aai-portal/actions/workflows/test.yml/badge.svg)
![Coverage](https://github.com/AustralianBiocommons/aai-portal/actions/workflows/coverage.yml/badge.svg)
![Code Style](https://github.com/AustralianBiocommons/aai-portal/actions/workflows/lint.yml/badge.svg)

This project currently uses Angular v21.

## Project Info

- Default branch: `test`, deploys to: https://aaiportal.test.biocommons.org.au/
  - Automated deployment will be added in [AAI-153](https://biocloud.atlassian.net/browse/AAI-153).
- `main` branch is manually synced from `test` branch.
  - Automated releases from `main` branch will be added in [AAI-154](https://biocloud.atlassian.net/browse/AAI-154).

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## AAF integration — `dev-aaf` deployment

The `aaf-dev` branch targets the **`biocloud-dev-aaf`** Auth0 tenant
(`dev-aaf` environment), isolated from `dev-bc`. Every push to `aaf-dev`
automatically builds and deploys the portal through
[build-and-deploy-aaf-dev.yml](.github/workflows/build-and-deploy-aaf-dev.yml).
The workflow syncs the production bundle to S3 and invalidates CloudFront.
It excludes `*app-config.json` to preserve the hosted tenant's runtime config.

Point the app at the tenant via runtime config — edit
`src/assets/config/app-config.json`:

```json
"auth0": {
  "domain": "biocloud-dev-aaf.au.auth0.com",
  "clientId": "ZtroVyP0eDfVzpCBSnfYfXBCE6iCmo1R",
  "backend": "https://dev-aaf.api.aai.test.biocommons.org.au"
}
```

Run locally (set `backend` to `http://localhost:8000` if running the API locally):

```bash
npm ci && npm start        # http://localhost:4200
```

For a manual deployment to the hosted dev-aaf portal, preserve its runtime config:

```bash
aws sso login --profile aai
export AWS_PROFILE=aai AWS_REGION=ap-southeast-2
npm ci && npm run build
aws s3 sync ./dist/aai-portal/browser/ s3://aai-dev-aaf-portal/ --delete \
  --exclude '*app-config.json'
DIST=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?contains(Aliases.Items,'dev-aaf.portal.aai.test.biocommons.org.au')].Id | [0]" \
  --output text)
aws cloudfront create-invalidation --distribution-id "$DIST" --paths "/*"
```

AAF registration starts with the portal's email check. If the email is available
and the login proxy identifies an AAF institution, the portal offers institutional
login. Continuing passes `login_hint` with the entered email and
`connection: 'AAF'` to Auth0, routing directly to the AAF connection. Standard
login still uses Auth0's Identifier-First / Home-Realm Discovery configuration
(see `aai-infrastructure`).

After institutional authentication, new AAF users complete registration at
`/aaf-register` using the session token and state supplied by Auth0. The portal
prefills institution-provided identity details and submits to the backend's
`/biocommons/register-aaf` endpoint, then follows the returned Auth0 continuation
URL.

Hosted at <https://dev-aaf.portal.aai.test.biocommons.org.au>.
