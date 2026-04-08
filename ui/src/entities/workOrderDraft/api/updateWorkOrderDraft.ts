import { apiJson } from '../../../shared/api/http'

export async function updateWorkOrderDraft(
  draftId: number,
  payload: unknown,
): Promise<void> {
  await apiJson<void>(`/work-order-drafts/${draftId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}
