import { notifyAuthSessionChanged } from '../../app/providers/auth-session-bridge'
import { buildSession } from '../../entities/session/lib/session'
import { clearSession, getSession, setSession } from '../../entities/session/model/session.store'
import { API_BASE_URL } from '../config/api'
import type { Session } from '../../entities/session/model/session.types'

type RefreshTokenResponseDto = {
  access_token: string
  refresh_token: string
}

let refreshSessionPromise: Promise<Session | null> | null = null

function isRefreshTokenResponseDto(value: unknown): value is RefreshTokenResponseDto {
  if (!value || typeof value !== 'object') {
    return false
  }

  const dto = value as Partial<RefreshTokenResponseDto>

  return typeof dto.access_token === 'string' && typeof dto.refresh_token === 'string'
}

async function requestSessionRefresh(refreshToken: string): Promise<Session> {
  const response = await fetch(`${API_BASE_URL}/auth/access-token`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${refreshToken}`,
    },
  })

  if (response.status === 401 || response.status === 403) {
    throw new Error('La sesion no pudo renovarse.')
  }

  if (!response.ok) {
    throw new Error(`Error al refrescar sesion: ${response.status}`)
  }

  const json: unknown = await response.json()

  if (!isRefreshTokenResponseDto(json)) {
    throw new Error('La respuesta de refresh no tiene el formato esperado.')
  }

  return buildSession({
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
  })
}

export async function refreshSession(): Promise<Session | null> {
  const currentSession = getSession()

  if (!currentSession?.refreshToken) {
    clearSession()
    notifyAuthSessionChanged(null)
    return null
  }

  const refreshTokenAtStart = currentSession.refreshToken

  if (!refreshSessionPromise) {
    refreshSessionPromise = requestSessionRefresh(refreshTokenAtStart)
      .then((nextSession) => {
        const latestSession = getSession()

        if (!latestSession || latestSession.refreshToken !== refreshTokenAtStart) {
          return null
        }

        setSession(nextSession)
        notifyAuthSessionChanged(nextSession)
        return nextSession
      })
      .catch(() => {
        const latestSession = getSession()

        if (!latestSession || latestSession.refreshToken !== refreshTokenAtStart) {
          return null
        }

        clearSession()
        notifyAuthSessionChanged(null)
        return null
      })
      .finally(() => {
        refreshSessionPromise = null
      })
  }

  return refreshSessionPromise
}
