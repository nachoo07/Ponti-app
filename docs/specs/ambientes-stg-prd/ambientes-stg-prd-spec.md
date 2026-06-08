# Feature: Ambientes STG/PROD

| Campo | Valor |
|---|---|
| Feature | `ambientes-stg-prod` |
| Dominio canonico | `Platform & Delivery` |
| Estado canonico | Implemented para configuracion versionada; UNKNOWN para estado vivo de GCP/GitHub |
| Ultima normalizacion | 2026-06-05 |

## Proposito

Definir la capacidad de operar Ponti Mobile en ambientes dev, staging y
production usando la configuracion versionada del repositorio.

## Alcance canonico

Incluye:

- Docker build/runtime de la aplicacion mobile.
- Firebase Hosting con rewrite de `/api/v1/**` hacia Cloud Run.
- Cloud Run como runtime del BFF.
- GitHub Actions para CI, deploy, aprobacion, promocion y rollback.
- Health/version endpoints para verificacion operativa.

No incluye:

- Crear o modificar bases de datos.
- Cambiar el backend externo `ponti-backend`.
- Declarar como verificado el estado vivo de GCP, Firebase, Secret Manager,
  GitHub environments o reviewers.

## Ownership

| Elemento | Owner canonico | Estado |
|---|---|---|
| Deploy dev/stg/prod | Platform & Delivery | Implemented en configuracion versionada |
| Promocion a prod | Platform & Delivery | Implemented en workflows versionados |
| Rollback stg/prod | Platform & Delivery | Implemented en workflows versionados |
| Provisioning GCP | Platform & Delivery | Implemented como scripts versionados |
| Estado vivo GCP/Firebase/GitHub | Platform & Delivery | UNKNOWN |
| Smoke autenticado de release | Platform & Delivery | Planned |

## Evidencia versionada

- `Dockerfile`
- `Dockerfile.api`
- `docker-compose.yml`
- `firebase.json`
- `.firebaserc`
- `.github/workflows/`
- `scripts/gcp/provision-mobile-env.sh`
- `scripts/gh/configure-github.sh`
- `scripts/smoke_release.sh`
- `api/src/app.ts`

## Separacion spec/runbook

Esta spec solo define ownership, estado y alcance de la capacidad.

Los pasos operativos pertenecen a runbooks de `Platform & Delivery`:

- Deploy
- Promote
- Rollback
- Provision
- Smoke

## UNKNOWN justificados

| UNKNOWN | Justificacion |
|---|---|
| Estado vivo de proyectos GCP | No es verificable solo desde este repo |
| Existencia/configuracion real de Firebase sites | No es verificable solo desde este repo |
| Secret Manager y permisos runtime | No es verificable solo desde este repo |
| GitHub environments/reviewers | No es verificable solo desde este repo |
| Resultado real de deploys historicos | No es verificable solo desde este repo |

## Estado normalizado

La feature queda normalizada como `Platform & Delivery`.

La configuracion versionada esta documentada como Implemented. Todo estado
externo o vivo queda marcado como UNKNOWN hasta que se audite contra GCP,
Firebase y GitHub.
