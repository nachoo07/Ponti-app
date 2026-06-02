import { apiJson } from '../../../shared/api/http'
import type { CategoriesResponse, Category } from '../model/category.types'

type GetCategoriesParams = {
  typeId?: number
  page?: number
  perPage?: number
}

export async function getCategories({
  typeId,
  page = 1,
  perPage = 1000,
}: GetCategoriesParams = {}): Promise<Category[]> {
  const query = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  })

  const json = await apiJson<CategoriesResponse>(`/categories?${query.toString()}`)
  const data = Array.isArray(json.data) ? json.data : []

  return typeof typeId === 'number'
    ? data.filter((category) => category.type_id === typeId)
    : data
}
