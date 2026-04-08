import { apiJson } from '../../../shared/api/http'
import type { Field } from '../model/field.types'

type GetFieldsByProjectParams = {
  projectId: number
}

export async function getFieldsByProject({
  projectId,
}: GetFieldsByProjectParams): Promise<Field[]> {
  const json = await apiJson<Field[]>(`/projects/${projectId}/fields`)
  return Array.isArray(json) ? json : []
}


