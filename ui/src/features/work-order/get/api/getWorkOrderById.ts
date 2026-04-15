import { apiJson } from '../../../../shared/api/http'
import type { WorkOrderResponse } from '../../../../entities/work-order/model/workOrder.types'

type GetWorkOrderByIdParams = {
  id: number
}

export async function getWorkOrderById({ id }: GetWorkOrderByIdParams): Promise<WorkOrderResponse> {
  return apiJson<WorkOrderResponse>(`/work-orders/${id}`)
}
