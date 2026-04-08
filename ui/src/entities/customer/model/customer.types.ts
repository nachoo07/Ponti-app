export type Customer = {
  id: number
  name: string
}

export type CustomersResponse = {
  data: Customer[]
  page_info: {
    per_page: number
    page: number
    max_page: number
    total: number
  }
}

