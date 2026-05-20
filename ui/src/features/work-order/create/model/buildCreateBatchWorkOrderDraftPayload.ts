import type { InvestorSplit } from '../../../../entities/project/model/project.types'
import type { Labor } from '../../../../entities/labor/model/labor.types'
import type { CreateBatchWorkOrderDraftPayload } from '../../../../entities/workOrderDraft/model/workOrderDraft.types'
import type {
  BatchSelectedLotFormRow,
  BatchSharedSupplyFormRow,
} from './workOrderBatchForm.types'

type BuildCreateBatchWorkOrderDraftPayloadParams = {
  number: string
  date: string
  customerId: number
  projectId: number
  campaignId?: number | null
  fieldId: number
  cropId: number
  selectedLabor: Labor
  contractor: string
  observations: string
  selectedInvestorId: number
  splitContribution: boolean
  investorSplits: InvestorSplit[]
  selectedLots: BatchSelectedLotFormRow[]
  supplyRows: BatchSharedSupplyFormRow[]
}

export function buildCreateBatchWorkOrderDraftPayload({
  number,
  date,
  customerId,
  projectId,
  campaignId = null,
  fieldId,
  cropId,
  selectedLabor,
  contractor,
  observations,
  selectedInvestorId,
  splitContribution,
  investorSplits,
  selectedLots,
  supplyRows,
}: BuildCreateBatchWorkOrderDraftPayloadParams): CreateBatchWorkOrderDraftPayload {
  const validInvestorSplits = splitContribution
    ? investorSplits
        .filter((split) => split.investor_id !== '' && split.percentage !== '')
        .map((split) => ({
          investor_id: split.investor_id as number,
          percentage: split.percentage,
        }))
    : undefined

  const validItems = supplyRows
  .filter((item) => item.supply_id !== '' || item.total_used || item.final_dose)
  .map((item) => ({
    supply_id: item.supply_id === '' ? 0 : item.supply_id,
    total_used: item.total_used,
  }))

  const normalizedNumber = number.trim()

  return {
    ...(normalizedNumber ? { number: normalizedNumber } : {}),
    date,
    customer_id: customerId,
    project_id: projectId,
    campaign_id: campaignId,
    field_id: fieldId,
    crop_id: cropId,
    labor_id: selectedLabor.id,
    contractor,
    observations,
    investor_id: splitContribution
      ? validInvestorSplits?.[0]?.investor_id ?? 0
      : selectedInvestorId,
    investor_splits: validInvestorSplits,
    lots: selectedLots.map((lot) => ({
      lot_id: lot.lot_id,
      effective_area: lot.effective_area,
      items: validItems,
    })),
  }
}
