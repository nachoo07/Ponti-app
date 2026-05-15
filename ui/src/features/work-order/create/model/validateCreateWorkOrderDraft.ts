import type { CreateWorkOrderDraftPayload } from '../../../../entities/workOrderDraft/model/workOrderDraft.types'

export function validateCreateWorkOrderDraft(
  payload: CreateWorkOrderDraftPayload,
): string[] {
  const errors: string[] = []

  if (!payload.date.trim()) {
    errors.push('La fecha es obligatoria.')
  }

  if (payload.customer_id <= 0) {
    errors.push('El cliente es obligatorio.')
  }

  if (payload.project_id <= 0) {
    errors.push('El proyecto es obligatorio.')
  }

  if (payload.field_id <= 0) {
    errors.push('El campo es obligatorio.')
  }

  if (payload.lot_id <= 0) {
    errors.push('El lote es obligatorio.')
  }

  if (payload.crop_id <= 0) {
    errors.push('El cultivo actual es obligatorio.')
  }

  if (payload.labor_id <= 0) {
    errors.push('La labor es obligatoria.')
  }

  if (!payload.contractor.trim()) {
    errors.push('El contratista es obligatorio.')
  }

  const effectiveArea = Number(payload.effective_area)
  if (!Number.isFinite(effectiveArea) || effectiveArea <= 0) {
    errors.push('La superficie realizada debe ser mayor a 0.')
  }

  if (payload.items.length === 0) {
    errors.push('Debes agregar al menos un insumo.')
  }

  const usedSupplyIds = new Set<number>()

  for (const item of payload.items) {
    if (item.supply_id <= 0) {
      errors.push('Todos los insumos deben tener un item seleccionado.')
    }

    if (usedSupplyIds.has(item.supply_id)) {
      errors.push('No puede haber insumos repetidos en la misma orden.')
    }

    usedSupplyIds.add(item.supply_id)

    const totalUsed = Number(item.total_used)
    if (!Number.isFinite(totalUsed) || totalUsed <= 0) {
      errors.push('Todos los insumos deben tener un total utilizado mayor a 0.')
    }

    const finalDose = Number(item.final_dose?.replace(',', '.'))
    if (!Number.isFinite(finalDose) || finalDose <= 0) {
      errors.push('Todos los insumos deben tener una dosis final mayor a 0.')
    }
  }

  if (!payload.investor_splits || payload.investor_splits.length === 0) {
    if (payload.investor_id <= 0) {
      errors.push('Debes seleccionar un inversor.')
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
