import { apiJson } from '../../../shared/api/http'
import type { ProjectDetail } from '../model/project.types'

type GetProjectByIdParams = {
  projectId: number
}

export async function getProjectById({
  projectId,
}: GetProjectByIdParams): Promise<ProjectDetail> {
  return apiJson<ProjectDetail>(`/projects/${projectId}`)
}
