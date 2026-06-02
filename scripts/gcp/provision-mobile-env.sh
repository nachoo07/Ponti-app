#!/usr/bin/env bash
#
# Provisiona la infraestructura GCP para desplegar Ponti Mobile (BFF en Cloud Run
# + UI en Firebase Hosting) en un ambiente dado. Refleja exactamente lo aplicado
# y verificado el 2026-06-02 contra el estado real de los proyectos compartidos.
#
# Principios:
#   - Idempotente: se puede correr varias veces; crea solo lo que falta.
#   - NO destructivo: solo AGREGA recursos/permisos de mobile.
#       * NUNCA toca el secret `x-api-key-<env>` (ya existe, lo comparte el backend).
#       * La condición del WIF provider se actualiza APPEND-ONLY (preserva los repos previos).
#       * No quita ningún binding; no toca el backend, otros servicios ni la BDD.
#
# Uso:
#   GITHUB_REPO="nachoo07/Ponti-app" ./scripts/gcp/provision-mobile-env.sh <stg|prod>
#
# Opcionales (env vars):
#   WEB_API_KEY_DISPLAY_NAME=...    # nombre de la API key web a usar para identity (default por ambiente)
#   IDENTITY_PLATFORM_API_KEY_VALUE=...  # forzar el valor del secret identity (en vez de leerlo del Web API Key)
#
# Requisitos: gcloud autenticado con permisos de admin en el proyecto destino
# (Artifact Registry, Secret Manager, Workload Identity, Service Accounts, Firebase Hosting).

set -euo pipefail

ENVIRONMENT="${1:-}"
REGION="${REGION:-us-central1}"
REPOSITORY="${REPOSITORY:-cloud-run-source-deploy}"
POOL_ID="${POOL_ID:-github-actions-pool}"
PROVIDER_ID="${PROVIDER_ID:-github-actions-provider}"
GITHUB_REPO="${GITHUB_REPO:-nachoo07/Ponti-app}"

case "$ENVIRONMENT" in
  stg)
    PROJECT_ID="new-ponti-stg";  SITE_ID="ponti-mobile-stg";  SECRET_SUFFIX="stg"
    WEB_KEY_DEFAULT="identity-platform-web-stg" ;;
  prod)
    PROJECT_ID="new-ponti-prod"; SITE_ID="ponti-mobile-prod"; SECRET_SUFFIX="prod"
    WEB_KEY_DEFAULT="ponti-frontend-prod" ;;
  dev)
    PROJECT_ID="new-ponti-dev";  SITE_ID="ponti-mobile-dev";  SECRET_SUFFIX="dev"
    WEB_KEY_DEFAULT="identity-platform-web-dev" ;;
  *)
    echo "Uso: $0 <stg|prod>" >&2; exit 1 ;;
esac

WEB_API_KEY_DISPLAY_NAME="${WEB_API_KEY_DISPLAY_NAME:-$WEB_KEY_DEFAULT}"
RUNTIME_SA="cloudrun-sa@${PROJECT_ID}.iam.gserviceaccount.com"
DEPLOYER_SA="github-actions@${PROJECT_ID}.iam.gserviceaccount.com"
SECRET_X_API_KEY="x-api-key-${SECRET_SUFFIX}"
SECRET_IDENTITY="identity-platform-api-key-${SECRET_SUFFIX}"

echo "==========================================================="
echo " Provisión Ponti Mobile :: ${ENVIRONMENT} (${PROJECT_ID})"
echo "==========================================================="
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
echo "Project number: ${PROJECT_NUMBER}"

# ---------------------------------------------------------------------------
# 1) APIs (idempotente)
# ---------------------------------------------------------------------------
echo "--> [1/6] APIs..."
gcloud services enable \
  run.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com \
  firebasehosting.googleapis.com iam.googleapis.com iamcredentials.googleapis.com \
  sts.googleapis.com identitytoolkit.googleapis.com apikeys.googleapis.com \
  --project="$PROJECT_ID"

# ---------------------------------------------------------------------------
# 2) Artifact Registry repo (docker)
# ---------------------------------------------------------------------------
echo "--> [2/6] Artifact Registry '${REPOSITORY}'..."
if gcloud artifacts repositories describe "$REPOSITORY" --location="$REGION" --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo "    ya existe."
else
  gcloud artifacts repositories create "$REPOSITORY" \
    --repository-format=docker --location="$REGION" \
    --description="Cloud Run images (ponti-mobile)" --project="$PROJECT_ID"
