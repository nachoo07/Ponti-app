# Feature: Crear insumos / labores desde la app

| | |
|---|---|
| **Feature** | `crear-insumos-labores` |
| **Ticket** | 🎯 Ticket 1 – Crear insumos/labores desde app |
| **Estado** | Insumos ✅ implementado · Labores ⏳ por implementar (DESBLOQUEADO — sin cambios de backend, §6) |
| **Última actualización** | 2026-06-02 |

> SDD adaptado: primero se **documenta lo que ya existe** (insumos) y luego se
> especifica **lo que falta** (labores), reusando exactamente el mismo patrón.

---

## 1. Contexto y problema

Al cargar una Orden de Trabajo (OT), el usuario elige **insumos** y una **labor**
desde selectores poblados con datos del proyecto. Si el insumo/labor todavía no
existe en la base, hoy tendría que salir de la OT, crearlo en otro lado y volver.

El ticket pide poder **crear el ítem inline**, sin salir de la OT, que quede
disponible al instante y se sincronice con el backend.

**Estado:** la parte de **insumos ya está hecha y aceptada**. Falta replicarla
para **labores**.

## 2. Arquitectura relevante

Monorepo `mobile`:

- `ui/` — React + Vite (FSD: `entities/` → `features/` → `pages/`).
- `api/` — BFF Express/TS. **No toca la base**: reenvía al *manager API*
  (`ponti-backend`) usando `BASE_MANAGER_API` + `X-API-KEY`. Ver
  `api/src/services/http.ts` (`managerApi`).

Cadena de una creación:

```
UI (form)
  → entities/<x>/api/createPending<X>.ts   (apiJson POST /<x>/pending)
    → BFF api/src/routes/<x>.ts             (router.post('/pending'))
      → managerApi.post('/<x>/pending')     (ponti-backend, FUERA de este repo)
        → BDD
```

### Qué formulario se usa

- **`WorkOrderBatchForm`** (`ui/src/features/work-order/create/ui/WorkOrderBatchForm.tsx`)
  — es el form de la **página principal de creación** (`WorkOrderPage.tsx:27`).
  **Acá vive el flujo funcional de crear insumo.**
- **`WorkOrderForm`** (`ui/src/features/work-order/create/ui/WorkOrderForm.tsx`)
  — form de **detalle de borrador** (`WorkOrderDraftDetailPage`) y `WorkOrderDrawer`.
  Tiene un botón `+ Crear Nuevo Insumo` (línea ~973) **que es un stub sin `onClick`**:
  no hace nada. ⚠️ El create-new NO está implementado en este form, ni para insumos.

---

## 3. Lo que YA existe — Insumos ✅ (documentación)

### 3.1 Capa entidad (`ui/src/entities/supply/`)

**`model/supply.types.ts`**
```ts
export type CreatePendingSupplyPayload = {
  project_id: number
  name: string
}

export type CreatePendingSupplyResponse = {
  id: number
  name: string
  is_pending: boolean
  created: boolean
}
```
El tipo `Supply` incluye `is_pending?: boolean` (se usa para mostrar "(Pendiente)").

**`api/createPendingSupply.ts`**
```ts
export async function createPendingSupply(
  payload: CreatePendingSupplyPayload,
): Promise<CreatePendingSupplyResponse> {
  return apiJson<CreatePendingSupplyResponse>('/supplies/pending', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}
```

> ⚠️ **Hallazgo importante:** el modal real **solo envía `{ project_id, name }`**.
> NO manda Rubro ni Tipo, a pesar de que el ticket los menciona. Crea un insumo
> "pendiente" solo con nombre. (Ver decisión D2 abajo.)

### 3.2 BFF (`api/src/routes/supplies.ts`)

`router.post('/pending', …)` valida auth, reenvía a `managerApi.post('/supplies/pending', req.body)`
y responde `201` con `response.data`. Mensaje de error: *"No se pudo crear el insumo pendiente"*.
Montado en `api/src/app.ts` → `app.use('/api/v1/supplies', suppliesRoutes)`.

### 3.3 UI — `WorkOrderBatchForm.tsx`

A diferencia de la labor, los insumos son **múltiples filas** (`supplyRows`), cada una
con un **selector buscable** (popover propio, no `<select>` nativo). El creador inline
es **por fila** (de ahí `pendingSupplyRowId`).

**Estado (líneas ~118-123):**
```ts
const [supplies, setSupplies] = useState<Supply[]>([])          // ← vive EN el form
const [openSupplySelectorRowId, setOpenSupplySelectorRowId] = useState<string | null>(null)
const [supplySearchByRow, setSupplySearchByRow] = useState<Record<string, string>>({})
const [pendingSupplyRowId, setPendingSupplyRowId] = useState<string | null>(null)
const [pendingSupplyName, setPendingSupplyName] = useState('')
const [isCreatingPendingSupply, setIsCreatingPendingSupply] = useState(false)
const [pendingSupplyError, setPendingSupplyError] = useState<string | null>(null)
```

