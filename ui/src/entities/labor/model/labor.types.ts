export type Labor = {
  id: number
  name: string
  category_id: number
  price: string
  is_partial_price: boolean
  contractor_name: string
  category_name: string
  updated_at: string
}

export type LaborsResponse = {
  data: Labor[]
  page_info: {
    per_page: number
    page: number
    max_page: number
    total: number
  }
}
