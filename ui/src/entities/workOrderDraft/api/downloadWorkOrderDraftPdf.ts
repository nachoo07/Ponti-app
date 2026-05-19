import { generateWorkOrderDraftPdf } from '../lib/generateWorkOrderDraftPdf'
import { getWorkOrderDraftPdfData } from './getWorkOrderDraftPdfData'

export type DownloadWorkOrderDraftPdfResult = {
  blob: Blob
  fileName: string
}

export async function downloadWorkOrderDraftPdf(
  draftId: number,
): Promise<DownloadWorkOrderDraftPdfResult> {
  const pdfData = await getWorkOrderDraftPdfData(draftId, false)
  return generateWorkOrderDraftPdf(pdfData, draftId, false)
}
