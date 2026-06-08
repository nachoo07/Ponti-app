# Domain Architecture Baseline

## Identity & Access

| Campo | Valor |
|---|---|
| Purpose | Autenticar usuarios, renovar sesion, proteger acceso y cerrar sesion |
| Boundaries | No posee layout, navegacion ni persistencia de negocio |
| Owned entities | Identity user, access token, refresh token |
| Owned APIs | `POST /api/v1/auth/login`, `GET /api/v1/auth/access-token` |
| Aggregate roots | Identity session |
| Critical rules | Las rutas de negocio requieren Authorization; el BFF usa credenciales server-side hacia Manager API |
| Tenant isolation | UNKNOWN; depende de Identity Platform y Manager API externo |
| Security | Tokens no deben exponerse fuera del browser/BFF esperado |

Dependencies:

| Tipo | Dependencia |
|---|---|
| Outbound | Google Identity Platform |
| Outbound | Frontend Shell para almacenamiento local de sesion |
| Inbound | Todos los dominios funcionales dependen de sesion valida |

## Work Orders

| Campo | Valor |
|---|---|
| Purpose | Gestionar borradores digitales, creacion batch, edicion, vista publicada, numeracion y PDFs |
| Boundaries | No posee catalogos, proyectos, stock ni deploy |
| Owned entities | Work order draft, work order draft group, digital order number, PDF data, investor contribution |
| Owned APIs | Rutas bajo `/api/v1/work-order-drafts` |
| Aggregate roots | Work order draft, work order draft group |
| Critical rules | No documentar publish mobile como implementado; PDF es parte del lifecycle de OT |
| Tenant isolation | UNKNOWN; depende de Manager API externo |
| Security | Requiere Authorization; BFF proxya con API key server-side |

Dependencies:

| Tipo | Dependencia |
|---|---|
| Outbound | Project Context para seleccion de contexto |
| Outbound | Operations Catalog para labores, contratistas e insumos |
| Outbound | Inventory para stock |
| Outbound | Browser APIs para PDF |
| Inbound | Frontend Shell enruta las pantallas |

## Project Context

| Campo | Valor |
|---|---|
| Purpose | Proveer contexto agricola y comercial para cargar OTs |
| Boundaries | No crea catalogos operativos ni OTs |
| Owned entities | Customer, campaign, project, project detail, field, lot, crop |
| Owned APIs | `GET /api/v1/customers`, `GET /api/v1/campaigns`, `GET /api/v1/projects`, `GET /api/v1/projects/:id` |
| Aggregate roots | Project |
| Critical rules | Field/lot/crop se tratan como parte de project detail verificado |
| Tenant isolation | UNKNOWN; depende de Manager API externo |
| Security | Requiere Authorization |

Dependencies:

| Tipo | Dependencia |
|---|---|
| Outbound | External Manager API |
| Inbound | Work Orders consume project context |
| Inbound | Operations Catalog usa `project_id` para catalogos por proyecto |
| Inbound | Inventory usa `project_id` para stock |

## Operations Catalog

| Campo | Valor |
|---|---|
| Purpose | Proveer y crear catalogos operativos usados en OTs |
| Boundaries | No posee OTs, proyectos ni stock |
| Owned entities | Labor, labor category, contractor, supply, pending supply |
| Owned APIs | Labor, category and supply BFF routes |
| Aggregate roots | Labor, supply |
| Critical rules | Creacion de labor requiere categoria; pending supply es flujo separado |
| Tenant isolation | UNKNOWN; depende de Manager API externo |
| Security | Requiere Authorization |

Dependencies:

| Tipo | Dependencia |
|---|---|
| Outbound | Project Context para `project_id` |
| Outbound | External Manager API |
| Inbound | Work Orders consume catalogos |

## Inventory

| Campo | Valor |
|---|---|
| Purpose | Consultar stock disponible y anotarlo en el flujo de OT |
| Boundaries | No crea insumos ni modifica OTs |
| Owned entities | Stock item, stock snapshot, stock annotation |
| Owned APIs | `GET /api/v1/stock/:projectId` |
| Aggregate roots | Stock snapshot |
| Critical rules | Stock depende de proyecto y cutoff date cuando aplica |
| Tenant isolation | UNKNOWN; depende de Manager API externo |
| Security | Requiere Authorization |

Dependencies:

| Tipo | Dependencia |
|---|---|
| Outbound | Project Context para `project_id` |
| Outbound | External Manager API |
| Inbound | Work Orders consume stock |

## Platform & Delivery

| Campo | Valor |
|---|---|
| Purpose | Construir, servir, desplegar, promover, verificar y revertir la app |
| Boundaries | No posee funcionalidad de negocio ni datos de OT |
| Owned entities | Deployment release, artifact image, Firebase site, Cloud Run service, secret reference |
| Owned APIs | `GET /health`, `GET /api/v1/version` |
| Aggregate roots | Deployment release |
| Critical rules | Estado vivo externo debe ser UNKNOWN si no se audita contra proveedor |
| Tenant isolation | Por ambiente; estado vivo UNKNOWN |
| Security | Secretos via runtime/configuracion externa; valores reales no se documentan |

Dependencies:

| Tipo | Dependencia |
|---|---|
| Outbound | Firebase Hosting |
| Outbound | Cloud Run |
| Outbound | GitHub Actions / GitHub Deployments |
| Outbound | Secret Manager UNKNOWN |
| Inbound | Todos los dominios dependen del runtime desplegado |

## Frontend Shell

| Campo | Valor |
|---|---|
| Purpose | Enrutar la SPA, montar layout autenticado y conservar estado local de sesion |
| Boundaries | No decide reglas de autenticacion ni ownership de features de negocio |
| Owned entities | Route, navigation item, browser session state |
| Owned APIs | Ninguna ruta BFF propia |
| Aggregate roots | Authenticated app shell |
| Critical rules | Estado local de sesion pertenece al shell; auth behavior pertenece a Identity & Access |
| Tenant isolation | UNKNOWN; depende de sesion externa |
| Security | Debe respetar route protection y logout |

Dependencies:

| Tipo | Dependencia |
|---|---|
| Outbound | Identity & Access para sesion |
| Inbound | Todos los dominios UI se renderizan dentro del shell |