fi

# ---------------------------------------------------------------------------
# 3) Secrets
#    - x-api-key-<env>: NO se toca (ya existe, compartido con el backend). Solo se verifica.
#    - identity-platform-api-key-<env>: se crea si falta y se carga 1 versión si no tiene ninguna.
# ---------------------------------------------------------------------------
echo "--> [3/6] Secrets..."
if gcloud secrets describe "$SECRET_X_API_KEY" --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo "    ${SECRET_X_API_KEY}: existe (NO se toca, lo reusa mobile)."
else
  echo "    AVISO: ${SECRET_X_API_KEY} NO existe. Debería haberlo creado el backend. Revisar antes de desplegar."
fi

if gcloud secrets describe "$SECRET_IDENTITY" --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo "    ${SECRET_IDENTITY}: existe."
else
  gcloud secrets create "$SECRET_IDENTITY" --replication-policy=automatic --project="$PROJECT_ID"
  echo "    ${SECRET_IDENTITY}: creado."
fi

ENABLED_VERS="$(gcloud secrets versions list "$SECRET_IDENTITY" --filter="state=ENABLED" --format='value(name)' --project="$PROJECT_ID" 2>/dev/null | wc -l | tr -d ' ')"
if [[ "$ENABLED_VERS" -gt 0 ]]; then
  echo "    ${SECRET_IDENTITY}: ya tiene ${ENABLED_VERS} versión(es) habilitada(s) -> no se sobreescribe."
else
  if [[ -n "${IDENTITY_PLATFORM_API_KEY_VALUE:-}" ]]; then
    KEY_STR="$IDENTITY_PLATFORM_API_KEY_VALUE"
    echo "    usando IDENTITY_PLATFORM_API_KEY_VALUE provisto."
  else
    KEY_RES="$(gcloud services api-keys list --project="$PROJECT_ID" \
      --filter="displayName=${WEB_API_KEY_DISPLAY_NAME}" --format='value(name)' | head -1)"
    if [[ -z "$KEY_RES" ]]; then
      echo "    ERROR: no encontré la Web API Key '${WEB_API_KEY_DISPLAY_NAME}'. Pasá IDENTITY_PLATFORM_API_KEY_VALUE o WEB_API_KEY_DISPLAY_NAME." >&2
      exit 1
    fi
    KEY_STR="$(gcloud services api-keys get-key-string "$KEY_RES" --project="$PROJECT_ID" --format='value(keyString)')"
  fi
  if [[ "${#KEY_STR}" -lt 30 ]]; then
    echo "    ERROR: la key parece inválida (largo ${#KEY_STR})." >&2; exit 1
  fi
  printf '%s' "$KEY_STR" | gcloud secrets versions add "$SECRET_IDENTITY" --data-file=- --project="$PROJECT_ID" >/dev/null
  unset KEY_STR
  echo "    ${SECRET_IDENTITY}: versión cargada (largo verificado, valor no impreso)."
fi

# El runtime SA suele tener secretAccessor a nivel proyecto; igual lo aseguramos en este secret (aditivo/idempotente).
gcloud secrets add-iam-policy-binding "$SECRET_IDENTITY" \
  --member="serviceAccount:${RUNTIME_SA}" --role="roles/secretmanager.secretAccessor" \
  --project="$PROJECT_ID" >/dev/null
echo "    secretAccessor de ${RUNTIME_SA} sobre ${SECRET_IDENTITY}: OK."

# ---------------------------------------------------------------------------
# 4) Firebase Hosting site (vía REST + token de gcloud; usa x-goog-user-project)
# ---------------------------------------------------------------------------
echo "--> [4/6] Firebase Hosting site '${SITE_ID}'..."
TOKEN="$(gcloud auth print-access-token)"
EXISTS="$(curl -s -H "Authorization: Bearer ${TOKEN}" -H "x-goog-user-project: ${PROJECT_ID}" \
  "https://firebasehosting.googleapis.com/v1beta1/projects/${PROJECT_ID}/sites" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('yes' if any(s.get('name','').split('/')[-1]=='${SITE_ID}' for s in d.get('sites',[])) else 'no')" 2>/dev/null || echo "err")"
