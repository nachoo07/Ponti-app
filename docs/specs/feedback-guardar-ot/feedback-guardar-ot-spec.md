# Feature: Feedback al guardar OT (Ticket 7)

| | |
|---|---|
| **Feature** | `feedback-guardar-ot` |
| **Rama** | `feedback-guardar-ot` |
| **Ticket** | 🎯 Ticket 7 – Feedback al guardar |
| **Proyecto** | `ponti/mobile/ui` (React 19 + Vite + react-router-dom v7, FSD) |
| **Estado** | Spec listo — sin implementar |
| **Última actualización** | 2026-06-02 |

> SDD adaptado: se documenta la intención (spec) + el diseño acordado + el plan
> de implementación, **antes** de tocar código. Decisiones de UX ya resueltas con
> el usuario (ver §4).

---

## 1. Contexto y problema

El alta de OT vive en la página **Nueva OT** (`/work-orders` →
[WorkOrderPage.tsx](../../../src/pages/work-order/ui/WorkOrderPage.tsx)), que
renderiza el formulario
[WorkOrderBatchForm.tsx](../../../src/features/work-order/create/ui/WorkOrderBatchForm.tsx).

Al guardar con éxito, `handleSaveBatchDraft`
([WorkOrderBatchForm.tsx:723](../../../src/features/work-order/create/ui/WorkOrderBatchForm.tsx#L723)):

1. Guarda las órdenes creadas en `createdDrafts`.
2. Muestra un **toast transitorio** verde (`wof-toast.is-success`, etiqueta
   genérica *"Listo"*) con el texto `"Se creo N ordenes digitales."`.
3. Ese toast **se auto-oculta a los 4.5 s**
   ([WorkOrderBatchForm.tsx:308-320](../../../src/features/work-order/create/ui/WorkOrderBatchForm.tsx#L308-L320)).
4. Resetea el formulario (`resetFormAfterCreate`) y aparecen botones
   "Compartir PDF" / "Descargar PDF" en el footer.

**Problema (gap vs. Ticket 7):**

- El mensaje no es el pedido (`✅ "Orden cargada correctamente"`).
- La confirmación es **transitoria** (desaparece sola) → puede pasarse por alto:
  **genera duda** y no da "cierre claro".
- **No existen** las opciones que pide el ticket: *Volver al inicio* y
  *Crear nueva OT*. El usuario queda en la misma página con el form vacío sin un
  próximo paso explícito.

> Nota: el otro formulario,
> [WorkOrderForm.tsx](../../../src/features/work-order/create/ui/WorkOrderForm.tsx),
> se usa solo para **editar** desde el detalle del borrador
> (`WorkOrderDraftDetailPage`) y no es parte del alta. **Fuera de alcance.**

## 2. Objetivo y alcance

**Objetivo:** dar cierre claro a la acción de guardar OT: confirmación visible y
persistente + próximos pasos explícitos, sin que el flujo genere duda.

**Alcance (solo el alta — `WorkOrderBatchForm`):**
- ✅ Mostrar el mensaje `✅ Orden cargada correctamente` tras guardar OK.
- ✅ Ofrecer dos acciones: **Volver al inicio** y **Crear nueva OT**.
- ✅ Confirmación **persistente** (no auto-desaparece).

**Fuera de alcance:**
- ❌ El formulario de edición (`WorkOrderForm` / `WorkOrderDraftDetailPage`).
- ❌ Cambios de backend / endpoints (`createBatchWorkOrderDraft` queda igual).
- ❌ Cambiar el contenido del PDF o la lógica de cálculo de dosis/insumos.
- ❌ Nuevas dependencias (se usa lo ya instalado: `react-router-dom`).

## 3. Requisitos

**Funcionales**
- F1. Al guardar exitosamente, el formulario se **reemplaza** por una vista de
  confirmación con el ✅ y el mensaje.
- F2. La confirmación expone dos acciones primarias:
  - **Crear nueva OT** → limpia el estado de creación y deja un formulario nuevo
    y vacío en la misma página (`/work-orders`), con scroll al tope.
  - **Volver al inicio** → navega a `/home` (la HomePage "Centro operativo";
    coincide con "Inicio" del Navbar).
- F3. Las acciones de **Descargar PDF** / **Compartir PDF** (ya existentes) se
  conservan como acciones **secundarias** dentro de la confirmación.
- F4. El mensaje se adapta a la cantidad creada (singular/plural) — ver §4.
- F5. El camino de **error** sigue mostrando el toast de error actual (sin
  cambios funcionales para errores).

**No funcionales**
- N1. Confirmación **persistente**: no se auto-oculta por timeout (a diferencia
  del toast actual).
- N2. Accesibilidad: contenedor con `role="status"` + `aria-live="polite"`; al
  montarse, el foco se mueve al encabezado de la confirmación para que lectores
  de pantalla lo anuncien y el teclado quede ubicado en el cierre.
- N3. Reusar el design system existente (tokens de `global.css` y clases
  `wof-primaryBtn` / `wof-secondaryBtn`); responsive coherente con el form (en
  mobile los botones ocupan el 100% del ancho).
- N4. Sin dependencias nuevas; compila con `npm run build` y pasa `npm run lint`.

## 4. Diseño y decisiones (acordadas con el usuario)

| Decisión | Elegido | Implicancia |
|---|---|---|
| **Patrón de UI** | **Vista de confirmación** que reemplaza el form | Cierre máximo, imposible pasarla por alto. Se renderiza dentro de `WorkOrderBatchForm` cuando hay órdenes creadas; el título de página "Nueva Orden de Trabajo" queda arriba. |
| **Texto del mensaje** | **Adaptar singular/plural** | 1 orden → `✅ Orden cargada correctamente`. N → `✅ Órdenes cargadas correctamente`, con el conteo como subtítulo. |
| **Acciones PDF** | **Mantener como secundarias** | Los 2 botones del ticket son la acción principal; Descargar/Compartir PDF quedan como acciones secundarias en la misma pantalla. |

### Estructura de la vista de confirmación

```
┌──────────────────────────────────────┐
│                 ✅                     │   ← ícono grande
│   Orden cargada correctamente          │   ← título (singular/plural)
│   3 órdenes digitales generadas        │   ← subtítulo (conteo)
│                                        │
│        [   Crear nueva OT   ]          │   ← primario
│        [  Volver al inicio  ]          │   ← primario (o secundario visual)
│   ──────────────────────────────       │
│     Descargar PDF · Compartir PDF      │   ← secundarias (existentes)
└──────────────────────────────────────┘
```

### Texto exacto

| Caso | Título | Subtítulo |
|---|---|---|
| 1 orden | `✅ Orden cargada correctamente` | `1 orden digital generada` |
| N órdenes | `✅ Órdenes cargadas correctamente` | `N órdenes digitales generadas` |

### Señal de "guardado"

Hoy `createdDrafts.length > 0` ya es la señal de hecho de "se guardó" (es lo que
dispara los botones de PDF). La vista de confirmación se renderiza con esa misma
condición. No hace falta un flag nuevo, salvo que se prefiera explícito
(`hasSaved`) por claridad — opcional.

## 5. Plan de implementación

### 5.1 `WorkOrderBatchForm.tsx`

1. **Importar navegación:** `import { useNavigate } from 'react-router-dom'` y
   `const navigate = useNavigate()`.
2. **Mensaje (singular/plural):** en el éxito de `handleSaveBatchDraft`
   ([~L811-L823](../../../src/features/work-order/create/ui/WorkOrderBatchForm.tsx#L811-L823)),
   derivar el título/subtítulo a partir de `response.items.length`. Reemplaza el
   actual `setSaveDraftSuccessMessage("Se creo N ordenes digitales.")`.
   - La confirmación toma el conteo de `createdDrafts.length` (ya seteado), así
     que el texto puede calcularse en el render sin estado extra.
3. **Toast solo para errores:** ajustar el `useEffect` de auto-dismiss
   ([L308-L320](../../../src/features/work-order/create/ui/WorkOrderBatchForm.tsx#L308-L320))
   y `toastMessage`/`toastVariant`
   ([L145-L146](../../../src/features/work-order/create/ui/WorkOrderBatchForm.tsx#L145-L146))
   para que el éxito ya **no** use el toast (lo cubre la vista de confirmación).
   El toast queda para `saveDraftError` y `groupPdfError` (este último puede
   ocurrir dentro de la confirmación si falla la descarga del PDF).
4. **Render condicional:** cuando `createdDrafts.length > 0`, renderizar la
   **vista de confirmación** (`<section className="wof-confirmation" role="status"
   aria-live="polite">`) en lugar del `<form>`. Incluye:
   - ícono ✅, título y subtítulo (§4),
   - botón **Crear nueva OT** (primario),
   - botón **Volver al inicio** (primario/secundario),
   - acciones secundarias **Descargar PDF** / **Compartir PDF** reutilizando
     `handleDownloadCreatedPdf` / `handleShareGroupPdf` ya existentes,
   - el toast de error sigue por encima (para fallas de PDF).
5. **Handlers nuevos:**
   - `handleCreateNewOrder()`: limpiar el estado de creación
     (`setCreatedDrafts([])`, `setSaveDraftSuccessMessage(null)`,
     `setGroupPdfError(null)`) y resetear el form. Ojo:
     `resetFormAfterCreate()`
     ([L204-L231](../../../src/features/work-order/create/ui/WorkOrderBatchForm.tsx#L204-L231))
     **no** limpia `createdDrafts` hoy, por eso hay que limpiarlo acá. Luego
     `scrollToFormTop()`.
   - `handleGoHome()`: `navigate('/home')`.
6. **Foco/accesibilidad (N2):** `ref` al encabezado de la confirmación con
   `tabIndex={-1}` y `.focus()` en un `useEffect` al aparecer la vista.

### 5.2 `WorkOrderForm.css`

- Agregar estilos `.wof-confirmation` (card centrada), `.wof-confirmationIcon`
  (✅ grande), `.wof-confirmationTitle`, `.wof-confirmationSubtitle`,
  `.wof-confirmationActions` (stack de CTAs) y `.wof-confirmationSecondary`
  (acciones PDF, separadas por un divisor).
- Reusar tokens de
  [global.css](../../../src/app/styles/global.css): `--color-success`,
  `--color-success-light`, `--color-accent-dark`, `--shadow-xl`,
  `--color-border-light`. Reusar `.wof-primaryBtn` / `.wof-secondaryBtn`.
- Responsive: en `@media (max-width: 760px)`, CTAs al 100% (consistente con
  `.wof-footerActions > *`).

### 5.3 Sin cambios

- `WorkOrderPage.tsx`, `AppRouter.tsx`, `Navbar.tsx`, APIs/entidades: sin tocar.
- `react-router-dom` ya está como dependencia → no se instala nada.

## 6. Criterios de aceptación / verificación

Mapea 1:1 con el ticket:

1. **Confirmación visible** — Tras guardar OK, aparece la vista con `✅ Orden
   cargada correctamente` (o plural) y **no** desaparece sola (no hay timeout).
2. **No genera duda** — La confirmación reemplaza el form; el mensaje y los dos
   próximos pasos (Volver al inicio / Crear nueva OT) son explícitos y visibles
   sin scroll.
3. **El flujo continúa naturalmente** —
   - "Volver al inicio" → navega a `/home` (Centro operativo).
   - "Crear nueva OT" → vuelve a `/work-orders` con un formulario **vacío** y
     scroll al tope, listo para cargar otra.
4. **Regresión PDF** — Descargar/Compartir PDF siguen funcionando desde la
   confirmación (acciones secundarias).
5. **Regresión error** — Si `createBatchWorkOrderDraft` falla, sigue
   apareciendo el toast de error (no la confirmación).

**Verificación manual (no hay test runner en `mobile/ui`):**
`npm run dev`, completar campos mínimos (Cliente, Proyecto, Campo, Labor, ≥1
lote con superficie), "Guardar borradores" → confirmar puntos 1-5.
Build/lint: `npm run build` y `npm run lint` sin errores.

## 7. Riesgos y supuestos

- **Supuesto:** "Volver al inicio" = `/home` (no `/`, que es login y redirige a
  usuarios autenticados). Confirmado por Navbar ("Inicio" → `/home`) y por la
  HomePage "Centro operativo".
- **Riesgo bajo:** `resetFormAfterCreate` no limpia `createdDrafts`; si "Crear
  nueva OT" no lo limpia explícitamente, la confirmación quedaría pegada. Cubierto
  en §5.1.5.
- **Supuesto:** mantener el título de página "Nueva Orden de Trabajo" por encima
  de la confirmación es aceptable (la confirmación vive dentro del form card). Si
  se prefiere ocultarlo en estado de éxito, es un ajuste menor en `WorkOrderPage`.
- **No hay infraestructura de tests** en `mobile/ui` (solo `dev/build/lint/preview`);
  la verificación es manual + build/lint.

## 8. Referencias

- Formulario de alta: [WorkOrderBatchForm.tsx](../../../src/features/work-order/create/ui/WorkOrderBatchForm.tsx)
- Página: [WorkOrderPage.tsx](../../../src/pages/work-order/ui/WorkOrderPage.tsx)
- Router: [AppRouter.tsx](../../../src/app/routes/AppRouter.tsx) · Navbar: [Navbar.tsx](../../../src/widgets/navbar/Navbar.tsx) · Home: [HomePage.tsx](../../../src/pages/home/ui/HomePage.tsx)
- Estilos: [WorkOrderForm.css](../../../src/features/work-order/create/ui/WorkOrderForm.css) · Tokens: [global.css](../../../src/app/styles/global.css)
- Convención de spec: [ambientes-stg-prd-spec.md](../ambientes-stg-prd/ambientes-stg-prd-spec.md)
