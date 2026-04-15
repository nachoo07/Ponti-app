import { apiJson } from '../../../shared/api/http'
import type { WorkOrderDraftDetail } from '../model/workOrderDraftDetail.types'

export async function getWorkOrderDraftById(draftId: number): Promise<WorkOrderDraftDetail> {
  return apiJson<WorkOrderDraftDetail>(`/work-order-drafts/${draftId}`)
}
