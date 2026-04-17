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

- Publicá con Node `20.19.0+`.
- Si UI y API viven en dominios distintos, definí `VITE_API_BASE_URL` con la URL pública del BFF, por ejemplo `https://api.midominio.com/api/v1`.
- Si UI y API viven bajo el mismo dominio, mantené el default `/api/v1` y resolvelo con proxy/reverse proxy.
