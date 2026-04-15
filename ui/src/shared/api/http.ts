import { getSession } from '../../entities/session/model/session.store'
import { API_BASE_URL } from '../config/api'
import { refreshSession } from './auth'

type RequestOptions = Omit<RequestInit, 'headers'> & {
  headers?: HeadersInit
  requiresAuth?: boolean
}

type ApiErrorPayload = {
  message?: string
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function buildUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

function buildHeaders(headers?: HeadersInit): Headers {
  return new Headers(headers)
}

function getApiErrorMessage(status: number): string {
  if (status === 401) {
    return 'La sesion es invalida o expiro.'
  }

  if (status === 403) {
    return 'No tenes permisos para realizar esta accion.'
  }

  if (status === 409) {
    return 'Conflicto de datos. Revisá la información e intentá de nuevo.'
  }

  if (status === 500) {
    return 'Ocurrio un error interno en el servidor.'
  }

  return `Error de API: ${status}`
}

async function performRequest(path: string, options: RequestOptions = {}): Promise<Response> {
  const { headers, requiresAuth = true, ...requestInit } = options
  const nextHeaders = buildHeaders(headers)

  if (requiresAuth) {
    const session = getSession()

    if (!session?.accessToken) {
      throw new Error('No hay una sesion activa.')
    }

    nextHeaders.set('Authorization', `Bearer ${session.accessToken}`)
  }

  return fetch(buildUrl(path), {
    ...requestInit,
    headers: nextHeaders,
  })
}

export async function apiFetch(path: string, options: RequestOptions = {}): Promise<Response> {
  const response = await performRequest(path, options)

  if (response.status !== 401 || options.requiresAuth === false) {
    return response
  }

  const nextSession = await refreshSession()

  if (!nextSession) {
    return response
  }

  return performRequest(path, options)
}

function normalizeApiMessage(message: string, status: number): string {
  const trimmed = message.trim()

  const duplicateWorkOrderMatch = trimmed.match(
    /^work order already exists for number (.+) and project (\d+)$/i,
  )

  if (duplicateWorkOrderMatch) {
    const [, number] = duplicateWorkOrderMatch
    return `Ya existe una orden para el número ${number} en este proyecto.`
  }

  if (/^failed to create work order draft items$/i.test(trimmed)) {
    return 'No se pudieron crear los insumos de la orden.'
  }

  if (status === 409 && /^conflict/i.test(trimmed)) {
    return 'Conflicto de datos. Revisá la información e intentá de nuevo.'
  }

  return trimmed
}

async function buildApiError(response: Response): Promise<ApiError> {
  const fallbackMessage = getApiErrorMessage(response.status)
  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.includes('application/json')) {
    return new ApiError(fallbackMessage, response.status)
  }

  try {
    const payload = (await response.json()) as ApiErrorPayload
    const rawMessage = payload.message?.trim() || fallbackMessage
    const normalizedMessage = normalizeApiMessage(rawMessage, response.status)
    return new ApiError(normalizedMessage, response.status)
  } catch {
    return new ApiError(fallbackMessage, response.status)
  }
}

export async function apiJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await apiFetch(path, options)

  if (!response.ok) {
    throw await buildApiError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const contentLength = response.headers.get('content-length')
  const contentType = response.headers.get('content-type') ?? ''
  const text = await response.text()

  if (contentLength === '0' || text.trim() === '') {
    return undefined as T
  }

  if (!contentType.includes('application/json')) {
    return text as T
  }

  return JSON.parse(text) as T
}
