export type Field = {
  id: number
  name: string
  project_id: number
}

export type FieldsResponse = {
  data: Field[]
  page_info: {
    per_page: number
    page: number
    max_page: number
    total: number
  }
}
