import { apiJson } from '../../../shared/api/http'
import type {
  CreatePendingSupplyPayload,
  CreatePendingSupplyResponse,
} from '../model/supply.types'

export async function createPendingSupply(
  payload: CreatePendingSupplyPayload,
): Promise<CreatePendingSupplyResponse> {
  return apiJson<CreatePendingSupplyResponse>('/supplies/pending', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

