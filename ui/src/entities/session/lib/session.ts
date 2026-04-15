import { decodeJwt, getTokenExpiration, isTokenExpired } from './jwt'
import type { Session, User } from '../model/session.types'

function buildUserFromAccessToken(accessToken: string): User {
  const payload = decodeJwt(accessToken)

  const email = typeof payload.email === 'string' ? payload.email : ''
  const id = typeof payload.sub === 'string' ? payload.sub : ''
  const fallbackName = email.includes('@') ? email.split('@')[0] : email

  if (!id) {
    throw new Error('El access token no contiene un sub valido.')
  }

  return {
    id,
    email,
    name: fallbackName,
  }
}

export function buildSession(params: {
  accessToken: string
  refreshToken: string
}): Session {
  const { accessToken, refreshToken } = params

  return {
    accessToken,
    refreshToken,
    user: buildUserFromAccessToken(accessToken),
    expiresAt: getTokenExpiration(accessToken),
  }
}

export function isSessionExpired(session: Session, bufferInSeconds = 0): boolean {
  return isTokenExpired(session.accessToken, bufferInSeconds)
}