if [[ "$EXISTS" == "yes" ]]; then
  echo "    ya existe."
elif [[ "$EXISTS" == "no" ]]; then
  curl -s -X POST -H "Authorization: Bearer ${TOKEN}" -H "x-goog-user-project: ${PROJECT_ID}" \
    -H "Content-Type: application/json" \
    "https://firebasehosting.googleapis.com/v1beta1/projects/${PROJECT_ID}/sites?siteId=${SITE_ID}" -d '{}' \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print('    creado ->', d.get('defaultUrl')) if 'name' in d else print('    RESP:', json.dumps(d)[:300])"
else
  echo "    AVISO: no pude consultar sites por REST. Crealo a mano: firebase hosting:sites:create ${SITE_ID} --project ${PROJECT_ID}"
fi

# ---------------------------------------------------------------------------
# 5) Workload Identity Federation: habilitar el repo de mobile
#    5a) attributeCondition del provider (COMPARTIDO) -> APPEND-ONLY con guardas.
#    5b) bindings del deployer SA (aditivos).
# ---------------------------------------------------------------------------
echo "--> [5/6] WIF para ${GITHUB_REPO}..."
CURRENT_COND="$(gcloud iam workload-identity-pools providers describe "$PROVIDER_ID" \
  --location=global --workload-identity-pool="$POOL_ID" --project="$PROJECT_ID" \
  --format='value(attributeCondition)' 2>/dev/null)"
if [[ -z "$CURRENT_COND" ]]; then
  echo "    AVISO: el provider no tiene attributeCondition o no existe. Reviso manualmente antes de tocar (no modifico)."
elif echo "$CURRENT_COND" | grep -q "$GITHUB_REPO"; then
  echo "    condición ya incluye ${GITHUB_REPO}: no se modifica."
else
  NEW_COND="${CURRENT_COND} || assertion.repository=='${GITHUB_REPO}'"
  gcloud iam workload-identity-pools providers update-oidc "$PROVIDER_ID" \
    --location=global --workload-identity-pool="$POOL_ID" --project="$PROJECT_ID" \
    --attribute-condition="$NEW_COND"
  echo "    condición actualizada (append-only)."
fi

MEMBER="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/attribute.repository/${GITHUB_REPO}"
gcloud iam service-accounts add-iam-policy-binding "$DEPLOYER_SA" --project="$PROJECT_ID" \
  --role="roles/iam.workloadIdentityUser" --member="$MEMBER" --condition=None >/dev/null
gcloud iam service-accounts add-iam-policy-binding "$DEPLOYER_SA" --project="$PROJECT_ID" \
  --role="roles/iam.serviceAccountTokenCreator" --member="$MEMBER" --condition=None >/dev/null
echo "    bindings workloadIdentityUser + serviceAccountTokenCreator: OK."

# ---------------------------------------------------------------------------
# 6) Roles de deploy del deployer SA (suelen ya existir; aseguramos idempotente/aditivo)
# ---------------------------------------------------------------------------
echo "--> [6/6] Roles de deploy de ${DEPLOYER_SA} (aditivo; normalmente ya presentes)..."
for ROLE in roles/run.admin roles/artifactregistry.writer roles/firebasehosting.admin roles/iam.serviceAccountUser; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${DEPLOYER_SA}" --role="$ROLE" --condition=None >/dev/null
done
echo "    OK."

echo ""
echo "==========================================================="
echo " ${ENVIRONMENT} (${PROJECT_ID}) provisionado."
echo " Variables GitHub (referencia):"
echo "   GCP_PROJECT_ID_${SECRET_SUFFIX^^}=${PROJECT_ID}"
echo "   SERVICE_NAME_${SECRET_SUFFIX^^}=ponti-mobile"
echo "   FIREBASE_HOSTING_SITE_${SECRET_SUFFIX^^}=${SITE_ID}"
echo "   CLOUD_RUN_SERVICE_ACCOUNT_${SECRET_SUFFIX^^}=${RUNTIME_SA}"
echo "   WIF_SERVICE_ACCOUNT_${SECRET_SUFFIX^^}=${DEPLOYER_SA}"
echo "   WIF_PROVIDER_${SECRET_SUFFIX^^}=projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/providers/${PROVIDER_ID}"
echo "==========================================================="
