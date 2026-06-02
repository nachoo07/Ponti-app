# Setup de ambientes (dev / stg / prod) — Ponti Mobile

Esta guía describe cómo dejar operativos los ambientes **staging** y **producción**
de Ponti Mobile en GCP, replicando el patrón ya existente en el repo hermano `web`.

## Arquitectura

- `api/` — BFF Express/TS → **Cloud Run** (servicio `ponti-mobile`, puerto 8080).
- `ui/` — React+Vite → **Firebase Hosting** (sites `ponti-mobile-{dev,stg,prod}`).
- Firebase reescribe `/api/v1/**` al Cloud Run y `**` → `index.html` (SPA).
- Un proyecto GCP por ambiente:

| Ambiente | Proyecto GCP | Nº proyecto | Hosting site | Cloud Run |
|---|---|---|---|---|
| dev | `new-ponti-dev` | 1087442197188 | `ponti-mobile-dev` | `ponti-mobile` |
| stg | `new-ponti-stg` | 65243764597 | `ponti-mobile-stg` | `ponti-mobile` |
| prod | `new-ponti-prod` | 875939220111 | `ponti-mobile-prod` | `ponti-mobile` |

Región: `us-central1`. Artifact Registry: `cloud-run-source-deploy` (docker).

## Flujo de deploy

```
develop ──push──▶ deploy-dev.yml      ──▶ dev    (build + deploy)
main    ──push──▶ deploy-staging.yml  ──▶ stg    (build, sube artefacto UI, imagen :sha+:stg, SMOKE_OK)
                  approve-staging.yml  (manual, GitHub Env `staging`) ──▶ QA_APPROVED
                  deploy-prod.yml      (manual, GitHub Env `prod`, input staging_sha)
                                       ──▶ prod   (promueve la MISMA imagen + artefacto, --min-instances=2)
rollback-staging.yml / rollback-prod.yml  (manual) ──▶ redeploy de un SHA aprobado anterior
```

`BASE_MANAGER_API` se resuelve dinámicamente en cada deploy desde el Cloud Run
del backend (`ponti-backend`) del proyecto correspondiente. **Requiere** que el
backend (`core`) ya esté desplegado en stg/prod.

## Decisiones / diferencias vs `web`

- **npm** (no yarn) y **puerto 8080** (no 3000).
- Secretos vía **Secret Manager** (`--set-secrets`), no como GitHub Secrets. Más
  seguro y consistente con el dev actual de mobile.
- `NODE_ENV=production` en los tres ambientes (Express sólo optimiza con
  `NODE_ENV === 'production'`; usar `dev/staging/prod` lo dejaría en modo
  desarrollo). La identidad del ambiente va en `SERVICE_VERSION`
  (`dev-`/`stg-`/`prod-`/`*-rollback-*`), visible en `GET /api/v1/version`.
- Smoke adaptado a las rutas reales del BFF (`/`, `POST /api/v1/auth/login`→401).

---

## Paso 1 — Provisionar GCP (stg y prod)

Requiere `gcloud` autenticado con permisos de admin en los proyectos destino y
`firebase-tools` (se usa vía `npx`). El script es **idempotente**.

```bash
# Staging
GITHUB_REPO="<org>/<repo-mobile>" \
X_API_KEY_VALUE="<valor real>" \
IDENTITY_PLATFORM_API_KEY_VALUE="<valor real>" \
  ./scripts/gcp/provision-mobile-env.sh stg

# Producción
GITHUB_REPO="<org>/<repo-mobile>" \
X_API_KEY_VALUE="<valor real>" \
IDENTITY_PLATFORM_API_KEY_VALUE="<valor real>" \
  ./scripts/gcp/provision-mobile-env.sh prod
```

El script:
1. Habilita APIs (`run`, `artifactregistry`, `secretmanager`, `firebasehosting`, `iam`, `iamcredentials`, `sts`, `identitytoolkit`).
2. Crea el repo Artifact Registry `cloud-run-source-deploy` si falta.
3. Crea el Firebase Hosting site `ponti-mobile-<env>`.
4. Crea los secrets `x-api-key-<env>` e `identity-platform-api-key-<env>` (y carga versión si pasaste los `*_VALUE`).
5. Da a `cloudrun-sa@<proj>` el rol `secretmanager.secretAccessor` sobre esos secrets.
6. Da a `github-actions@<proj>` los roles de deploy (`run.admin`, `artifactregistry.writer`, `firebasehosting.admin`, `serviceusage.serviceUsageConsumer`) y `iam.serviceAccountUser` sobre `cloudrun-sa@<proj>`.
7. Agrega el binding de **Workload Identity** para el repo de GitHub de mobile.

