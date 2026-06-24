import { apiJson } from '../../../shared/api/http'

export async function deleteWorkOrderDraft(draftId: number): Promise<void> {
  await apiJson<void>(`/work-order-drafts/${draftId}`, {
    method: 'DELETE',
  })
}