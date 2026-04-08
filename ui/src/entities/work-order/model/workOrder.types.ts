export type WorkOrderItem = {
  supply_id: number
  total_used: string
  final_dose: string
}

export type WorkOrderInvestorSplit = {
  investor_id: number
  percentage: string
}

export type WorkOrderResponse = {
  id: number
  number: string
  project_id: number
  field_id: number
  lot_id: number
  crop_id: number
  labor_id: number
  contractor: string
  observations: string
  date: string
  investor_id: number
  investor_splits?: WorkOrderInvestorSplit[]
  effective_area: string
  items: WorkOrderItem[]
}

export type ApiSuccess<T> = {
  success: boolean
  data: T
}
