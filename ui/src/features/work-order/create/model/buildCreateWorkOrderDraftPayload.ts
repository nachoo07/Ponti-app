import type { CreateWorkOrderDraftPayload } from '../../../../entities/workOrderDraft/model/workOrderDraft.types'
import type { SupplyRow } from '../../../../entities/supply/model/supply.types'
import type { InvestorSplit } from '../../../../entities/project/model/project.types'
import type { Lot } from '../../../../entities/project/model/project.types'
import type { Labor } from '../../../../entities/labor/model/labor.types'

type BuildCreateWorkOrderDraftPayloadParams = {
  number: string
  date: string
  customerId: number
  projectId: number
  campaignId?: number | null
  fieldId: number
  lotId: number
  selectedLot: Lot
  selectedLabor: Labor
  contractor: string
  effectiveArea: string
  observations: string
  selectedInvestorId: number
  splitContribution: boolean
  investorSplits: InvestorSplit[]
  supplyRows: SupplyRow[]
}

export function buildCreateWorkOrderDraftPayload({
  number,
  date,
  customerId,
  projectId,
  campaignId = null,
  fieldId,
  lotId,
  selectedLot,
  selectedLabor,
  contractor,
  effectiveArea,
  observations,
  selectedInvestorId,
  splitContribution,
  investorSplits,
  supplyRows,
}: BuildCreateWorkOrderDraftPayloadParams): CreateWorkOrderDraftPayload {
  const validItems = supplyRows
    .filter((row) => row.supply_id !== '')
    .map((row) => ({
      supply_id: row.supply_id as number,
      total_used: row.total_used,
      final_dose: row.final_dose,
    }))

  const validInvestorSplits = splitContribution
    ? investorSplits
        .filter((split) => split.investor_id !== '' && split.percentage !== '')
        .map((split) => ({
          investor_id: split.investor_id as number,
          percentage: split.percentage,
        }))
    : undefined

  const normalizedNumber = number.trim()

  return {
    ...(normalizedNumber ? { number: normalizedNumber } : {}),
    date,
    customer_id: customerId,
    project_id: projectId,
    campaign_id: campaignId,
    field_id: fieldId,
    lot_id: lotId,
    crop_id: selectedLot.current_crop_id ?? 0,
    labor_id: selectedLabor.id,
    contractor,
    effective_area: effectiveArea,
    observations,
    investor_id: splitContribution
      ? validInvestorSplits?.[0]?.investor_id ?? 0
      : selectedInvestorId,
    investor_splits: validInvestorSplits,
    items: validItems,
  }
}

