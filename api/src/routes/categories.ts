import type { Request } from 'express'
import { Router } from 'express'
import { config } from '../config.js'
import { managerApi } from '../services/http.js'

const router = Router()

function getManagerHeaders(req: Request) {
  const authorization = req.header('Authorization')

  if (!authorization) {
    return null
  }

  return {
    Authorization: authorization,
    'X-API-KEY': config.xApiKey,
  }
}

router.get('', async (req, res) => {
  const headers = getManagerHeaders(req)

  if (!headers) {
    res.status(401).json({ message: 'Usuario no autenticado' })
    return
  }

  const page = Number(req.query.page ?? 1)
  const perPage = Math.min(Number(req.query.per_page ?? 1000), 1000)
  const typeId = typeof req.query.type_id === 'string' ? Number(req.query.type_id) : undefined

  try {
    const response = await managerApi.get('/categories', {
      params: {
        page,
        per_page: perPage,
        ...(typeId ? { type_id: typeId } : {}),
      },
      headers,
    })

    res.status(200).json(response.data)
  } catch (error: any) {
    res.status(error?.response?.status ?? 500).json(
      error?.response?.data ?? {
        message: 'No se pudieron obtener los rubros',
      },
    )
  }
})

export default router
