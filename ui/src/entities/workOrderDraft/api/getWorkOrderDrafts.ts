import { apiJson } from '../../../shared/api/http'
import type {
  WorkOrderDraftListPageInfo,
  WorkOrderDraftListResponse,
  WorkOrderDraftListItem,
} from '../model/workOrderDraftDetail.types'

type GetWorkOrderDraftsParams = {
  number?: string
  page?: number
  perPage?: number
  status?: 'draft' | 'published' | 'all'
}

export type GetWorkOrderDraftsResult = {
  items: WorkOrderDraftListItem[]
  pageInfo: WorkOrderDraftListPageInfo
}

const defaultPageInfo: WorkOrderDraftListPageInfo = {
  per_page: 20,
  page: 1,
  max_page: 1,
  total: 0,
}

export async function getWorkOrderDrafts({
  number = '',
  page = 1,
  perPage = 20,
  status = 'all',
}: GetWorkOrderDraftsParams = {}): Promise<GetWorkOrderDraftsResult> {
  const query = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
    ...(number ? { number } : {}),
  })

  const json = await apiJson<WorkOrderDraftListResponse>(
    `/work-order-drafts/digital/groups?${query.toString()}`,
  )

  const data = Array.isArray(json.data) ? json.data : []

  const filteredItems =
    status === 'all' ? data : data.filter((draft) => draft.status === status)

  return {
    items: filteredItems,
    pageInfo: json.page_info ?? {
      ...defaultPageInfo,
      page,
      per_page: perPage,
      total: filteredItems.length,
    },
  }
}
