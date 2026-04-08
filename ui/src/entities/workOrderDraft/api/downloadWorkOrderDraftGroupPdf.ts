import { ApiError, apiFetch } from '../../../shared/api/http'

export type DownloadWorkOrderDraftGroupPdfResult = {
  blob: Blob
  fileName: string
}

function resolveFileName(contentDisposition: string | null, draftId: number): string {
  if (!contentDisposition) {
    return `work-order-draft-group-${draftId}.pdf`
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1])
  }

  const asciiMatch = contentDisposition.match(/filename="?([^"]+)"?/i)
  if (asciiMatch?.[1]) {
    return asciiMatch[1]
  }

  return `work-order-draft-group-${draftId}.pdf`
}

export async function downloadWorkOrderDraftGroupPdf(
  draftId: number,
): Promise<DownloadWorkOrderDraftGroupPdfResult> {
  const response = await apiFetch(`/work-order-drafts/${draftId}/group-pdf`)

  if (!response.ok) {
    throw new ApiError('No se pudo descargar el PDF grupal del borrador.', response.status)
  }

  const blob = await response.blob()
  const fileName = resolveFileName(response.headers.get('content-disposition'), draftId)

  return {
    blob,
    fileName,
  }
}
