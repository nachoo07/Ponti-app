import { apiJson } from '../../../shared/api/http'
import type { CreateWorkOrderDraftResponse } from '../model/workOrderDraft.responses'
import type { CreateWorkOrderDraftPayload } from '../model/workOrderDraft.types'

export async function createWorkOrderDraft(
  payload: CreateWorkOrderDraftPayload,
): Promise<CreateWorkOrderDraftResponse> {
  return apiJson<CreateWorkOrderDraftResponse>('/work-order-drafts/digital', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

