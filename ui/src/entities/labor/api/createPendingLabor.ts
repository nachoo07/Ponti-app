import { apiJson } from '../../../shared/api/http'
import type {
  CreatePendingLaborPayload,
  CreatePendingLaborResponse,
} from '../model/labor.types'

export async function createPendingLabor(
  payload: CreatePendingLaborPayload,
): Promise<CreatePendingLaborResponse> {
  return apiJson<CreatePendingLaborResponse>(
    `/projects/${payload.project_id}/labors/pending`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: payload.name }),
    },
  )
}
