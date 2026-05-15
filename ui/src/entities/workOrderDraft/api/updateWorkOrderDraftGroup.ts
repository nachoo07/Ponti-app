import { apiJson } from '../../../shared/api/http'
import type { WorkOrderDraftGroupDetail } from '../model/workOrderDraftDetail.types'
import type { UpdateWorkOrderDraftGroupPayload } from '../model/workOrderDraft.types'

export async function updateWorkOrderDraftGroup(
  draftId: number,
  payload: UpdateWorkOrderDraftGroupPayload,
): Promise<WorkOrderDraftGroupDetail> {
  return apiJson<WorkOrderDraftGroupDetail>(`/work-order-drafts/${draftId}/group`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}