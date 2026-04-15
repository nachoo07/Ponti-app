import { apiJson } from '../../../shared/api/http'
import type { Supply, SuppliesResponse } from '../model/supply.types'

type GetSuppliesByProjectParams = {
  projectId: number
  page?: number
  perPage?: number
}

export async function getSuppliesByProject({
  projectId,
  page = 1,
  perPage = 100,
}: GetSuppliesByProjectParams): Promise<Supply[]> {
  const query = new URLSearchParams({
    project_id: String(projectId),
    page: String(page),
    per_page: String(perPage),
  })

  const json = await apiJson<SuppliesResponse>(`/supplies?${query.toString()}`)
  return Array.isArray(json.data) ? json.data : []
}

