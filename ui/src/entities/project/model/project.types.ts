export type Project = {
  id: number
  name: string
}

export type ProjectsResponse = {
  items: Project[]
}

export type Lot = {
  id: number
  name: string
  hectares: string
  previous_crop_id: number | null
  previous_crop_name: string | null
  current_crop_id: number | null
  current_crop_name: string | null
  season: string | null
}

export type ProjectField = {
  id: number
  name: string
  project_id: number
  lots: Lot[] | null
}

export type ProjectDetail = {
  id: number
  name: string
  fields: ProjectField[] | null
  investors: Investor[] | null
}


export type Investor = {
  id: number
  name: string
  percentage?: string | null
  archived_at?: string | null
}

export type InvestorSplit = {
  investor_id: number | ''
  percentage: string
}
