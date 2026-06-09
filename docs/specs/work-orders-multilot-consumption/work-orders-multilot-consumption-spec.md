# Work Orders Multi-Lote: Consumo Total

| Campo                | Valor                              |
| -------------------- | ---------------------------------- |
| Feature              | `work-orders-multilot-consumption` |
| Dominio canonico     | `Work Orders`                      |
| Estado canonico      | Implemented regression coverage    |
| Ultima normalizacion | 2026-06-08                         |

## Proposito

Cubrir el flujo donde una OT digital batch creada desde mobile con mas de un
lote persiste una suborden fisica por lote sin duplicar el consumo total de
insumos.

## Regla esperada

En `POST /api/v1/work-order-drafts/digital/batch`, el `total_used` cargado para
un insumo representa el consumo total ingresado para el batch. Si el batch tiene
dos lotes, ese total no debe copiarse completo a cada suborden.

Ejemplo canonico:

- Lote A: `50 ha`
- Lote B: `50 ha`
- Insumo total cargado: `200`
- Consumo total esperado del batch: `200`
- Persistencia esperada: `100 + 100 = 200`

Core valida que todos los lotes compartan el mismo set de insumos, calcula
`final_dose = total_used / superficie_total`, distribuye `total_used` por area
efectiva de lote y ajusta el ultimo lote por residuo decimal.

Mobile sigue enviando `total_used` como consumo total del batch. No debe
predividirlo por lote.

## Evidencia automatizada

- `ui/e2e/work-orders-multilot-consumption.spec.ts`

El test crea un batch digital con dos lotes y espera que la suma de
`items[].total_used` de las subordenes creadas sea `200`. Tambien valida por
detalle que cada suborden guarde `total_used_lote = final_dose * effective_area`.

El spec incluye un smoke read-only contra datos guardados. Si existen las
subordenes `D-1905555.1`, `D-1905555.2`, y `D-1905555.3` en la DB activa,
Mobile debe poder leerlas por BFF y sus detalles deben conservar
`final_dose=10` y `total_used` `2010`, `350`, y `2500`.

Validacion 2026-06-08:

- `cd api && npm test`: passed.
- `cd ui && npm test`: passed.
- `npm run test:e2e -- work-orders-multilot-consumption.spec.ts`: passed.

## No alcance

- No cambia el modelo de datos.
- No publica la OT.
- No introduce una entidad multi-lote real; se mantiene compatibilidad con
  subordenes fisicas por lote.
