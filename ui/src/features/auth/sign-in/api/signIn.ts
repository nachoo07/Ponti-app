import { buildSession } from '../../../../entities/session/lib/session'
import { API_BASE_URL } from '../../../../shared/config/api'
import type {
  SignInPayload,
  SignInResponse,
  LoginResponseDto,
  LoginTokensDto,
} from '../model/signIn.types'

function normalizeLoginIdentifier(value: string): string {
  const normalizedValue = value.trim()

  if (!normalizedValue) {
    throw new Error('Completa usuario/email y password.')
  }

  return normalizedValue.includes('@') ? normalizedValue : `${normalizedValue}@ponti.local`
}

function isLoginTokensDto(value: unknown): value is LoginTokensDto {
  if (!value || typeof value !== 'object') {
    return false
  }

  const dto = value as Partial<LoginTokensDto>

  return typeof dto.access_token === 'string' && typeof dto.refresh_token === 'string'
}

function isLoginResponseDto(value: unknown): value is LoginResponseDto {
  if (!value || typeof value !== 'object') {
    return false
  }

  const dto = value as Partial<LoginResponseDto>

  return (
    typeof dto.success === 'boolean' &&
    typeof dto.message === 'string' &&
    isLoginTokensDto(dto.data)
  )
}

export async function signIn(payload: SignInPayload): Promise<SignInResponse> {
  const email = normalizeLoginIdentifier(payload.email)
  const password = payload.password.trim()

  if (!password) {
    throw new Error('Completa usuario/email y password.')
  }

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  })

  if (response.status === 401) {
    throw new Error('Credenciales invalidas.')
  }

  if (response.status === 403) {
    throw new Error('No tenes permisos para iniciar sesion.')
  }

  if (!response.ok) {
    throw new Error(`Error al iniciar sesion: ${response.status}`)
  }

  const json: unknown = await response.json()

  if (!isLoginResponseDto(json)) {
    throw new Error('La respuesta de login no tiene el formato esperado.')
  }

  return buildSession({
    accessToken: json.data.access_token,
    refreshToken: json.data.refresh_token,
  })
}

