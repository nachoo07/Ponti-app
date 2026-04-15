import { apiJson } from '../../../shared/api/http'
import type { Project, ProjectsResponse } from '../model/project.types'

type GetProjectsParams = {
  customerId?: number
  campaignId?: number
  name?: string
  page?: number
  perPage?: number
}

export async function getProjects({
  customerId,
  campaignId,
  name = '',
  page = 1,
  perPage = 100,
}: GetProjectsParams = {}): Promise<Project[]> {
  const query = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
    ...(name ? { name } : {}),
    ...(customerId ? { customer_id: String(customerId) } : {}),
    ...(campaignId ? { campaign_id: String(campaignId) } : {}),
  })

  const json = await apiJson<ProjectsResponse>(`/projects?${query.toString()}`)

  return json.items
}
