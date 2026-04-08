import { apiJson } from '../../../shared/api/http'
import type { Campaign, CampaignsResponse } from '../model/campaign.types'

type GetCampaignsParams = {
  customerId?: number
  projectName?: string
  page?: number
  perPage?: number
}

export async function getCampaigns({
  customerId,
  projectName = '',
  page = 1,
  perPage = 100,
}: GetCampaignsParams = {}): Promise<Campaign[]> {
  const query = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
    ...(customerId ? { customer_id: String(customerId) } : {}),
    ...(projectName ? { project_name: projectName } : {}),
  })

  const json = await apiJson<CampaignsResponse>(`/campaigns?${query.toString()}`)

  return Array.isArray(json) ? json : []
}


