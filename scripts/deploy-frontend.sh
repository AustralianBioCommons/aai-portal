#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: deploy-frontend.sh env=<environment> --profile <aws-profile>

Example:
  ./deploy-frontend.sh env=dev --profile aai
USAGE
}

ENVIRONMENT=""
PROFILE=""

for arg in "$@"; do
  case "$arg" in
    env=*)
      ENVIRONMENT="${arg#env=}"
      shift
      ;;
    --profile)
      PROFILE="$2"
      shift 2
      ;;
    --profile=*)
      PROFILE="${arg#--profile=}"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
  esac
done

if [[ -z "$ENVIRONMENT" || -z "$PROFILE" ]]; then
  echo "Error: env=<environment> and --profile must be supplied."
  usage
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "Error: jq is required."
  exit 1
fi

export AWS_PAGER=""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORTAL_DIR="$(cd "$SCRIPT_DIR/../" && pwd)"

FRONTEND_PREFIXES=("/${ENVIRONMENT}/frontend" "/aai/frontend/${ENVIRONMENT}")
SECRET_NAMES=("${ENVIRONMENT}/auth0" "/aai/backend/${ENVIRONMENT}/auth0")

ssm_param() {
  local key="$1" value
  for prefix in "${FRONTEND_PREFIXES[@]}"; do
    if value=$(aws ssm get-parameter \
      --with-decryption \
      --name "${prefix}/${key}" \
      --profile "$PROFILE" \
      --query 'Parameter.Value' \
      --output text 2>/dev/null); then
      echo "$value"
      return 0
    fi
  done
  echo "Error: unable to resolve SSM parameter '${key}' for env '${ENVIRONMENT}'." >&2
  exit 1
}

SECRET_JSON=""
for secret in "${SECRET_NAMES[@]}"; do
  if SECRET_JSON=$(aws secretsmanager get-secret-value \
    --secret-id "$secret" \
    --profile "$PROFILE" \
    --query 'SecretString' \
    --output text 2>/dev/null); then
    break
  fi
done

if [[ -z "$SECRET_JSON" ]]; then
  echo "Error: unable to fetch Auth0 secret for env '${ENVIRONMENT}'." >&2
  exit 1
fi

AUTH0_DOMAIN=$(echo "$SECRET_JSON" | jq -r '.DOMAIN // empty')
AUTH0_CLIENT_ID=$(echo "$SECRET_JSON" | jq -r '.CLIENT_ID // empty')
AUTH0_AUDIENCE=$(echo "$SECRET_JSON" | jq -r '.AUDIENCE // empty')

if [[ -z "$AUTH0_DOMAIN" || -z "$AUTH0_CLIENT_ID" || -z "$AUTH0_AUDIENCE" ]]; then
  echo "Error: Auth0 secret missing DOMAIN, CLIENT_ID, or AUDIENCE." >&2
  exit 1
fi

BACKEND_BASE_URL=$(ssm_param "backend-base-url")
SITE_URL=$(ssm_param "site-url")
SITE_BUCKET=$(ssm_param "bucket-name")
DISTRIBUTION_ID=$(ssm_param "distribution-id")

FRONTEND_SECRET_JSON=""
FRONTEND_SECRET_ID="/${ENVIRONMENT}/frontend/secrets"
if FRONTEND_SECRET_JSON=$(aws secretsmanager get-secret-value \
  --secret-id "$FRONTEND_SECRET_ID" \
  --profile "$PROFILE" \
  --query 'SecretString' \
  --output text 2>/dev/null); then
  RECAPTCHA_KEY=$(echo "$FRONTEND_SECRET_JSON" | jq -r '.RECAPTCHA_KEY // empty')
else
  RECAPTCHA_KEY=""
fi

case "$ENVIRONMENT" in
  dev)
    ANGULAR_CONFIG="dev"
    PRODUCTION_FLAG="false"
    ENV_FILE_SUFFIX="dev"
    ;;
  test)
    ANGULAR_CONFIG="test"
    PRODUCTION_FLAG="false"
    ENV_FILE_SUFFIX="test"
    ;;
  qa)
    ANGULAR_CONFIG="qa"
    PRODUCTION_FLAG="false"
    ENV_FILE_SUFFIX="qa"
    ;;
  prod)
    ANGULAR_CONFIG="production"
    PRODUCTION_FLAG="true"
    ENV_FILE_SUFFIX="prod"
    ;;
  *)
    echo "Error: unsupported environment '$ENVIRONMENT'. Use dev, test, qa, or prod." >&2
    exit 1
    ;;
esac

GENERATED_ENV_FILE="$PORTAL_DIR/src/environments/environment.${ENV_FILE_SUFFIX}.ts"

cat > "$GENERATED_ENV_FILE" <<EOF
export const environment = {
  production: ${PRODUCTION_FLAG},
  auth0: {
    domain: '${AUTH0_DOMAIN}',
    clientId: '${AUTH0_CLIENT_ID}',
    redirectUri: window.location.origin,
    audience: '${AUTH0_AUDIENCE}',
    scope: 'read:current_user update:current_user_metadata',
    backend: '${BACKEND_BASE_URL}',
  },
  siteUrl: '${SITE_URL}',
  recaptcha: {
    siteKeyV2: '${RECAPTCHA_KEY}'
  },
};
EOF

pushd "$PORTAL_DIR" >/dev/null
npm install
npx ng build --configuration "${ANGULAR_CONFIG}"
popd >/dev/null

aws s3 sync "$PORTAL_DIR/dist/aai-portal/" "s3://${SITE_BUCKET}/" \
  --delete \
  --profile "$PROFILE"

aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*" \
  --profile "$PROFILE"

echo "Frontend for environment '${ENVIRONMENT}' deployed successfully."
