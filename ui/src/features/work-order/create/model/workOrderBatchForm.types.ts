export type BatchSharedSupplyFormRow = {
  rowId: string
  supply_id: number | ''
  supply_name?: string
  total_used: string
  final_dose: string
  last_edited_field?: 'total_used' | 'final_dose'
}

export type BatchSelectedLotFormRow = {
  rowId: string
  lot_id: number
  lot_name: string
  effective_area: string
  crop_id: number | null
  crop_name: string | null
}

export type WorkOrderBatchFormValues = {
  workOrderNumber: string
  workOrderDate: string
  observations: string
  selectedCustomerId: number
  selectedProjectId: number
  selectedFieldId: number
  selectedLaborId: number
  contractor: string
  selectedInvestorId: number
  splitContribution: boolean
  investorSplits: {
    investor_id: number
    percentage: string
  }[]
  selectedLots: BatchSelectedLotFormRow[]
  supplyRows: BatchSharedSupplyFormRow[]
}
