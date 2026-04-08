export type WorkOrderDraftItemPayload = {
  supply_id: number
  total_used: string
  final_dose?: string
}

export type WorkOrderDraftInvestorSplitPayload = {
  investor_id: number
  percentage: string
}

export type CreateWorkOrderDraftPayload = {
  number?: string
  date: string
  customer_id: number
  project_id: number
  campaign_id?: number | null
  field_id: number
  lot_id: number
  crop_id: number
  labor_id: number
  contractor: string
  effective_area: string
  observations: string
  investor_id: number
  investor_splits?: WorkOrderDraftInvestorSplitPayload[]
  items: WorkOrderDraftItemPayload[]
}

export type BatchPreviewDigitalWorkOrderNumberPayload = {
  project_id: number
  number?: string
}

export type BatchDigitalWorkOrderLotItemPayload = {
  supply_id: number
  total_used: string
}

export type BatchDigitalWorkOrderLotPayload = {
  lot_id: number
  effective_area: string
  items: BatchDigitalWorkOrderLotItemPayload[]
}

export type CreateBatchWorkOrderDraftPayload = {
  number?: string
  date: string
  customer_id: number
  project_id: number
  campaign_id?: number | null
  field_id: number
  crop_id: number
  labor_id: number
  contractor: string
  observations: string
  investor_id: number
  investor_splits?: WorkOrderDraftInvestorSplitPayload[]
  lots: BatchDigitalWorkOrderLotPayload[]
}