**Handlers (líneas ~530-548 y 657-708):**
- `handleOpenPendingSupplyCreator(rowId)` / `handleClosePendingSupplyCreator()` — abren/cierran y limpian el creador.
- `handleCreatePendingSupply()` — el núcleo:
  1. valida proyecto + nombre no vacío,
  2. `createPendingSupply({ project_id, name })`,
  3. arma un `Supply` con la respuesta (`is_pending`, price `'0'`, category/type vacíos),
  4. lo **agrega a `supplies`** (dedup por id + ordenado por nombre),
  5. lo **auto-selecciona** en la fila (`updateSupplyRow(rowId, { supply_id, supply_name })`),
  6. cierra el creador; maneja loading (`isCreatingPendingSupply`) y error.

**JSX (líneas ~1402-1458):** botón `+ Crear nuevo insumo` → card inline con input
`Nombre del insumo`, botones `Guardar`/`Cancelar` y `<small>` de error. Las opciones
pendientes se listan con sufijo ` (Pendiente)`.

**Reset (líneas ~188-193 y 219-224):** ambos bloques de reset limpian
`pendingSupply*` y `setSupplies([])`.

---

## 4. VERIFICADO — el backend NO tiene "labor pendiente" ⚠️

> Verificado en el repo backend real `core` (Go/Gin, `internal/labor/`,
> `/home/pablocristo/Proyectos/pablo/ponti/core`). El plan original (espejar el
> "pending" name-only de insumos) **NO aplica**: una labor no se puede crear solo
> con nombre.

### 4.1 Asimetría real insumos vs labores en el backend

| | Insumos (supply) | Labores (labor) |
|---|---|---|
| ¿Tiene flujo "pendiente"? | **Sí** (`is_pending`, `CreatePendingSupply`, `CompletePendingSupply`, `ListPendingSupplies`) | **No** — no existe `is_pending` ni `/labors/pending` |
| Endpoint de creación | `POST /supplies/pending` (solo `{project_id, name}`) | `POST /projects/:project_id/labors` (**creación completa**) |
| Campos requeridos | solo `name` (el resto se completa después) | `name` + **`category_id` (FK NOT NULL → Rubro)** + `price` + `contractor_name` + `is_partial_price` |

### 4.2 Contrato real de creación de labor (`core` + cómo lo usa `web`)

- **Ruta:** `POST {BASE_MANAGER_API}/projects/{project_id}/labors`
- **Body** (batch): `{ "labors": [ { "name", "contractor_name", "price", "is_partial_price", "category_id" } ] }`
- **Validación** (`internal/labor/usecases.go:51`): `name` no vacío + **único por proyecto**
  (si existe → `409 Conflict "labor already exists in this project"`).
- **Respuesta:** `207 Multi-Status` → `{ "message", "labors_ids": [ { "labor_name", "labor_id", "is_saved", "error_detail" } ] }`.

### 4.3 Rubro y Tipo — RESUELTO (verificado contra el schema y `web`)

⚠️ Corrección importante a §4.2: el FK real es
`labors.category_id → public.categories(id)` (la tabla **genérica**, NO `labor_categories`).
Idéntico a `supplies.category_id`. Las tablas `labor_categories`/`labor_types` y el endpoint
`labor-categories/{type_id}` son **legacy** y NO son lo que usa la creación de labor.

- **Rubro** = `GET /api/v1/categories` (módulo `category`, devuelve `{ id, name, type_id }`,
  paginado hasta 1000), **filtrando `type_id === 4`** (4 = Labor). Confirmado en el schema
  (`fk_labors_category` → `categories`) y en `web` (`TasksForm.tsx`: `getCategories("type_id=4")`).
- **Tipo** = `GET /api/v1/types` (módulo `class-type`, tabla `types`); Labor = id `4`.
  En el contexto del selector de labor el Tipo es fijo = **Labor**.
- `price` default `0`, `contractor_name` lo pone el usuario (la OT lo exige no vacío),
  `is_partial_price` default `false`.

➡️ **No hace falta ningún cambio en el backend `core`.** Todos los endpoints existen y
`web` ya los usa en producción.

### 4.4 Cambios necesarios (todos en el repo `mobile`)

1. **BFF** `api/src/routes/`:
   - `categories.ts` (nuevo, montar en `app.ts` `/api/v1/categories`): `GET` → proxy a
     `managerApi.get('/categories', {params})`. (Filtro `type_id` se puede hacer acá o en UI.)
   - `projects.ts`: agregar `POST /:id/labors` → proxy a `managerApi.post('/projects/{id}/labors', body)`.
2. **Entity** `ui/src/entities/`:
   - `category/` (nuevo): `getCategories({ typeId })` + tipo `Category { id, name, type_id }`.
   - `labor/api/createLabor.ts` (nuevo): POST batch + parsear `labors_ids[0]`; tipos
     `CreateLaborPayload`/`CreateLaborResponse`.
