import type { SupplyRow } from '../../../../entities/supply/model/supply.types'
import type {
  WorkOrderDraftDetail,
  WorkOrderDraftGroupDetail,
} from '../../../../entities/workOrderDraft/model/workOrderDraftDetail.types'

export type WorkOrderDraftFormValues = {
  workOrderNumber: string
  workOrderDate: string
  effectiveArea: string
  observations: string
  lotDisplayName?: string
  selectedCustomerId: number | ''
  selectedProjectId: number | ''
  selectedCampaignId: number | ''
  selectedFieldId: number | ''
  selectedCropId: number | ''
  selectedLotId: number | ''
  selectedLaborId: number | ''
  contractor: string
  selectedInvestorId: number | ''
  splitContribution: boolean
  investorSplits: {
    investor_id: number
    percentage: string
  }[]
  supplyRows: SupplyRow[]
}

export function mapDraftToFormValues(
  draft: WorkOrderDraftDetail | WorkOrderDraftGroupDetail,
): WorkOrderDraftFormValues {
  const firstLot = 'lots' in draft ? draft.lots[0] : null
  const lotDisplayName =
    'lots' in draft && draft.lots.length > 0
      ? draft.lots.map((lot) => lot.lot_name).join(', ')
      : undefined

  return {
    workOrderNumber: draft.number,
    workOrderDate: draft.date ?? '',
    effectiveArea: draft.effective_area,
    observations: draft.observations ?? '',
    lotDisplayName,
    selectedCustomerId: draft.customer_id ?? '',
    selectedProjectId: draft.project_id ?? '',
    selectedCampaignId: draft.campaign_id ?? '',
    selectedFieldId: draft.field_id ?? '',
    selectedCropId: draft.crop_id ?? '',
    selectedLotId: draft.lot_id ?? firstLot?.lot_id ?? '',
    selectedLaborId: draft.labor_id ?? '',
    contractor: draft.contractor ?? '',
    selectedInvestorId: draft.investor_id ?? '',
    splitContribution: Boolean(draft.investor_splits && draft.investor_splits.length > 0),
    investorSplits:
      draft.investor_splits?.map((split) => ({
        investor_id: split.investor_id,
        percentage: split.percentage,
      })) ?? [{ investor_id: draft.investor_id ?? 0, percentage: '100' }],
    supplyRows: draft.items.map((item) => ({
      rowId: crypto.randomUUID(),
      supply_id: item.supply_id,
      supply_name: item.supply_name,
      total_used: item.total_used,
      final_dose: item.final_dose.replace('.', ','),
    })),
  }
}
