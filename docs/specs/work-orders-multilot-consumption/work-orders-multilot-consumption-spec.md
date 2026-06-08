# Work Orders Multi-Lote: Consumo Total

| Campo | Valor |
|---|---|
| Feature | `work-orders-multilot-consumption` |
| Dominio canonico | `Work Orders` |
| Estado canonico | Regression test |
| Ultima normalizacion | 2026-06-08 |

## Proposito

Reproducir el bug donde una OT digital batch creada desde mobile con mas de un
lote duplica el consumo de insumos al persistir una suborden por lote.

## Regla esperada

En `POST /api/v1/work-order-drafts/digital/batch`, el `total_used` cargado para
un insumo representa el consumo total de la OT completa. Si la OT tiene dos
lotes, ese total no debe copiarse completo a cada suborden.

Ejemplo canonico:

- Lote A: `50 ha`
- Lote B: `50 ha`
- Insumo total cargado: `200`
- Consumo total esperado del grupo: `200`
- Bug actual reproducido: `200 + 200 = 400`

## Evidencia automatizada

- `ui/e2e/work-orders-multilot-consumption.spec.ts`

El test crea un batch digital con dos lotes y espera que la suma de
`items[].total_used` de las subordenes creadas sea `200`. Hasta corregir Core,
el test debe fallar observando `400`.

## No alcance

- No cambia el modelo de datos.
- No publica la OT.
- No corrige todavia la persistencia proporcional por lote.
