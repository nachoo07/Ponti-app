import { apiJson } from '../../../shared/api/http'
import type { PreviewDigitalWorkOrderNumberResponse } from '../model/workOrderDraft.responses'

export type PreviewDigitalWorkOrderNumberPayload = {
  project_id: number
  number?: string
}

export async function previewDigitalWorkOrderNumber(
  payload: PreviewDigitalWorkOrderNumberPayload,
): Promise<PreviewDigitalWorkOrderNumberResponse> {
  return apiJson<PreviewDigitalWorkOrderNumberResponse>(
    '/work-order-drafts/digital/preview-number',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  )
}
