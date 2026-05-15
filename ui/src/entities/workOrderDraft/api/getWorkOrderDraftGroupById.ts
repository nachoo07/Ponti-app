import { apiJson } from '../../../shared/api/http'
import type { WorkOrderDraftGroupDetail } from '../model/workOrderDraftDetail.types'

export async function getWorkOrderDraftGroupById(
  draftId: number,
): Promise<WorkOrderDraftGroupDetail> {
  return apiJson<WorkOrderDraftGroupDetail>(`/work-order-drafts/${draftId}/group`)
}
