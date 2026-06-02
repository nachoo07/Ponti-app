# Ponti-app

Aplicación dividida en dos paquetes:

- `api/`: BFF en Express que autentica y proxya requests a Manager API.
- `ui/`: frontend en React + Vite.

## Runtime

- Node requerido: `20.19.0` o superior.
- Archivo recomendado para el entorno local: `.nvmrc`.

## Variables de entorno

### API

Copiá `api/.env.example` a `api/.env` y completá:

- `PORT`
- `BASE_MANAGER_API`
- `X_API_KEY`
- `IDENTITY_PLATFORM_API_KEY`
- `IDENTITY_PLATFORM_PROJECT_ID`

### UI

Copiá `ui/.env.example` a `ui/.env` si necesitás apuntar el frontend a un BFF remoto.

- `VITE_API_BASE_URL`

Si no se define, el frontend usa `/api/v1`. Eso funciona bien cuando UI y API se publican bajo el mismo origen o detrás de un reverse proxy.

## Desarrollo

### API

```bash
cd api
npm install
npm run build
npm run dev
```

### UI

```bash
cd ui
npm install
npm run lint
npm run build
npm run dev
```

## Deploy

La app se despliega en GCP: el BFF (`api/`) a **Cloud Run** y la UI (`ui/`) a
**Firebase Hosting**, con un proyecto GCP por ambiente.

| Ambiente | Trigger | Proyecto GCP | URL UI |
|---|---|---|---|
| dev | push a `develop` | `new-ponti-dev` | https://ponti-mobile-dev.web.app |
| stg | push a `main` | `new-ponti-stg` | https://ponti-mobile-stg.web.app |
| prod | `deploy-prod` manual (promueve un SHA de stg) | `new-ponti-prod` | https://ponti-mobile-prod.web.app |

Flujo: `develop`→dev, `main`→stg, luego `approve-staging` (aprobación QA) y
`deploy-prod` promueve la **misma imagen + artefacto** aprobados de stg a prod.
Hay también `rollback-staging` / `rollback-prod`.

Workflows en [.github/workflows/](.github/workflows/). El setup de los ambientes
(provisión GCP, variables/secrets de GitHub, Environments) está documentado en
[docs/SETUP_ENVIRONMENTS.md](docs/SETUP_ENVIRONMENTS.md).

### Notas de runtime

- Node `20.19.0+`. El BFF escucha en el puerto `PORT` (Cloud Run usa 8080).
- `BASE_MANAGER_API` se resuelve dinámicamente desde el Cloud Run del backend
  (`ponti-backend`) de cada proyecto; `X_API_KEY` e `IDENTITY_PLATFORM_API_KEY`
  se inyectan desde **Secret Manager**.
- La UI usa por default `/api/v1` (mismo origen, resuelto por el rewrite de
  Firebase Hosting). Definí `VITE_API_BASE_URL` sólo si la apuntás a un BFF en
  otro dominio.
- `GET /api/v1/version` expone `service`, `version`, `gitSha` y `buildTime` del deploy.
