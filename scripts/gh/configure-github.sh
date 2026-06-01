#!/usr/bin/env bash
#
# Configura las GitHub Actions *variables* y los *environments* del repo de
# Ponti Mobile para los ambientes dev / stg / prod.
#
# SOLO toca configuración del repo de GitHub (gh). NO ejecuta gcloud, NO toca
# ninguna base de datos ni el backend (core/ponti-backend). Cada ambiente queda
# apuntando a su propia BDD de forma transitiva: el BFF resuelve BASE_MANAGER_API
# al `ponti-backend` de su propio proyecto GCP, y ese backend usa su BDD.
#
# Idempotente y no destructivo: una variable existente con valor distinto se
# SALTEA (salvo FORCE=1), para no romper la config de dev que ya funciona.
#
# Uso:
#   ./scripts/gh/configure-github.sh                # default: stg prod
#   ./scripts/gh/configure-github.sh stg prod
#   ./scripts/gh/configure-github.sh dev stg prod   # incluye dev (revisar antes)
#   FORCE=1 ./scripts/gh/configure-github.sh stg    # sobreescribe valores distintos
#
# Reviewers (opcional) para el gate de aprobación:
#   STAGING_REVIEWERS="login1,login2" PROD_REVIEWERS="login1" \
#     ./scripts/gh/configure-github.sh stg prod
#
# Requisitos: gh autenticado con permiso admin sobre el repo.

set -euo pipefail

REPO="${REPO:-$(git remote get-url origin 2>/dev/null | sed -E 's#\.git$##; s#^.*github\.com[:/]##')}"
if [[ -z "$REPO" ]]; then
  echo "ERROR: no pude detectar el repo. Definí REPO=owner/repo." >&2
  exit 1
fi

