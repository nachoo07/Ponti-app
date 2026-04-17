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

router.post('/login', async (req, res) => {
  const { email, password } = req.body as {
    email?: string
    password?: string
  }

  if (!email || !password) {
    res.status(400).json({
      type: 'BAD_REQUEST',
      code: 400,
      message: 'email y password son obligatorios',
    })
    return
  }

  try {
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
