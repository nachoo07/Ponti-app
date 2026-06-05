# SDD Baseline Normalizado

| Campo | Valor |
|---|---|
| Sistema | Ponti Mobile |
| Estado | Baseline SDD coherente con evidencia versionada |
| Ultima normalizacion | 2026-06-05 |
| Fuente de verdad | Repositorio actual |
| Gobernanza | `docs/specs/system/sdd-governance.md` |

## Proposito del sistema

Ponti Mobile permite operar flujos moviles de ordenes de trabajo digitales para
proyectos agropecuarios, consumiendo autenticacion externa y un Manager API
externo a traves de un BFF Express.

## Taxonomia canonica

Solo estos dominios son validos para el baseline:

| Dominio | Proposito |
|---|---|
| Identity & Access | Login, refresh de sesion, proteccion de rutas y logout |
| Work Orders | Creacion, edicion, lifecycle, validacion y PDF de ordenes de trabajo |
| Project Context | Clientes, campanas, proyectos, campos, lotes y cultivos |
| Operations Catalog | Labores, categorias de labor, contratistas, insumos e insumos pendientes |
| Inventory | Stock lookup y anotaciones de stock |
| Platform & Delivery | Health/version, Docker, Firebase, Cloud Run, GitHub Actions, deploy, promote y rollback |
| Frontend Shell | Routing, layout autenticado, navegacion y browser session storage |

## Reglas canonicas de ownership

- Cada feature pertenece a exactamente un dominio.
- Cada entidad pertenece a exactamente un dominio.
- Cada ruta BFF pertenece al dominio de la capacidad de negocio que sirve.
- Entidades persistidas por el Manager API son externas salvo modelo local
  explicito.
- Entidades de Google Identity Platform pertenecen a `Identity & Access`.
- Estado de sesion en browser pertenece a `Frontend Shell`; comportamiento de
  autenticacion pertenece a `Identity & Access`.
- Workflows, runbooks y despliegues pertenecen a `Platform & Delivery`.
- PDF pertenece a `Work Orders` porque es salida del lifecycle de OT.

## Estados canonicos

| Estado | Definicion |
|---|---|
| Implemented | Existe evidencia versionada de la capacidad funcional |
| Partially Implemented | Existen piezas funcionales, pero no un flujo primario completo verificado |
| Stubbed | Hay codigo cliente/ruta/boton sin flujo activo o bloqueado intencionalmente |
| Planned | La spec describe intencion futura sin implementacion versionada |
| UNKNOWN | No se puede verificar desde este repo |

## Integraciones canonicas

| Integracion | Uso | Owner |
|---|---|---|
| External Manager API / `ponti-backend` | Datos de negocio y persistencia | Varios dominios por capacidad |
| Google Identity Platform | Login y refresh | Identity & Access |
| Firebase Hosting | Hosting frontend y rewrites | Platform & Delivery |
| Cloud Run | Runtime BFF | Platform & Delivery |
| GitHub Actions | CI/CD, aprobacion, promocion, rollback | Platform & Delivery |
| GitHub Deployments | Ledger de releases | Platform & Delivery |
| Browser local/session storage | Sesion local de UI | Frontend Shell |
| Web Share API | Compartir PDFs | Work Orders |
| Browser Blob/Object URL APIs | Descargar PDFs | Work Orders |

## Datos y bases

Este repo no contiene base de datos local, migraciones, ORM ni repositorios de
persistencia. Toda persistencia de negocio se considera externa y queda
clasificada como External Manager API / UNKNOWN database.

## Uso autoritativo del baseline

`docs/specs` es la puerta de entrada para cualquier esfuerzo SDD futuro.

Las fuentes canonicas son:

- Features: `docs/specs/features/feature-inventory.md`
- APIs: `docs/specs/apis/api-inventory.md`
- Datos/entidades: `docs/specs/data/data-ownership.md`
- Dominios: `docs/specs/domains/domain-architecture.md`
- Reglas de uso: `docs/specs/system/sdd-governance.md`

No se agregan dominios, features, APIs, entidades ni ownership fuera de estas
fuentes sin una actualizacion explicita del baseline.
