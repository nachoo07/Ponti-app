import { Router } from 'express'
import { managerApi } from '../services/http.js'
import { getManagerHeaders } from './managerHeaders.js'

const router = Router()

router.get('/context', async (req, res) => {
  const headers = getManagerHeaders(req)

  if (!headers) {
    res.status(401).json({ message: 'Usuario no autenticado' })
    return
  }

  try {
    const response = await managerApi.get('/me/context', {
      headers,
    })

    res.status(200).json(response.data)
  } catch (error: any) {
    res.status(error?.response?.status ?? 500).json(
      error?.response?.data ?? {
        message: 'No se pudo obtener el contexto de usuario',
      },
    )
  }
})

export default router
