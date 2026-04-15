import { apiJson } from '../../../shared/api/http'
import type { Customer, CustomersResponse } from '../model/customer.types'

type GetCustomersParams = {
  page?: number
  perPage?: number
}

export async function getCustomers({
  page = 1,
  perPage = 100,
}: GetCustomersParams = {}): Promise<Customer[]> {
  const query = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  })

  const json = await apiJson<CustomersResponse>(`/customers?${query.toString()}`)

  return Array.isArray(json.data) ? json.data : []
}

