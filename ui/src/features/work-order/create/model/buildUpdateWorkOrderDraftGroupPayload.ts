import type { InvestorSplit } from '../../../../entities/project/model/project.types'
import type { Labor } from '../../../../entities/labor/model/labor.types'
import type { SupplyRow } from '../../../../entities/supply/model/supply.types'
import type { UpdateWorkOrderDraftGroupPayload } from '../../../../entities/workOrderDraft/model/workOrderDraft.types'

type BuildUpdateWorkOrderDraftGroupPayloadParams = {
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
  supplyRows: SupplyRow[]
}

export function buildUpdateWorkOrderDraftGroupPayload({
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
  supplyRows,
}: BuildUpdateWorkOrderDraftGroupPayloadParams): UpdateWorkOrderDraftGroupPayload {
  const validItems = supplyRows
    .filter((row) => row.supply_id !== '')
    .map((row) => ({
      supply_id: row.supply_id as number,
      total_used: row.total_used,
      final_dose: row.final_dose.replace(',', '.'),
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
    crop_id: cropId,
    labor_id: selectedLabor.id,
    contractor,
    observations,
    investor_id: splitContribution
      ? validInvestorSplits?.[0]?.investor_id ?? 0
      : selectedInvestorId,
    investor_splits: validInvestorSplits,
    items: validItems,
  }
}