3. **`useWorkOrderWorkspace.ts`**: exponer `setLabors` (labors vive en el hook, no en el form).
4. **`WorkOrderBatchForm.tsx`**: botón `+ Crear nueva labor` junto al `<select>` de Labor →
   card/modal con **Nombre + Rubro (dropdown `type_id=4`) + Contratista** (Tipo fijo=Labor);
   al guardar → `createLabor` → `setLabors` (dedup+orden) → `setSelectedLaborId(id)` →
   `setContractor(contractor)`; manejar `409`/`is_saved:false`; loading/error; limpiar en resets.

> `WorkOrderForm.tsx` se deja **sin tocar** (su botón de insumo ya es un stub no funcional).

---

## 5. Decisiones (cerradas 2026-06-02)

- **D1 (VERIFICADO):** ❌ NO existe `/labors/pending`. Crear labor = `POST /projects/{id}/labors`
  con `category_id`. La 1ª impl (espejo del pending de insumos) fue **revertida**.
- **D2 — Modal: `Nombre + Rubro + Contratista`** (Tipo fijo = Labor, `type_id=4`).
  `price`=0, `is_partial_price`=false. Rubro ← `GET /categories?type_id=4`.
- **D3 → solo `WorkOrderBatchForm`**. `WorkOrderForm` intacto.
- **ESTADO: ✅ DESBLOQUEADO — sin cambios de backend. Implementación = §4.4.**

## 6. Backend — sin cambios ✅

Verificado en `core` + `web`: la creación de labor con Rubro vía `categories` (`type_id=4`)
**ya está soportada y en uso en producción** (`web/ui/.../tasks/TasksForm.tsx`). No se requiere
agregar ni modificar endpoints en `core`. Solo se agregan **proxies en el BFF de `mobile`**
(`api/`) hacia endpoints existentes del manager API.

### Detalle original de las decisiones (previo a la verificación — histórico)

- **D1 — Endpoint del manager API (`ponti-backend`).** El BFF solo reenvía; el create
  real vive en `ponti-backend`, **fuera de este repo**. Para insumos es
  `POST /supplies/pending`. Para labores, por simetría sería `POST /labors/pending`,
  **pero no está verificado que exista**. Si no existe, el feature dará 404 en runtime.
  → Confirmar el path/forma exactos con backend (¿`/labors/pending`? ¿requiere `category_id`?).

- **D2 — Rubro + Tipo en el modal.** El ticket pide Rubro (dropdown) + Tipo. La
  implementación aceptada de insumos es **solo nombre**. Opciones: (a) espejar insumos
  (solo nombre, recomendado por consistencia) o (b) construir el modal completo con
  Rubro/Tipo (depende de que `ponti-backend` lo soporte — D1).

- **D3 — Alcance de formularios.** ¿Solo `WorkOrderBatchForm` (donde insumos es
  funcional) o también cablear `WorkOrderForm` (hoy stub para insumos)?

## 7. Criterios de aceptación

1. En el selector de Labor de la OT aparece **➕ Crear nueva labor**.
2. Abre un creador inline con **Nombre + Rubro (dropdown, `type_id=4`) + Contratista**.
3. Al guardar: la labor se crea en backend, queda **disponible inmediatamente** en el
   selector y queda **auto-seleccionada** (con su contratista).
4. Todo **sin salir de la OT**.
5. Loading + error (no guarda sin nombre / sin rubro / sin proyecto; muestra duplicado `409`).
6. `npm --prefix ui run build` y `npm --prefix api run build` compilan.

## 8. Referencias

- Patrón a espejar (insumos): `WorkOrderBatchForm.tsx` (`handleCreatePendingSupply`,
  estado `pendingSupply*`, JSX ~1402-1458), `entities/supply/api/createPendingSupply.ts`,
  `api/src/routes/supplies.ts`.
- Labor actual: `entities/labor/{api/getLaborsByProject.ts,model/labor.types.ts}`,
  `useWorkOrderWorkspace.ts` (estado `labors`), `WorkOrderBatchForm.tsx` (`<select>` ~1153).
- **Backend `core`** (`/home/pablocristo/Proyectos/pablo/ponti/core`): crear labor
  `internal/labor/handler.go:97` (`CreateLabor`), DTO `internal/labor/handler/dto/create_labors.go`;
  categorías `internal/category/handler.go` (`GET /categories`); FK `fk_labors_category → categories`
  (`scripts/db/schema.expected.sql:6198`); `type_id=4`=Labor.
- **Referencia de uso real (`web`)**: `web/ui/src/pages/admin/database/tasks/TasksForm.tsx`
  (`getCategories("type_id=4")`, `handleCreateLabors`), BFF `web/api/src/routes/categories.ts`.
