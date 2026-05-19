import { generateWorkOrderDraftPdf } from '../lib/generateWorkOrderDraftPdf'
import { getWorkOrderDraftPdfData } from './getWorkOrderDraftPdfData'

export type DownloadWorkOrderDraftGroupPdfResult = {
  blob: Blob
  fileName: string
}

export async function downloadWorkOrderDraftGroupPdf(
  draftId: number,
): Promise<DownloadWorkOrderDraftGroupPdfResult> {
  const pdfData = await getWorkOrderDraftPdfData(draftId, true)
  return generateWorkOrderDraftPdf(pdfData, draftId, true)
}
