import type { Response } from 'express'
import { Router } from 'express'
import { config } from '../config.js'
import { identityApi, secureTokenApi } from '../services/http.js'

const router = Router()

type LoginResponse = {
  idToken: string
  refreshToken: string
}

type RefreshResponse = {
  access_token: string
  refresh_token: string
}

type LocalTokenPayload = {
  sub: string
  email: string
  Username: string
  ID: number
  Rol: number
  iat: number
  exp: number
  token_use: 'access' | 'refresh'
}

function normalizeLoginIdentifier(value: string): string {
  const normalizedValue = String(value || '').trim()

  if (!normalizedValue) {
    return ''
  }

  return normalizedValue.includes('@') ? normalizedValue : `${normalizedValue}@ponti.local`
}

function encodeBase64Url(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

function createUnsignedJwt(payload: LocalTokenPayload): string {
  return `${encodeBase64Url({ alg: 'none', typ: 'JWT' })}.${encodeBase64Url(payload)}.`
}

function decodeUnsignedJwtPayload(token: string): LocalTokenPayload | null {
  const [, payload] = String(token || '').split('.')

  if (!payload) {
    return null
  }

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as LocalTokenPayload
  } catch {
    return null
  }
}

function createLocalTokenPair(email: string): RefreshResponse {
  const now = Math.floor(Date.now() / 1000)
  const username = email.split('@')[0] || 'local-dev-user'
  const numericUserId = Number(config.localDevUserId) || 1
  const basePayload = {
    sub: `local:${email}`,
    email,
    Username: username,
    ID: numericUserId,
    Rol: 1,
    iat: now,
  }

  return {
    access_token: createUnsignedJwt({
      ...basePayload,
      exp: now + 60 * 60,
      token_use: 'access',
    }),
    refresh_token: createUnsignedJwt({
      ...basePayload,
      exp: now + 30 * 24 * 60 * 60,
      token_use: 'refresh',
    }),
  }
}

function respondWithLocalLogin(res: Response, email: string) {
  res.status(200).json({
    success: true,
    message: 'Operacion exitosa',
    data: createLocalTokenPair(email),
  })
}

router.post('/login', async (req, res) => {
  const { email: rawEmail, password } = req.body as {
    email?: string
    password?: string
  }
  const email = normalizeLoginIdentifier(rawEmail ?? '')

  if (!email || !password) {
    res.status(400).json({
      type: 'BAD_REQUEST',
      code: 400,
      message: 'email y password son obligatorios',
    })
    return
  }

  try {
    if (config.allowLocalDevAuth) {
      if (config.localDevPassword && password !== config.localDevPassword) {
        res.status(401).json({
          type: 'UNAUTHORIZED',
          code: 401,
          message: 'Credenciales locales invalidas',
        })
        return
      }

      respondWithLocalLogin(res, email)
      return
    }

    const response = await identityApi.post<LoginResponse>(
      `/accounts:signInWithPassword?key=${config.identityPlatformApiKey}`,
      {
        email,
        password,
        returnSecureToken: true,
      },
    )

    res.status(200).json({
      success: true,
      message: 'Operacion exitosa',
      data: {
        access_token: response.data.idToken,
        refresh_token: response.data.refreshToken,
      },
    })
  } catch (error: any) {
    const status = error?.response?.status ?? 500

    if (status === 400 || status === 401) {
      res.status(401).json({
        type: 'UNAUTHORIZED',
        code: 401,
        message: 'Credenciales invalidas',
      })
      return
    }

    res.status(500).json({
      type: 'INTERNAL_ERROR',
      code: 500,
      message: 'No se pudo iniciar sesion',
    })
  }
})

router.get('/access-token', async (req, res) => {
  const authorization = req.header('Authorization')
  const refreshToken = authorization?.replace(/^Bearer\s+/i, '').trim()

  if (!refreshToken) {
    res.status(401).json({
      type: 'UNAUTHORIZED',
      code: 401,
      message: 'Refresh token requerido',
    })
    return
  }

  try {
    if (config.allowLocalDevAuth) {
      const payload = decodeUnsignedJwtPayload(refreshToken)

      if (
        !payload ||
        payload.token_use !== 'refresh' ||
        payload.exp * 1000 <= Date.now()
      ) {
        res.status(401).json({
          type: 'UNAUTHORIZED',
          code: 401,
          message: 'Refresh token invalido',
        })
        return
      }

      res.status(200).json(createLocalTokenPair(payload.email))
      return
    }

    const response = await secureTokenApi.post(
      `/token?key=${config.identityPlatformApiKey}`,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    )

    res.status(200).json({
      access_token: response.data.id_token,
      refresh_token: response.data.refresh_token,
    } satisfies RefreshResponse)
  } catch {
    res.status(401).json({
      type: 'UNAUTHORIZED',
      code: 401,
      message: 'La sesion no pudo renovarse',
    })
  }
})

export default router
