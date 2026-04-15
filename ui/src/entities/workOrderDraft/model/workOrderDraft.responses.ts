export type CreateWorkOrderDraftResponse = {
  id: number
}

export type PreviewDigitalWorkOrderNumberResponse = {
  number: string
}

export type CreateBatchWorkOrderDraftResponseItem = {
  id: number
  number: string
  lot_id: number
  lot_name?: string | null
  effective_area: string
}

export type CreateBatchWorkOrderDraftResponse = {
  items: CreateBatchWorkOrderDraftResponseItem[]
}

export type PublishWorkOrderDraftResponse = {
  draft_id: number
  published_work_order_id: number
  status: 'published'
}

