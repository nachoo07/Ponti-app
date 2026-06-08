export type Labor = {
  id: number
  name: string
  category_id: number
  price: string
  is_partial_price: boolean
  contractor_name: string
  category_name: string
  updated_at: string
  is_pending?: boolean
}

export type CreatePendingLaborPayload = {
  project_id: number
  name: string
}

export type CreatePendingLaborResponse = {
  id: number
  name: string
  is_pending: boolean
  created: boolean
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

export type CreateLaborPayload = {
  projectId: number
  name: string
  categoryId: number
  contractorName: string
  price?: string
  isPartialPrice?: boolean
}

export type CreateLaborResult = {
  id: number
  name: string
}

// El backend crea labores en batch y responde 207 con un item por labor.
export type CreateLaborsResponse = {
  message: string
  labors_ids: {
    labor_name: string
    labor_id: number
    is_saved: boolean
    error_detail: string
  }[]
}
