export type Supply = {
  id: number
  name: string
  price: string
  is_partial_price?: boolean
  unit_id?: number
  unit_name?: string
  category_id?: number
  category_name: string
  type_id?: number
  type_name: string
  is_pending?: boolean
  available_stock?: string
  available_unit?: string
}

export type SuppliesResponse = {
  data: Supply[]
  page_info: {
    per_page: number
    page: number
    max_page: number
    total: number
  }
  total_kg: string
  total_lts: string
  total_net_usd: string
}

export type CreatePendingSupplyPayload = {
  project_id: number
  name: string
}

export type CreatePendingSupplyResponse = {
  id: number
  name: string
  is_pending: boolean
  created: boolean
}

export type SupplyRow = {
  rowId: string
  supply_id: number | ''
  supply_name?: string
  total_used: string
  final_dose: string
}