ENVS=("$@")
if [[ ${#ENVS[@]} -eq 0 ]]; then
  ENVS=(stg prod)
fi

echo "==========================================================="
echo " Configurando GitHub Actions vars/environments"
echo " Repo:      $REPO"
echo " Ambientes: ${ENVS[*]}"
echo "==========================================================="

# --- helpers ----------------------------------------------------------------

set_var() {
  local name="$1" value="$2" current status
  current="$(gh api "repos/${REPO}/actions/variables/${name}" --jq .value 2>/dev/null)" && status=0 || status=$?
  if [[ $status -ne 0 ]]; then
    gh variable set "$name" --repo "$REPO" --body "$value" >/dev/null
    echo "  + ${name}"
  elif [[ "$current" == "$value" ]]; then
    echo "  = ${name} (ya correcto)"
  elif [[ "${FORCE:-0}" == "1" ]]; then
    gh variable set "$name" --repo "$REPO" --body "$value" >/dev/null
    echo "  ~ ${name} sobreescrito ('${current}' -> '${value}')"
  else
    echo "  ! ${name} existe con valor distinto ('${current}'). SALTEADO (usá FORCE=1)."
  fi
}

reviewers_json() {
  # $1 = "login1,login2" -> '[{"type":"User","id":N}, ...]' (o vacío)
  local raw="$1" out="" login id
  [[ -z "$raw" ]] && { echo ""; return; }
  IFS=',' read -ra logins <<< "$raw"
  for login in "${logins[@]}"; do
    login="$(echo "$login" | xargs)"
    [[ -z "$login" ]] && continue
    id="$(gh api "users/${login}" --jq .id 2>/dev/null || true)"
    if [[ -z "$id" ]]; then
      echo "    WARN: no pude resolver el usuario '${login}'; lo omito." >&2
      continue
    fi
    out="${out:+${out},}{\"type\":\"User\",\"id\":${id}}"
  done
  echo "$out"
}

ensure_environment() {
  local envname="$1" reviewers_csv="${2:-}" revs body
  revs="$(reviewers_json "$reviewers_csv")"
  if [[ -n "$revs" ]]; then
    body="{\"wait_timer\":0,\"reviewers\":[${revs}],\"deployment_branch_policy\":null}"
  else
    body="{\"wait_timer\":0,\"deployment_branch_policy\":null}"
  fi
  if echo "$body" | gh api --method PUT "repos/${REPO}/environments/${envname}" --input - >/dev/null 2>&1; then
    if [[ -n "$revs" ]]; then
      echo "  + environment '${envname}' (con required reviewers)"
    else
      echo "  + environment '${envname}' (SIN reviewers — agregalos en Settings → Environments)"
    fi
  else
    echo "  ! environment '${envname}': no se pudo crear (necesita ADMIN en el repo)."
    echo "    Crealo a mano en Settings → Environments, o que lo haga el dueño del repo."
    echo "    No bloquea las variables; los workflows manuales igual corren (sin gate de aprobación)."
  fi
}

# --- variables compartidas --------------------------------------------------
echo "--> Variables compartidas"
set_var GCP_REGION         us-central1
set_var ARTIFACT_REGISTRY  cloud-run-source-deploy

# --- por ambiente -----------------------------------------------------------
for e in "${ENVS[@]}"; do
  case "$e" in
    dev)
      echo "--> dev (new-ponti-dev)  [ya en uso: no se sobreescribe sin FORCE=1]"
      set_var GCP_PROJECT_ID_DEV            new-ponti-dev
      set_var SERVICE_NAME_DEV              ponti-mobile
      set_var FIREBASE_HOSTING_SITE_DEV     ponti-mobile-dev
      set_var CLOUD_RUN_SERVICE_ACCOUNT_DEV cloudrun-sa@new-ponti-dev.iam.gserviceaccount.com
      set_var WIF_SERVICE_ACCOUNT_DEV       github-actions@new-ponti-dev.iam.gserviceaccount.com
      set_var WIF_PROVIDER_DEV              projects/1087442197188/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider
      set_var CLOUD_RUN_SERVICE_BACKEND_DEV ponti-backend
      ;;
    stg)
      echo "--> stg (new-ponti-stg)"
      set_var GCP_PROJECT_ID_STG            new-ponti-stg
      set_var SERVICE_NAME_STG              ponti-mobile
      set_var FIREBASE_HOSTING_SITE_STG     ponti-mobile-stg
      set_var CLOUD_RUN_SERVICE_ACCOUNT_STG cloudrun-sa@new-ponti-stg.iam.gserviceaccount.com
      set_var WIF_SERVICE_ACCOUNT_STG       github-actions@new-ponti-stg.iam.gserviceaccount.com
      set_var WIF_PROVIDER_STG              projects/65243764597/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider
      set_var CLOUD_RUN_SERVICE_BACKEND_STG ponti-backend
      ensure_environment staging "${STAGING_REVIEWERS:-}"
      ;;
    prod|prd)
      echo "--> prod (new-ponti-prod)"
      set_var GCP_PROJECT_ID_PROD            new-ponti-prod
      set_var SERVICE_NAME_PROD              ponti-mobile
      set_var FIREBASE_HOSTING_SITE_PROD     ponti-mobile-prod
      set_var CLOUD_RUN_SERVICE_ACCOUNT_PROD cloudrun-sa@new-ponti-prod.iam.gserviceaccount.com
      set_var WIF_SERVICE_ACCOUNT_PROD       github-actions@new-ponti-prod.iam.gserviceaccount.com
      set_var WIF_PROVIDER_PROD              projects/875939220111/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider
      set_var CLOUD_RUN_SERVICE_BACKEND_PROD ponti-backend
      set_var GCP_REGION_PROD                us-central1
      ensure_environment prod "${PROD_REVIEWERS:-}"
      ;;
    *)
      echo "  ! ambiente desconocido: '$e' (usá dev|stg|prod)" >&2
      ;;
  esac
done

echo ""
echo "==========================================================="
echo " Listo. Notas:"
echo " - Los secretos X_API_KEY / IDENTITY_PLATFORM_API_KEY NO van como"
echo "   GitHub Secrets: se inyectan desde Secret Manager (ver provisión GCP)."
echo " - Cada ambiente apunta a su BDD vía su propio 'ponti-backend' — este"
echo "   script no toca ninguna base de datos ni el backend."
echo " - Si creaste los environments sin reviewers, agregalos en"
echo "   Settings → Environments para activar el gate de aprobación."
echo "==========================================================="
