import { apiJson } from '../../../shared/api/http'
import type { MeContext, MeContextResponseDto } from '../model/tenant.types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function resolveMeContextPayload(value: MeContextResponseDto): MeContext {
  if (!isRecord(value)) {
    return {}
  }

  const record = value as Record<string, unknown>

  if (record.success === true && isRecord(record.data)) {
    return record.data as MeContext
  }

  return value as MeContext
}

export async function getMeContext(): Promise<MeContext> {
  const json = await apiJson<MeContextResponseDto>('/me/context', {
    skipTenant: true,
  })

  return resolveMeContextPayload(json)
}
