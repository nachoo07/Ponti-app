import { apiJson } from '../../../shared/api/http'
import type { PreviewDigitalWorkOrderNumberResponse } from '../model/workOrderDraft.responses'
import type { BatchPreviewDigitalWorkOrderNumberPayload } from '../model/workOrderDraft.types'

export async function previewBatchDigitalWorkOrderNumber(
  payload: BatchPreviewDigitalWorkOrderNumberPayload,
): Promise<PreviewDigitalWorkOrderNumberResponse> {
  return apiJson<PreviewDigitalWorkOrderNumberResponse>(
    '/work-order-drafts/digital/batch/preview-number',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  )
}
