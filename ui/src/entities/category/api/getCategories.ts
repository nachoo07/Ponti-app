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

  // El filtro se hace en el backend (manager API acepta type_id); así el per_page
  // aplica a las categorías del tipo pedido, no a la mezcla de todos los tipos.
  if (typeof typeId === 'number') {
    query.set('type_id', String(typeId))
  }

  const json = await apiJson<CategoriesResponse>(`/categories?${query.toString()}`)
  const data = Array.isArray(json.data) ? json.data : []

  // Defensa barata por si el backend ignorara el filtro.
  return typeof typeId === 'number'
    ? data.filter((category) => category.type_id === typeId)
    : data
}
