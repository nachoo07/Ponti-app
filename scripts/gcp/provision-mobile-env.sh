#!/usr/bin/env bash
#
# Provisiona la infraestructura GCP necesaria para desplegar Ponti Mobile
# (BFF en Cloud Run + UI en Firebase Hosting) en un ambiente dado.
#
# Idempotente: se puede correr varias veces. Cada recurso se crea sólo si falta.
# NO crea proyectos GCP (ya existen) ni configura Identity Platform (ver runbook).
#
# Uso:
#   GITHUB_REPO="org/ponti-mobile" \
#   X_API_KEY_VALUE="..." \
#   IDENTITY_PLATFORM_API_KEY_VALUE="..." \
#     ./scripts/gcp/provision-mobile-env.sh <stg|prod>
#
# Si no se pasan los *_VALUE, los secrets NO se rellenan (sólo se crean vacíos
# o se dejan como están) y se avisa para cargarlos a mano.
#
# Requisitos: gcloud autenticado con permisos de admin en el proyecto destino,
# y firebase-tools (se usa vía npx). La cuenta debe poder:
#   - habilitar servicios, crear repos de Artifact Registry, secrets,
#     editar IAM y bindings de Workload Identity.

set -euo pipefail

ENVIRONMENT="${1:-}"
REGION="${REGION:-us-central1}"
REPOSITORY="${REPOSITORY:-cloud-run-source-deploy}"
SERVICE_NAME="${SERVICE_NAME:-ponti-mobile}"
POOL_ID="${POOL_ID:-github-actions-pool}"
FIREBASE_CLI="${FIREBASE_CLI:-npx -y firebase-tools@15.16.0}"

case "$ENVIRONMENT" in
  stg)
    PROJECT_ID="new-ponti-stg"
    SITE_ID="ponti-mobile-stg"
    SECRET_SUFFIX="stg"
    ;;
  prod)
    PROJECT_ID="new-ponti-prod"
    SITE_ID="ponti-mobile-prod"
    SECRET_SUFFIX="prod"
    ;;
  *)
    echo "Uso: $0 <stg|prod>" >&2
    exit 1
    ;;
esac

GITHUB_REPO="${GITHUB_REPO:-}"
RUNTIME_SA="cloudrun-sa@${PROJECT_ID}.iam.gserviceaccount.com"
DEPLOYER_SA="github-actions@${PROJECT_ID}.iam.gserviceaccount.com"
SECRET_X_API_KEY="x-api-key-${SECRET_SUFFIX}"
SECRET_IDENTITY="identity-platform-api-key-${SECRET_SUFFIX}"

echo "==========================================================="
echo " Provisión Ponti Mobile :: ambiente=${ENVIRONMENT} proyecto=${PROJECT_ID}"
echo "==========================================================="

PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
echo "Project number: ${PROJECT_NUMBER}"

# ---------------------------------------------------------------------------
# 1) Habilitar APIs (idempotente; no falla si ya están habilitadas)
# ---------------------------------------------------------------------------
echo "--> [1/7] Habilitando APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  firebasehosting.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  sts.googleapis.com \
  identitytoolkit.googleapis.com \
  --project="$PROJECT_ID"

# ---------------------------------------------------------------------------
# 2) Artifact Registry repo (docker)
# ---------------------------------------------------------------------------
echo "--> [2/7] Artifact Registry repo '${REPOSITORY}'..."
if gcloud artifacts repositories describe "$REPOSITORY" \
     --location="$REGION" --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo "    ya existe."
else
  gcloud artifacts repositories create "$REPOSITORY" \
    --repository-format=docker \
    --location="$REGION" \
    --description="Imágenes Cloud Run (ponti-mobile)" \
    --project="$PROJECT_ID"
fi

# ---------------------------------------------------------------------------
# 3) Firebase Hosting site
# ---------------------------------------------------------------------------
echo "--> [3/7] Firebase Hosting site '${SITE_ID}'..."
if $FIREBASE_CLI hosting:sites:list --project "$PROJECT_ID" 2>/dev/null | grep -q "$SITE_ID"; then
  echo "    ya existe."
else
  $FIREBASE_CLI hosting:sites:create "$SITE_ID" --project "$PROJECT_ID" --non-interactive \
    || echo "    AVISO: no se pudo crear el site (¿ya existe o falta auth de firebase?). Verificar a mano."
fi

