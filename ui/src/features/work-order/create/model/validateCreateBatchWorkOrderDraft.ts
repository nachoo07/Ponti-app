import type { CreateBatchWorkOrderDraftPayload } from '../../../../entities/workOrderDraft/model/workOrderDraft.types'

function isValidBatchBaseNumber(value: string): boolean {
  return /^D-\d+$/.test(value.trim())
}

export function validateCreateBatchWorkOrderDraft(
  payload: CreateBatchWorkOrderDraftPayload,
): string[] {
  const errors: string[] = []

  if (payload.number && !isValidBatchBaseNumber(payload.number)) {
    errors.push('El número debe tener formato base tipo D-8 o D-20.')
  }

  if (!payload.date.trim()) {
    errors.push('Falta completar: Fecha.')
  }

  if (payload.customer_id <= 0) {
    errors.push('Falta completar: Cliente.')
  }

  if (payload.project_id <= 0) {
    errors.push('Falta completar: Proyecto.')
  }

  if (payload.field_id <= 0) {
    errors.push('Falta completar: Campo.')
  }

  if (payload.crop_id <= 0) {
    errors.push('Falta completar: Cultivo actual.')
  }

  if (payload.labor_id <= 0) {
    errors.push('Falta completar: Labor.')
  }


  if (payload.lots.length === 0) {
    errors.push('Falta completar: Lotes.')
  }


  for (const lot of payload.lots) {
    if (lot.lot_id <= 0) {
      errors.push('Todos los lotes deben ser válidos.')
    }

    const effectiveArea = Number(lot.effective_area)
    if (!Number.isFinite(effectiveArea) || effectiveArea <= 0) {
      errors.push(`Falta completar superficie para el lote ${lot.lot_id}.`)
    }


    const usedSupplyIds = new Set<number>()

    for (const item of lot.items) {
      if (item.supply_id <= 0) {
        errors.push(`Falta seleccionar un insumo en el lote ${lot.lot_id}.`)
      }

      if (usedSupplyIds.has(item.supply_id)) {
        errors.push(`Hay insumos repetidos en el lote ${lot.lot_id}.`)
      }

      usedSupplyIds.add(item.supply_id)

      const totalUsed = Number(item.total_used)
      if (!Number.isFinite(totalUsed) || totalUsed <= 0) {
        errors.push(`Falta completar total utilizado en el lote ${lot.lot_id}.`)
      }

    }
  }

  if (!payload.investor_splits || payload.investor_splits.length === 0) {
    if (payload.investor_id <= 0) {
      errors.push('Falta completar: Inversor.')
    }
  } else {

    const usedInvestorIds = new Set<number>()
    let totalPercentage = 0

    for (const split of payload.investor_splits) {
      if (split.investor_id <= 0) {
        errors.push('Todos los aportes deben tener un inversor.')
      }

      if (usedInvestorIds.has(split.investor_id)) {
        errors.push('No puede haber inversores repetidos en dividir aporte.')
      }

      usedInvestorIds.add(split.investor_id)

      const percentage = Number(split.percentage)
      if (!Number.isFinite(percentage) || percentage <= 0) {
        errors.push('Todos los porcentajes de aporte deben ser mayores a 0.')
      }

      totalPercentage += percentage
    }

    if (Math.abs(totalPercentage - 100) > 0.001) {
      errors.push('La suma de los porcentajes de aporte debe ser 100.')
    }
  }

  return [...new Set(errors)]
}
