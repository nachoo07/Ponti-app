# Feature: Feedback Al Guardar OT

| Campo | Valor |
|---|---|
| Feature | `feedback-guardar-ot` |
| Dominio canonico | `Work Orders` |
| Estado canonico | Implemented |
| Ultima normalizacion | 2026-06-05 |

## Proposito

Dar cierre claro al usuario despues de guardar ordenes de trabajo digitales,
mostrando confirmacion persistente y acciones de continuidad.

## Alcance canonico

Incluye:

- Confirmacion persistente luego de guardar borradores digitales.
- Acciones para crear una nueva OT o volver al inicio.
- Conservacion de acciones de PDF posteriores al guardado.

No incluye:

- Cambios de backend.
- Cambios en calculo de dosis, totales o PDF.
- Edicion de borradores existentes.

## Ownership

| Elemento | Owner canonico | Estado |
|---|---|---|
| Confirmacion post-guardado | Work Orders | Implemented |
| Crear nueva OT desde confirmacion | Work Orders | Implemented |
| Volver al inicio desde confirmacion | Work Orders | Implemented |
| Descargar/compartir PDF desde confirmacion | Work Orders | Implemented |

## APIs involucradas

| API | Owner canonico | Estado |
|---|---|---|
| `POST /api/v1/work-order-drafts/digital/batch` | Work Orders | Implemented |
| `GET /api/v1/work-order-drafts/:id/group-pdf-data` | Work Orders | Implemented |
| `GET /api/v1/work-order-drafts/:id/pdf-data` | Work Orders | Implemented |

## Entidades canonicas

| Entidad | Owner canonico | Persistencia |
|---|---|---|
| Work order draft | Work Orders | External Manager API / UNKNOWN database |
| Work order draft group | Work Orders | External Manager API / UNKNOWN database |
| PDF data | Work Orders | External Manager API response + client rendering |

## Dependencias

| Tipo | Dependencia |
|---|---|
| Inbound | Frontend Shell enruta hacia la pagina de creacion |
| Outbound | Project Context provee cliente/proyecto/campo/lote/cultivo |
| Outbound | Operations Catalog provee labores, contratistas e insumos |
| Outbound | Inventory provee datos de stock cuando aplica |
| Outbound | Browser APIs soportan descarga/compartir PDF |

## Evidencia versionada

- `ui/src/features/work-order/create/ui/WorkOrderBatchForm.tsx`
- `ui/src/pages/work-order/ui/WorkOrderPage.tsx`
- `ui/src/entities/workOrderDraft/`
- `api/src/routes/workOrderDrafts.ts`

## UNKNOWN justificados

| UNKNOWN | Justificacion |
|---|---|
| Persistencia real de borradores | No hay migraciones ni repositorios de base de datos en este repo |
| Reglas internas del Manager API | El BFF solo proxya hacia un servicio externo |

## Estado normalizado

La feature queda normalizada como Implemented dentro de `Work Orders`.

La clasificacion historica previa queda obsoleta porque el flujo de confirmacion
ya existe en el codigo versionado.
