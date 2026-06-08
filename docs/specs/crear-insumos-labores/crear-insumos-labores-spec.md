# Feature: Crear Insumos Y Labores Desde La App

| Campo | Valor |
|---|---|
| Feature | `crear-insumos-labores` |
| Dominio canonico | `Operations Catalog` |
| Estado canonico | Implemented |
| Ultima normalizacion | 2026-06-05 |

## Proposito

Permitir que el usuario cree catalogos operativos necesarios durante la carga de
una orden de trabajo sin salir del flujo principal.

## Alcance canonico

Incluye:

- Consulta de labores por proyecto.
- Creacion inline de labor con categoria de labor y contratista.
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
| Inline labor creation | Operations Catalog | Implemented |
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

## Evidencia versionada

- `api/src/routes/labors.ts`
- `api/src/routes/projects.ts`
- `api/src/routes/categories.ts`
- `api/src/routes/supplies.ts`
- `ui/src/entities/labor/`
- `ui/src/entities/category/`
- `ui/src/entities/supply/`
- `ui/src/features/work-order/create/ui/WorkOrderBatchForm.tsx`

## UNKNOWN justificados

| UNKNOWN | Justificacion |
|---|---|
| Schema real de tablas externas | No hay migraciones ni repositorios de base de datos en este repo |
| Reglas finales de persistencia del Manager API | El BFF solo proxya hacia un servicio externo |
| Garantias transaccionales externas | No son verificables desde este repo |

## Estado normalizado

La feature queda normalizada como Implemented dentro de `Operations Catalog`.

Las afirmaciones historicas que trataban labores como pendiente quedan
obsoletas. Las capacidades de insumos y labores estan implementadas en el flujo
principal de creacion batch de ordenes de trabajo. Los botones o clientes no
conectados quedan clasificados aparte como Stubbed.
