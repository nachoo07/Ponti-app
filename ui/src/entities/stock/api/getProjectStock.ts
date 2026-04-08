import { apiJson } from '../../../shared/api/http'
import type { GetStocksResponse, StockItem } from '../model/stock.types'

export async function getProjectStock(
  projectId: number,
  cutoffDate = '',
): Promise<StockItem[]> {
  const query = new URLSearchParams({
    cutoff_date: cutoffDate,
  })

  const json = await apiJson<GetStocksResponse>(`/stock/${projectId}?${query.toString()}`)
  return Array.isArray(json.items) ? json.items : []
}
