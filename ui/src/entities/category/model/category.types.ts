export type Category = {
  id: number
  name: string
  type_id: number
}

export type CategoriesResponse = {
  data: Category[]
  page_info: {
    per_page: number
    page: number
    max_page: number
    total: number
  }
}

// type_id del backend (`public.types`). Labor = 4 (verificado en core + web).
export const LABOR_TYPE_ID = 4
