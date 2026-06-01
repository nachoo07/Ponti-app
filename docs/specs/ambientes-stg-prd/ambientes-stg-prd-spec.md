# Feature: Ambientes STG y PROD en GCP (Ponti Mobile)

| | |
|---|---|
| **Feature** | `ambientes-stg-prod` |
| **Rama** | `ambientes` (cambios NO mergeados a `main`) |
| **Estado** | En progreso — repo + variables de GitHub hechos; falta provisión GCP + merge |
| **Repo GitHub** | `nachoo07/Ponti-app` |
| **Última actualización** | 2026-06-01 |

> Handoff / spec para poder frenar y retomar. SDD adaptado: se documenta la
> intención (spec) + el estado de implementación + lo que falta.

---

## 1. Contexto y problema

`mobile` es un monorepo: `api/` (BFF Express/TS → **Cloud Run**) + `ui/`
(React+Vite → **Firebase Hosting**). Firebase reescribe `/api/v1/**` al Cloud Run
y `**` → `index.html` (SPA). Hoy **solo existe el ambiente dev** (`new-ponti-dev`).

El repo hermano `web` ya resolvió dev/stg/prod con un modelo de promoción maduro;
el backend `core` confirma los IDs de WIF/SA por proyecto. Se busca dar a `mobile`
los ambientes **stg** y **prod** replicando ese patrón.

## 2. Objetivo y alcance

**Objetivo:** que queden operativos los 3 ambientes (dev, stg, prod), cada uno
apuntando a su propia BDD, con CI/CD por ambiente.

**Cómo "apunta a su BDD":** el BFF de mobile **no toca ninguna base de datos**;
le pega al `ponti-backend` de su propio proyecto GCP (`BASE_MANAGER_API` se resuelve
dinámico), y ese backend usa su BDD. dev→DB dev, stg→DB staging, prod→DB prod.

**Fuera de alcance (constraint explícito del usuario):**
- ❌ NO tocar ninguna base de datos (más que conectarse a través del backend).
- ❌ NO tocar el backend `core` / Ponti ni sus workflows.
- ❌ NO crear proyectos GCP (ya existen).

## 3. Requisitos

**Funcionales**
- Push a `develop` → deploy dev. Push a `main` → deploy stg. prod por promoción manual del artefacto de stg, con aprobación.
- Rollback de stg y prod a un release aprobado anterior.
- Cada ambiente usa su proyecto GCP, su site de Firebase, su Cloud Run y su backend.

**No funcionales / constraints**
- Secretos vía **Secret Manager** (`--set-secrets`), no GitHub Secrets.
- npm (no yarn); Cloud Run puerto **8080**; Artifact Registry `cloud-run-source-deploy`.
- No afectar dev (que ya funciona) ni la BDD/Ponti.

## 4. Diseño y decisiones

### Proyectos / recursos por ambiente

| Ambiente | Proyecto GCP | Nº | Hosting site | Cloud Run | Backend |
|---|---|---|---|---|---|
| dev | `new-ponti-dev` | 1087442197188 | `ponti-mobile-dev` | `ponti-mobile` | `ponti-backend` |
| stg | `new-ponti-stg` | 65243764597 | `ponti-mobile-stg` | `ponti-mobile` | `ponti-backend` |
| prod | `new-ponti-prod` | 875939220111 | `ponti-mobile-prod` | `ponti-mobile` | `ponti-backend` |

Región `us-central1`. WIF pool `github-actions-pool` + provider `github-actions-provider`;
SA WIF `github-actions@<proj>`; SA runtime `cloudrun-sa@<proj>`.

### Modelo de deploy

```
develop ─push▶ deploy-dev       ▶ dev   (build + deploy)
main    ─push▶ deploy-staging   ▶ stg   (build, sube artefacto UI, imagen :sha+:stg, SMOKE_OK)
              approve-staging   (manual, Env staging)  ▶ QA_APPROVED
              deploy-prod       (manual, Env prod, input staging_sha) ▶ prod (promueve misma imagen+artefacto, --min-instances=2)
rollback-staging / rollback-prod (manual) ▶ redeploy de un SHA aprobado
```

### Decisiones clave (y desvíos deliberados vs `web`)
- **Secret Manager** (`--set-secrets`) en vez de GitHub Secrets → más seguro y consistente con el dev actual.
- **`NODE_ENV=production`** en los 3 ambientes (Express solo optimiza con `=== 'production'`; usar `dev/staging/prod` lo dejaría en modo desarrollo). Identidad del ambiente en `SERVICE_VERSION` (`dev-`/`stg-`/`prod-`).
- **Smoke adaptado** a rutas reales de mobile (`GET /`, `POST /api/v1/auth/login`→401). Mobile NO tiene `/api/v1/ping`, `/version`, `/work-orders` (sí `/api/v1/version` que agregamos para observabilidad).
- Nomenclatura `prod`/`_PROD`/`ponti-mobile-prod`.

