export function formatWorkOrderDraftStatus(status: string): string {
  switch (status) {
    case 'draft':
      return 'Abierta'
    case 'published':
      return 'Cerrada'
    case 'pending_review':
      return 'Revisión pendiente'
    default:
      return status
  }
}
