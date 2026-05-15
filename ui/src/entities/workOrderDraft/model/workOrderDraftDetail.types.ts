export type WorkOrderDraftItem = {
  supply_id: number
  supply_name?: string
  total_used: string
  final_dose: string
}

export type WorkOrderDraftInvestorSplit = {
  investor_id: number
  percentage: string
}

export type WorkOrderDraftDetail = {
  id: number
  number: string
  date: string
  customer_id: number
  customer_name?: string
  project_id: number
  campaign_id?: number | null
  campaign_name?: string | null
  field_id: number
  lot_id: number
  crop_id: number
  labor_id: number
  contractor: string
  effective_area: string
  observations: string
  investor_id: number
  status: string
  is_digital?: boolean
  review_notes: string
  published_work_order_id?: number | null
  items: WorkOrderDraftItem[]
  investor_splits?: WorkOrderDraftInvestorSplit[]
  created_at: string
  updated_at: string
  project_name: string
  field_name: string
}

export type WorkOrderDraftListItem = {
  id: number
  number: string
  date: string
  project_id: number
  project_name: string
  field_id: number
  field_name: string
  status: string
  is_digital?: boolean
  lots_count?: number
  effective_area?: string
  created_at: string
}

export type WorkOrderDraftListPageInfo = {
  per_page: number
  page: number
  max_page: number
  total: number
}

export type WorkOrderDraftListResponse = {
  page_info?: WorkOrderDraftListPageInfo
  data: WorkOrderDraftListItem[]
}

export type WorkOrderDraftGroupLot = {
  draft_id: number
  number: string
  lot_id: number
  lot_name: string
  effective_area: string
  status: string
}

export type WorkOrderDraftGroupDetail = Partial<WorkOrderDraftDetail> & {
  id: number
  number: string
  effective_area: string
  status: string
  lots: WorkOrderDraftGroupLot[]
  items: WorkOrderDraftItem[]
}