# ---------------------------------------------------------------------------
# 4) Secret Manager: crear secrets y (opcional) cargar versión
# ---------------------------------------------------------------------------
ensure_secret() {
  local name="$1" value="$2"
  if gcloud secrets describe "$name" --project="$PROJECT_ID" >/dev/null 2>&1; then
    echo "    secret '${name}' ya existe."
  else
    gcloud secrets create "$name" --replication-policy="automatic" --project="$PROJECT_ID"
    echo "    secret '${name}' creado."
  fi
  if [[ -n "$value" ]]; then
    printf '%s' "$value" | gcloud secrets versions add "$name" --data-file=- --project="$PROJECT_ID" >/dev/null
    echo "    nueva versión cargada en '${name}'."
  else
    echo "    SIN VALOR: cargá una versión con:"
    echo "      printf '%s' 'TU_VALOR' | gcloud secrets versions add ${name} --data-file=- --project=${PROJECT_ID}"
  fi
}

echo "--> [4/7] Secret Manager..."
ensure_secret "$SECRET_X_API_KEY" "${X_API_KEY_VALUE:-}"
ensure_secret "$SECRET_IDENTITY"  "${IDENTITY_PLATFORM_API_KEY_VALUE:-}"

# ---------------------------------------------------------------------------
# 5) IAM: el runtime SA (Cloud Run) accede a los secrets
# ---------------------------------------------------------------------------
echo "--> [5/7] IAM secrets -> ${RUNTIME_SA}..."
for s in "$SECRET_X_API_KEY" "$SECRET_IDENTITY"; do
  gcloud secrets add-iam-policy-binding "$s" \
    --member="serviceAccount:${RUNTIME_SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --project="$PROJECT_ID" >/dev/null
done
echo "    OK."

# ---------------------------------------------------------------------------
# 6) IAM: el deployer SA (GitHub Actions) puede desplegar
# ---------------------------------------------------------------------------
echo "--> [6/7] IAM deploy -> ${DEPLOYER_SA}..."
for role in \
  roles/run.admin \
  roles/artifactregistry.writer \
  roles/firebasehosting.admin \
  roles/serviceusage.serviceUsageConsumer; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${DEPLOYER_SA}" \
    --role="$role" \
    --condition=None >/dev/null
done
# actAs sobre el runtime SA (necesario para `gcloud run deploy --service-account`)
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA" \
  --member="serviceAccount:${DEPLOYER_SA}" \
  --role="roles/iam.serviceAccountUser" \
  --project="$PROJECT_ID" >/dev/null
echo "    OK."

# ---------------------------------------------------------------------------
# 7) Workload Identity Federation: permitir al repo de mobile impersonar el SA
# ---------------------------------------------------------------------------
echo "--> [7/7] WIF binding para el repo de GitHub..."
if [[ -z "$GITHUB_REPO" ]]; then
  echo "    AVISO: GITHUB_REPO no definido (ej: org/ponti-mobile). Salteo el binding de WIF."
  echo "    Ejecutá manualmente (verificá antes el attribute mapping del provider):"
  echo "      gcloud iam service-accounts add-iam-policy-binding ${DEPLOYER_SA} \\"
  echo "        --role=roles/iam.workloadIdentityUser \\"
  echo "        --member='principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/attribute.repository/<org>/<repo>' \\"
  echo "        --project=${PROJECT_ID}"
else
  MEMBER="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/attribute.repository/${GITHUB_REPO}"
  gcloud iam service-accounts add-iam-policy-binding "$DEPLOYER_SA" \
    --role="roles/iam.workloadIdentityUser" \
    --member="$MEMBER" \
    --project="$PROJECT_ID" >/dev/null
  echo "    binding agregado para ${GITHUB_REPO}."
  echo "    NOTA: asume que el provider mapea attribute.repository=assertion.repository."
  echo "    Verificá con: gcloud iam workload-identity-pools providers describe github-actions-provider \\"
  echo "      --location=global --workload-identity-pool=${POOL_ID} --project=${PROJECT_ID}"
fi

echo ""
echo "==========================================================="
echo " Provisión de ${ENVIRONMENT} (${PROJECT_ID}) completada."
echo " Valores para las GitHub Actions variables del repo de mobile:"
echo "   GCP_PROJECT_ID_${SECRET_SUFFIX^^}=${PROJECT_ID}"
echo "   SERVICE_NAME_${SECRET_SUFFIX^^}=${SERVICE_NAME}"
echo "   FIREBASE_HOSTING_SITE_${SECRET_SUFFIX^^}=${SITE_ID}"
echo "   CLOUD_RUN_SERVICE_ACCOUNT_${SECRET_SUFFIX^^}=${RUNTIME_SA}"
echo "   WIF_SERVICE_ACCOUNT_${SECRET_SUFFIX^^}=${DEPLOYER_SA}"
echo "   WIF_PROVIDER_${SECRET_SUFFIX^^}=projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/providers/github-actions-provider"
echo "   IDENTITY_PLATFORM_PROJECT_ID_${SECRET_SUFFIX^^}=${PROJECT_ID}"
echo "==========================================================="
