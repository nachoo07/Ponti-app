import axios from 'axios'
import { config } from '../config.js'
import { logger } from '../logger.js'

export const managerApi = axios.create({
  baseURL: config.baseManagerApi,
  timeout: 15000,
})

// Observabilidad de las llamadas al backend de Ponti (Manager API).
// Cubre los try/catch de las rutas sin tocarlos uno por uno.
// No se loguean headers (X-API-KEY / Authorization), ni el body del request,
// ni el body de la respuesta (puede contener PII de clientes/proyectos).
managerApi.interceptors.request.use((requestConfig) => {
  ;(requestConfig as { metadata?: { startedAt: number } }).metadata = {
    startedAt: Date.now(),
  }
  return requestConfig
})

function durationMs(requestConfig: unknown): number | undefined {
  const startedAt = (requestConfig as { metadata?: { startedAt: number } } | undefined)?.metadata
    ?.startedAt
  return typeof startedAt === 'number' ? Date.now() - startedAt : undefined
}

function fullUrl(requestConfig: { baseURL?: string; url?: string } | undefined): string {
  return `${requestConfig?.baseURL ?? ''}${requestConfig?.url ?? ''}`
}

managerApi.interceptors.response.use(
  (response) => {
    logger.info('manager_api_response', {
      method: response.config.method?.toUpperCase(),
      url: fullUrl(response.config),
      status: response.status,
      durationMs: durationMs(response.config),
    })
    return response
  },
  (error) => {
    const requestConfig = error?.config
    logger.error('manager_api_error', {
      method: requestConfig?.method?.toUpperCase(),
      url: fullUrl(requestConfig),
      status: error?.response?.status,
      code: error?.code,
      durationMs: durationMs(requestConfig),
    })
    return Promise.reject(error)
  },
)

export const identityApi = axios.create({
  baseURL: 'https://identitytoolkit.googleapis.com/v1',
  timeout: 15000,
})

export const secureTokenApi = axios.create({
  baseURL: 'https://securetoken.googleapis.com/v1',
  timeout: 15000,
})
