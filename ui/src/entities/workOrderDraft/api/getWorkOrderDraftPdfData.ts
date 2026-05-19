import { apiJson } from '../../../shared/api/http'
import type { WorkOrderDraftPdfData } from '../model/workOrderDraftPdf.types'

export async function getWorkOrderDraftPdfData(
  draftId: number,
  isGrouped: boolean,
): Promise<WorkOrderDraftPdfData> {
  const endpoint = isGrouped
    ? `/work-order-drafts/${draftId}/group-pdf-data`
    : `/work-order-drafts/${draftId}/pdf-data`

  return apiJson<WorkOrderDraftPdfData>(endpoint)
}
