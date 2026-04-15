export type StockItem = {
  id: number
  supply_name: string
  investor_name: string
  stock_units: string
  real_stock_units: string
  stock_difference: string
  total_usd: string
  class_type: string
  close_date: string | null
  supply_unit_id: number
  supply_unit_price: string
  entry_stock: string
  out_stock: string
  consumed: string
}

export type GetStocksResponse = {
  items: StockItem[]
  net_total_usd: string
  total_liters: string
  total_kilograms: string
}
