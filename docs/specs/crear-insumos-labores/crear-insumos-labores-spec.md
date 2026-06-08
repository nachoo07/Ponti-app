# Feature: Crear Insumos Y Labores Desde La App

| Campo | Valor |
|---|---|
| Feature | `crear-insumos-labores` |
| Dominio canonico | `Operations Catalog` |
| Estado canonico | Implemented |
| Ultima normalizacion | 2026-06-08 |

## Proposito

Permitir que el usuario cree catalogos operativos necesarios durante la carga de
una orden de trabajo sin salir del flujo principal.

## Alcance canonico

Incluye:

- Consulta de labores por proyecto.
- Creacion inline de labor pendiente por nombre desde el flujo batch de OT.
- Cliente helper para creacion de labor completa con categoria y contratista
  existe, pero no es el flujo activo del batch.
- Consulta de categorias para categorizar labores.
- Consulta de insumos por proyecto.
- Creacion inline de insumo pendiente.
- Actualizacion inmediata del selector correspondiente en la UI.

No incluye:

- Modificar el backend externo.
- Declarar estructura real de base de datos externa como verificada.
- Implementar creacion inline en formularios o drawers que siguen stubbed.

## Ownership

| Elemento | Owner canonico | Estado |
|---|---|---|
| Labor lookup | Operations Catalog | Implemented |
| Pending inline labor creation | Operations Catalog | Implemented |
| Full inline labor creation | Operations Catalog | Stubbed en UI batch |
| Labor categories | Operations Catalog | Implemented como consumo externo |
| Contractor capture/autofill | Operations Catalog | Implemented |
| Supply lookup | Operations Catalog | Implemented |
| Pending supply creation | Operations Catalog | Implemented |
| WorkOrderForm drawer/new supply behavior | Operations Catalog | Stubbed |

## APIs canonicas

| API | Owner canonico | Estado |
|---|---|---|
| `GET /api/v1/labors?project_id=...` | Operations Catalog | Implemented |
| `GET /api/v1/projects/:id/labors` | Operations Catalog | Implemented |
| `POST /api/v1/projects/:id/labors` | Operations Catalog | Implemented |
| `POST /api/v1/projects/:id/labors/pending` | Operations Catalog | Implemented |
| `GET /api/v1/categories` | Operations Catalog | Implemented |
| `GET /api/v1/supplies?project_id=...` | Operations Catalog | Implemented |
| `POST /api/v1/supplies/pending` | Operations Catalog | Implemented |

## Entidades canonicas

| Entidad | Owner canonico | Persistencia |
|---|---|---|
| Labor | Operations Catalog | External Manager API / UNKNOWN database |
| Labor category | Operations Catalog | External Manager API / UNKNOWN database |
| Contractor | Operations Catalog | External Manager API / UNKNOWN database |
| Supply | Operations Catalog | External Manager API / UNKNOWN database |
| Pending supply | Operations Catalog | External Manager API / UNKNOWN database |

## Dependencias

| Tipo | Dependencia |
|---|---|
| Inbound | Work Orders consume labores, contratistas e insumos durante la carga de OT |
| Outbound | Project Context provee el `project_id` seleccionado |
| Outbound | External Manager API persiste catalogos operativos |
| Outbound | Core migration `000232_labor_pending_changes` debe estar aplicada para que `is_pending` exista y el catalogo de labores responda |

## Evidencia versionada

- `api/src/routes/labors.ts`
- `api/src/routes/projects.ts`
- `api/src/routes/laborCatalog.ts`
- `api/src/routes/categories.ts`
- `api/src/routes/supplies.ts`
- `ui/src/entities/labor/`
- `ui/src/entities/category/`
- `ui/src/entities/supply/`
- `ui/src/features/work-order/create/ui/WorkOrderBatchForm.tsx`

## Evidencia de validacion 2026-06-08

- Active Core DB: `new_ponti_db_develop_local`.
- El comando propuesto contra `new_ponti_db_dev` fue evaluado y no modifico la
  DB activa; aplicar `000232_labor_pending_changes` sobre la DB activa resolvio
  el `500 failed to list labor`.
- `GET /api/v1/projects/30/labors` despues de `000232`: `200`, 19 filas,
  contrato `{ data, page_info }`.
- Mobile validation: `api npm test`, `api npm run build`, `ui npm ci`,
  `ui npm run lint`, `ui npm run build`, `ui npm test`, `ui npm run test:e2e`.

## UNKNOWN justificados

| UNKNOWN | Justificacion |
|---|---|
| Schema real de tablas externas | No hay migraciones ni repositorios de base de datos en este repo |
| Reglas finales de persistencia del Manager API | El BFF solo proxya hacia un servicio externo |
| Garantias transaccionales externas | No son verificables desde este repo |

## Estado normalizado

La feature queda normalizada como Implemented dentro de `Operations Catalog`.

Las afirmaciones historicas que trataban labores como pendiente quedan
obsoletas solo para el lookup y la creacion pendiente activa. La creacion de
labor completa con categoria y contratista queda clasificada como Stubbed desde
la UI batch hasta que exista un flujo conectado.
