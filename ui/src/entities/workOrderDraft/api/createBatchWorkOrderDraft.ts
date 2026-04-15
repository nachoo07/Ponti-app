import { apiJson } from '../../../shared/api/http'
import type { CreateBatchWorkOrderDraftResponse } from '../model/workOrderDraft.responses'
import type { CreateBatchWorkOrderDraftPayload } from '../model/workOrderDraft.types'

export async function createBatchWorkOrderDraft(
  payload: CreateBatchWorkOrderDraftPayload,
): Promise<CreateBatchWorkOrderDraftResponse> {
  return apiJson<CreateBatchWorkOrderDraftResponse>('/work-order-drafts/digital/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}
