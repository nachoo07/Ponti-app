export function formatWorkOrderDraftStatus(status: string): string {
  switch (status) {
    case 'draft':
      return 'Abierta'
    case 'published':
      return 'Cerrada'
    default:
      return status
  }
}