## 5. Estado de implementación — HECHO ✅

### Repo (rama `ambientes`, sin commitear/mergear)
- `.firebaserc` (nuevo) — targets `frontend` → `ponti-mobile-{dev,stg,prod}`.
- `firebase.json` — `site` hardcodeado → `target: frontend`.
- `scripts/release/deployments.py` (portado de web; trazabilidad GitHub Deployments).
- `scripts/smoke_release.sh` (adaptado a rutas de mobile).
- `.github/workflows/`: `deploy-dev.yml` (reescrito), `deploy-staging.yml`, `approve-staging.yml`, `deploy-prod.yml`, `rollback-staging.yml`, `rollback-prod.yml`, `ci-pr.yml` (todos nuevos salvo deploy-dev).
- `api/src/app.ts` — endpoint `GET /api/v1/version`.
- `scripts/gcp/provision-mobile-env.sh` (provisión GCP idempotente).
- `scripts/gh/configure-github.sh` (vars + environments de GitHub).
- `docs/SETUP_ENVIRONMENTS.md` (runbook) y `README.md` actualizado.
- Validado: YAML/JSON/py/bash OK; `npm --prefix api run build` compila.

### GitHub (`nachoo07/Ponti-app`) — ya aplicado
- Las **25 variables** `_STG`/`_PROD` cargadas (corrí `configure-github.sh stg prod`). dev intacto.
- Environments `staging`/`prod`: **NO creados** (la cuenta `gh devpablocristo` no tiene admin → HTTP 403). Se autocrean cuando corran los workflows; falta el gate de reviewers (lo pone un admin).

## 6. Pendiente — PARA CONTINUAR ⏭️

1. **Provisión GCP** (requiere admin en los proyectos GCP). Por cada ambiente:
   ```bash
   GITHUB_REPO="nachoo07/Ponti-app" \
   X_API_KEY_VALUE="<valor>" \
   IDENTITY_PLATFORM_API_KEY_VALUE="<web api key del proyecto>" \
     ./scripts/gcp/provision-mobile-env.sh stg   # luego: prod
   ```
   Crea: Artifact Registry, Firebase site, secrets (`x-api-key-<env>`, `identity-platform-api-key-<env>`), IAM (secretAccessor al runtime SA; roles de deploy + actAs al deployer SA) y el **binding de WIF al repo de mobile**.
   - ⚠️ Verificar el attribute mapping del WIF provider (`attribute.repository`).
   - ⚠️ Verificar Identity Platform habilitado (Email/Password) en stg/prod y que la Web API Key cargada sea la correcta.
   - ⚠️ Confirmar que `ponti-backend` esté desplegado en stg/prod (para resolver `BASE_MANAGER_API`).

2. **Environments + reviewers** (requiere admin del repo `nachoo07/Ponti-app`):
   crear/configurar `staging` y `prod` en Settings → Environments con required reviewers
   (o re-correr `configure-github.sh` con admin y `STAGING_REVIEWERS=`/`PROD_REVIEWERS=`).

3. **Mergear la rama `ambientes`** a `main` (DESPUÉS de la provisión GCP).
   ⚠️ Al mergear a `main`, `deploy-staging.yml` se dispara solo en push.

## 7. Criterios de aceptación / verificación

1. **dev (regresión):** push a `develop` → `deploy-dev` verde; `https://ponti-mobile-dev.web.app/` 200 HTML, `<service>/health` 200, login inválido → 401.
2. **stg:** push a `main` → `deploy-staging` verde; artefacto `ponti-ui-dist-<sha>` subido; `https://ponti-mobile-stg.web.app` OK.
3. **approve-staging:** workflow OK → deployment `QA_APPROVED`.
4. **prod:** `deploy-prod` con el `staging_sha` aprobado → imagen promovida (mismo SHA), `--min-instances=2`, `https://ponti-mobile-prod.web.app` OK.
5. **rollback:** `rollback-staging` a un SHA aprobado anterior funciona.

## 8. Riesgos y supuestos
- La cuenta `gh devpablocristo` no tiene admin en el repo (vars OK, environments no).
- Falta verificar acceso admin en proyectos GCP `new-ponti-stg`/`prod` (la cuenta gcloud activa era `softponti@gmail.com`, proyecto `pymes-dev-352318`).
- WIF binding al repo de mobile probablemente falte (mobile es repo distinto a web/core).
- Identity Platform de stg/prod debe estar configurado.

## 9. Referencias
- Runbook detallado: [docs/SETUP_ENVIRONMENTS.md](../../SETUP_ENVIRONMENTS.md)
- Plan original: `~/.claude/plans/podes-mirar-como-estan-floating-haven.md`
- Plantilla 1:1: repo hermano `web` (`/home/pablocristo/Proyectos/pablo/ponti/web`)
- Scripts: `scripts/gcp/provision-mobile-env.sh`, `scripts/gh/configure-github.sh`
