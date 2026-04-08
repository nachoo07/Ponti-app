import type { JwtPayload } from '../model/session.types'

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')

  return atob(padded)
}

export function decodeJwt(token: string): JwtPayload {
  const [, payload] = token.split('.')

  if (!payload) {
    throw new Error('Token JWT invalido.')
  }

  try {
    const decodedPayload = decodeBase64Url(payload)
    return JSON.parse(decodedPayload) as JwtPayload
  } catch {
    throw new Error('No se pudo decodificar el JWT.')
  }
}

export function getTokenExpiration(token: string): number {
  const payload = decodeJwt(token)

  if (!payload.exp || typeof payload.exp !== 'number') {
    throw new Error('El JWT no contiene un exp valido.')
  }

  return payload.exp * 1000
}

export function isTokenExpired(token: string, bufferInSeconds = 0): boolean {
  const expiresAt = getTokenExpiration(token)
  const now = Date.now()
  const bufferInMilliseconds = bufferInSeconds * 1000

  return now >= expiresAt - bufferInMilliseconds
}
