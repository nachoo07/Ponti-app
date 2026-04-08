import { apiJson } from '../../../shared/api/http'
import type { Labor, LaborsResponse } from '../model/labor.types'

type GetLaborsByProjectParams = {
  projectId: number
}

export async function getLaborsByProject({
  projectId,
}: GetLaborsByProjectParams): Promise<Labor[]> {
  const json = await apiJson<LaborsResponse>(`/projects/${projectId}/labors`)
  return Array.isArray(json.data) ? json.data : []
}