> **Verificá el WIF provider.** El binding asume que el provider
> `github-actions-pool/github-actions-provider` mapea
> `attribute.repository = assertion.repository`. Confirmalo con:
> ```bash
> gcloud iam workload-identity-pools providers describe github-actions-provider \
>   --location=global --workload-identity-pool=github-actions-pool --project=new-ponti-stg
> ```
> Si el mapping difiere, ajustá el `--member` del binding en consecuencia.

### Identity Platform (manual)

El login del BFF pega a Identity Platform del proyecto del ambiente. Verificá que
en `new-ponti-stg` y `new-ponti-prod` esté habilitado Identity Platform con el
proveedor **Email/Password**, y que el valor cargado en
`identity-platform-api-key-<env>` sea la **Web API Key** de ese proyecto
(Firebase console → Project settings → Web API Key).

---

## Paso 2 — Configurar el repo de GitHub (mobile)

### Variables (`Settings → Secrets and variables → Actions → Variables`)

Compartidas (opcionales, tienen default en los workflows):

| Variable | Valor |
|---|---|
| `GCP_REGION` | `us-central1` |
| `ARTIFACT_REGISTRY` | `cloud-run-source-deploy` |

Por ambiente (los workflows tienen defaults, pero conviene fijarlas):

| Variable | dev | stg | prod |
|---|---|---|---|
| `GCP_PROJECT_ID_{DEV,STG,PROD}` | `new-ponti-dev` | `new-ponti-stg` | `new-ponti-prod` |
| `SERVICE_NAME_{DEV,STG,PROD}` | `ponti-mobile` | `ponti-mobile` | `ponti-mobile` |
| `FIREBASE_HOSTING_SITE_{DEV,STG,PROD}` | `ponti-mobile-dev` | `ponti-mobile-stg` | `ponti-mobile-prod` |
| `CLOUD_RUN_SERVICE_ACCOUNT_{DEV,STG,PROD}` | `cloudrun-sa@new-ponti-dev.iam.gserviceaccount.com` | `cloudrun-sa@new-ponti-stg…` | `cloudrun-sa@new-ponti-prod…` |
| `WIF_SERVICE_ACCOUNT_{DEV,STG,PROD}` | `github-actions@new-ponti-dev.iam.gserviceaccount.com` | `github-actions@new-ponti-stg…` | `github-actions@new-ponti-prod…` |
| `WIF_PROVIDER_{DEV,STG,PROD}` | `projects/1087442197188/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider` | `projects/65243764597/…` | `projects/875939220111/…` |
| `IDENTITY_PLATFORM_PROJECT_ID_{DEV,STG,PROD}` | `new-ponti-dev` | `new-ponti-stg` | `new-ponti-prod` |
| `GCP_REGION_PROD` | — | — | `us-central1` |
| `CLOUD_RUN_SERVICE_BACKEND_{DEV,STG,PROD}` (opcional) | `ponti-backend` | `ponti-backend` | `ponti-backend` |

> El script de provisión imprime al final los valores exactos por ambiente.

### Secrets (`… → Secrets`)

**No** hace falta `X_API_KEY` ni `IDENTITY_PLATFORM_API_KEY`: van por Secret Manager.

| Secret | Uso |
|---|---|
| `SMOKE_AUTH_BEARER_TOKEN_{DEV,STG,PROD}` | Opcional, para smokes autenticados (hoy el smoke no lo usa). |

### Environments (`Settings → Environments`)

Crear **`staging`** y **`prod`** con *required reviewers*. Son el gate de
aprobación de `approve-staging.yml` (staging) y `deploy-prod.yml` /
`rollback-prod.yml` (prod). Los environments de GitHub Deployments `dev`,
`staging`, `staging-approved` y `prod` los crea automáticamente `deployments.py`.

### Branches

- `develop` → deploy a dev (automático).
- `main` → deploy a stg (automático).
- prod → manual (`deploy-prod.yml` con el `staging_sha` aprobado).

---

## Paso 3 — Verificación end-to-end

1. **dev (regresión):** push a `develop`. El cambio `firebase.json` (site→target)
   no debe romper dev. Verificar `https://ponti-mobile-dev.web.app/` (200 HTML),
   `<service>/health` (200), login inválido → 401.
2. **stg:** push a `main` → `deploy-staging` verde; artefacto `ponti-ui-dist-<sha>`
   subido; `https://ponti-mobile-stg.web.app` OK.
3. **approve-staging:** correr el workflow (aprobar en Env `staging`) → deployment
   `QA_APPROVED`.
4. **prod:** `deploy-prod` con el `staging_sha` aprobado → aprobar en Env `prod` →
   imagen promovida (mismo SHA), `--min-instances=2`,
   `https://ponti-mobile-prod.web.app` OK.
5. **rollback:** probar `rollback-staging` a un SHA aprobado anterior.
