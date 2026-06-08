type PageInfo = {
  per_page: number
  page: number
  max_page: number
  total: number
}

type LaborCatalogResponse = {
  data: unknown[]
  page_info: PageInfo
}

const emptyPageInfo: PageInfo = {
  per_page: 0,
  page: 1,
  max_page: 0,
  total: 0,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function pageInfoFromLength(length: number): PageInfo {
  return {
    per_page: length,
    page: 1,
    max_page: length > 0 ? 1 : 0,
    total: length,
  }
}

function normalizePageInfo(value: unknown, fallbackLength: number): PageInfo {
  if (!isRecord(value)) {
    return fallbackLength > 0 ? pageInfoFromLength(fallbackLength) : emptyPageInfo
  }

  return {
    per_page:
      typeof value.per_page === 'number' ? value.per_page : pageInfoFromLength(fallbackLength).per_page,
    page: typeof value.page === 'number' ? value.page : 1,
    max_page:
      typeof value.max_page === 'number' ? value.max_page : pageInfoFromLength(fallbackLength).max_page,
    total: typeof value.total === 'number' ? value.total : fallbackLength,
  }
}

export function buildLaborCatalogResponse(payload: unknown): LaborCatalogResponse {
  if (Array.isArray(payload)) {
    return {
      data: payload,
      page_info: pageInfoFromLength(payload.length),
    }
  }

  if (!isRecord(payload)) {
    return {
      data: [],
      page_info: emptyPageInfo,
    }
  }

  if (Array.isArray(payload.data)) {
    return {
      data: payload.data,
      page_info: normalizePageInfo(payload.page_info, payload.data.length),
    }
  }

  if (isRecord(payload.data) && Array.isArray(payload.data.data)) {
    return {
      data: payload.data.data,
      page_info: normalizePageInfo(payload.data.page_info, payload.data.data.length),
    }
  }

  return {
    data: [],
    page_info: emptyPageInfo,
  }
}
