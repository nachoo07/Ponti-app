import { ApiError, apiJson } from '../../../shared/api/http'
import type {
  CreateLaborPayload,
  CreateLaborResult,
  CreateLaborsResponse,
} from '../model/labor.types'

export async function createLabor(payload: CreateLaborPayload): Promise<CreateLaborResult> {
  const {
    projectId,
    name,
    categoryId,
    contractorName,
    price = '0',
    isPartialPrice = false,
  } = payload

  const response = await apiJson<CreateLaborsResponse>(`/projects/${projectId}/labors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      labors: [
        {
          name,
          contractor_name: contractorName,
          price,
          is_partial_price: isPartialPrice,
          category_id: categoryId,
        },
      ],
    }),
  })

  // El backend responde 207 con un item por labor; hay que mirar is_saved.
  const first = response?.labors_ids?.[0]

  if (!first || !first.is_saved) {
    const detail = first?.error_detail ?? ''
    const message = /already exists/i.test(detail)
      ? 'Ya existe una labor con ese nombre en el proyecto.'
      : detail || 'No se pudo crear la labor.'
    throw new ApiError(message, 409)
  }

  return { id: first.labor_id, name: first.labor_name }
}
