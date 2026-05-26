import type { Request } from 'express'
import { config } from '../config.js'

export function getManagerHeaders(req: Request): Record<string, string> | null {
  const authorization = req.header('Authorization')

  if (!authorization) {
    return null
  }

  const tenantId = req.header('X-Tenant-Id')?.trim()
  const headers: Record<string, string> = {
    Authorization: authorization,
    'X-API-KEY': config.xApiKey,
  }

  if (tenantId) {
    headers['X-Tenant-Id'] = tenantId
  }

  return headers
}
